#!/usr/bin/env node
'use strict';

/**
 * inferall-bulk-apikey CLI — mint InferAll accounts, one API key per account,
 * and keep only the keys that survived a live chat + tools gate.
 *
 * InferAll is a Next.js app on Vercel in front of a Supabase project and a
 * separate inference gateway. Three surfaces are involved, measured 2026-10-20:
 *
 *   app        https://inferall.ai        sign-in page, and the e-mail gate
 *              POST /api/turnstile/verify — its own bot gate: it only checks that
 *              a turnstile token is *non-empty* (a junk string answers ok:true);
 *              the real check is Supabase's, next to the OTP call.
 *   identity   https://<ref>.supabase.co  Cloudflare Turnstile sitekey
 *              0x4AAAAAADhj5AjLCn-67Znk, enforced as `gotrue_meta_security.captcha_token`
 *              on /auth/v1/otp. The mail it sends carries a *link*, not a code:
 *              /auth/v1/verify?token=…&type=signup&redirect_to=…
 *   gateway    https://api.inferall.ai    POST /ai/v1/keys with the Supabase
 *              access token → the plaintext key (`ifu_…`); POST /v1/chat/completions
 *              with the key.
 *
 * Flow, per account, every panel request through one exit from your pool:
 *   1. mailbox    temp.tf hotmail/outlook plus-alias (one address per account)
 *   2. page       /auth in a real Chrome, pinned to that exit
 *   3. turnstile  the widget mounted in that page and clicked until it answers
 *                 (the token is bound to the solving IP, so the page and the
 *                 Supabase call below must share one exit)
 *   4. otp        POST /auth/v1/otp {captcha_token} → confirm link by mail
 *   5. session    POST /auth/v1/verify {type, token} → access token
 *   6. key        POST api.inferall.ai/ai/v1/keys (Bearer access token) → `ifu_…`
 *   7. gate       /v1/chat/completions: chat-200, two different prompts that must
 *                 answer with different non-empty text, and a `get_time` tool call
 *
 * A key is appended to `keys.txt` only after step 7 passes; a key that never
 * passes is recorded in `accounts.json` and retried on the next run.
 *
 * Options:
 *   --count N        accounts (= keys) to mint                                [1]
 *   --pool <file>    proxy list, one exit per line (env INFERALL_PROXIES) [optional]
 *   --proxy <url>    a single exit for everything                         [optional]
 *   --exits K        exits tried per account                                     [3]
 *   --model <id>     model used for the live gate            [openai/gpt-oss-20b]
 *   --port N         Chrome DevTools port (default: a free one)
 *   --browser PATH   Chrome binary (env CHROME_PATH)
 *   --headless       NOT recommended — Cloudflare only clears in a visible browser
 *   --keep           leave Chrome open when the run ends
 *   --verify-only    re-run every key in keys.txt through the gate, mint nothing
 *   --help
 *
 * Zero dependencies. Node.js >= 22 (global WebSocket + fetch). Your proxy list
 * is OPTIONAL: pass --pool and every browser request leaves through an exit from
 * it; without a pool the tool connects directly.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const OUT_DIR = path.join(ROOT, 'out');

// ------------------------------------------------------------------ provider
const BASE = 'https://inferall.ai';
const REF = 'epojjjpawjubtqqxabzu';
const SUPABASE = `https://${REF}.supabase.co`;
const GATEWAY = 'https://api.inferall.ai';
const TITLE = 'InferAll';
const ENV = 'INFERALL';
const MODEL_DEFAULT = 'openai/gpt-oss-20b';
const SITEKEY_FALLBACK = '0x4AAAAAADhj5AjLCn-67Znk';
const TEMPTF = 'https://temp.tf';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name[0]}`);

const HELP = `inferall-bulk-apikey — mint InferAll API keys (one account per key)

  --count N        accounts to mint (default 1)
  --pool FILE      exit list, one proxy per line (default proxies.txt if present)
  --proxy URL      a single exit for every request
  --exits K        exit candidates tried per account (default 3)
  --model ID       model used for the live gate (default ${MODEL_DEFAULT})
  --port N         Chrome DevTools port (default: a free one)
  --browser PATH   Chrome binary (env CHROME_PATH)
  --headless       NOT recommended — Cloudflare only clears in a visible browser
  --keep           leave Chrome open when the run ends
  --verify-only    re-prove every key in keys.txt, mint nothing
  --screen         only test the proxy list against ${TITLE}
  --help           this text

Env: ${ENV}_MODEL, ${ENV}_POOL, ${ENV}_PROXIES, CHROME_PATH
Default exits: none — without a pool the tool runs direct.`;

if (has('help') || argv.length === 0) {
  console.log(HELP);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '1'), 10) || 1);
const MODEL = arg('model', process.env[`${ENV}_MODEL`] || MODEL_DEFAULT);
const TRIES = Math.max(1, parseInt(arg('exits', '3'), 10) || 3);
const KEEP = has('keep');
const HEADLESS = has('headless');
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const POOL_ARG = arg('pool', process.env[`${ENV}_POOL`] || process.env[`${ENV}_PROXIES`] || '');
const FIXED = arg('proxy', '');
const PORT_ARG = parseInt(arg('port', '0'), 10) || 0;
const CHROME_BIN = arg('browser', process.env.CHROME_PATH || '');
const MAIL_WAIT_MS = Math.max(90000, (parseInt(arg('mail-timeout', '300'), 10) || 300) * 1000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
// --------------------------------------------------------------------- http
// supabase.co answers an HTTP/1.1 client with a black hole (measured 2026-10-23:
// `curl --http1.1` hangs, h2 answers 401 in 0.4 s; node's https.request never
// completes) — every GoTrue call has to go over HTTP/2, so it gets its own client.
const http2 = require('http2');
const H2_HOSTS = /\.supabase\.co$/i;
/** Same contract as `request`, over HTTP/2 (the only transport that host speaks). */
function requestH2(url, { method = 'GET', headers = {}, body = null, timeoutMs = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const session = http2.connect(`${u.protocol}//${u.host}`);
    const done = (err, value) => { try { session.close(); } catch (e) { /* already closed */ } err ? reject(err) : resolve(value); };
    session.setTimeout(timeoutMs, () => done(new Error(`timeout after ${timeoutMs}ms`)));
    session.on('error', (e) => done(e));
    const req = session.request({
      ':method': method,
      ':path': u.pathname + u.search,
      'user-agent': UA,
      accept: 'application/json',
      ...(payload ? { 'content-type': 'application/json', 'content-length': String(payload.length) } : {}),
      ...headers,
    });
    let text = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { text += c; });
    req.on('response', (h) => {
      req.on('end', () => {
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* html or SSE */ }
        done(null, { status: Number(h[':status']), headers: h, text, json });
      });
    });
    req.on('error', (e) => done(e));
    req.end(payload || undefined);
  });
}

/** One plain request. `body` is a JSON object or null. Returns {status,text,json}. */
function request(url, { method = 'GET', headers = {}, body = null, timeoutMs = 60000 } = {}) {
  if (H2_HOSTS.test(new URL(url).hostname)) return requestH2(url, { method, headers, body, timeoutMs });
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body == null ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const req = https.request({
      host: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'user-agent': UA,
        accept: 'application/json',
        ...(payload ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
        ...headers,
      },
    }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { text += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* html or SSE */ }
        resolve({ status: res.statusCode, text, json });
      });
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const msgOf = (r) =>
  (r.json && (r.json.message || r.json.msg || (r.json.error && (r.json.error.message || r.json.error)) || r.json.detail)) ||
  String(r.text || '').slice(0, 200);

// -------------------------------------------------------------------- exits
/** `protocol://host:port` (http / socks5 / socks4). Credentials are not supported. */
function parseProxy(line) {
  const s = String(line).trim().split(/\s+/)[0];
  const m = s.match(/^(?:(https?|socks5h?|socks4a?):\/\/)?([^:/@\s]+):(\d+)$/);
  if (!m) return null;
  const protocol = (m[1] || 'http').replace('socks5h', 'socks5').replace('socks4a', 'socks4');
  return { protocol, host: m[2], port: parseInt(m[3], 10), line: s };
}
const proxyLabel = (p) => (p ? `${p.protocol}://${p.host}:${p.port}` : '(direct)');
const chromeProxy = (p) => (p ? `${p.protocol}://${p.host}:${p.port}` : null);

function loadExits() {
  if (FIXED) return [parseProxy(FIXED)].filter(Boolean);
  const file = POOL_ARG || (fs.existsSync(path.join(ROOT, 'proxies.txt')) ? path.join(ROOT, 'proxies.txt') : '');
  if (!file) return [];
  if (!fs.existsSync(file)) { log(`pool ${file} not found — running direct`); return []; }
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean)
    .map(parseProxy)
    .filter(Boolean);
}

// --------------------------------------------------------------------- chrome
function findChrome() {
  if (CHROME_BIN && fs.existsSync(CHROME_BIN)) return CHROME_BIN;
  const candidates = [
    process.env['PROGRAMFILES'] && path.join(process.env['PROGRAMFILES'], 'Google/Chrome/Application/chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Chromium/Application/chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['google-chrome'], { encoding: 'utf8' });
  const hit = String(probe.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
  if (hit && fs.existsSync(hit)) return hit;
  throw new Error('Chrome not found — set CHROME_PATH (headful Chrome is required, see README)');
}

const freePort = () => new Promise((resolve, reject) => {
  const srv = net.createServer();
  srv.on('error', reject);
  srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
});

/** Headful Chrome pinned to one exit. A fresh profile per run keeps sessions clean. */
async function launchChrome(exit, port) {
  const bin = findChrome();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'inferall-chrome-'));
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking',
    '--disable-features=Translate,BackForwardCache,OptimizationHints',
    '--window-size=1280,900', '--window-position=40,40',
    // Cloudflare localises its interstitial to the browser language: pin it.
    '--lang=en-US',
  ];
  const px = chromeProxy(exit);
  if (px) args.push(`--proxy-server=${px}`);
  if (HEADLESS) args.push('--headless=new');
  args.push('about:blank');
  const child = spawn(bin, args, { stdio: 'ignore', detached: false });
  child.on('error', (e) => log(`chrome error: ${e.message}`));
  await waitForCdp(port);
  return { child, profile, port };
}

async function waitForCdp(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await new Promise((resolve, reject) => {
        const req = require('http').get({ host: '127.0.0.1', port, path: '/json/version', timeout: 2000 },
          (res) => { let s = ''; res.on('data', (c) => { s += c; }); res.on('end', () => resolve(s)); });
        req.on('error', reject);
        req.setTimeout(2000, () => req.destroy(new Error('timeout')));
      });
      return JSON.parse(r).webSocketDebuggerUrl;
    } catch (e) { await sleep(400); }
  }
  throw new Error(`Chrome DevTools did not answer on port ${port}`);
}

function killChrome(child, profile) {
  try { child.kill(); } catch (e) { /* gone */ }
  try { if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { /* gone */ }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* in use */ }
}

// ------------------------------------------------------------------------ CDP
/** Flat page session over one WebSocket (Node's global WebSocket, v22+). */
class Cdp {
  constructor(ws) {
    if (typeof WebSocket === 'undefined') throw new Error('Node 22+ is required (global WebSocket)');
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      let m = null;
      try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString()); } catch (e) { return; }
      if (m.id != null && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(`${m.error.message} (${m.error.code})`)); else resolve(m.result);
      } else if (m.method && this.handlers.has(m.method)) {
        for (const h of this.handlers.get(m.method)) h(m.params);
      }
    });
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('cdp socket error')), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP ${method} timeout`)); }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  close() { try { this.ws.close(); } catch (e) { /* gone */ } }
}

/** A tab inside the running Chrome, with the handful of helpers this flow needs. */
class Page {
  constructor(cdp) { this.cdp = cdp; }

  static async open(port) {
    const http = require('http');
    const json = (method, p) => new Promise((resolve, reject) => {
      const req = http.request({ host: '127.0.0.1', port, path: p, method, timeout: 5000 }, (res) => {
        let s = '';
        res.on('data', (c) => { s += c; });
        res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(new Error(`bad /json response: ${s.slice(0, 80)}`)); } });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => req.destroy(new Error('timeout')));
      req.end();
    });
    let target = null;
    try { target = await json('PUT', '/json/new?about:blank'); } catch (e) { target = await json('GET', '/json/new?about:blank'); }
    if (!target || !target.webSocketDebuggerUrl) throw new Error('could not open a Chrome tab');
    const page = new Page(await Cdp.connect(target.webSocketDebuggerUrl));
    await page.cdp.send('Page.enable');
    page.targetId = target.id;
    return page;
  }

  async eval(expression, timeoutMs = 60000) {
    const r = await this.cdp.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true, userGesture: true,
    }, timeoutMs);
    return r.result ? r.result.value : undefined;
  }

  async url() { return this.eval('location.href'); }

  async title() { return this.eval('document.title'); }

  async goto(url, { waitMs = 2500, timeoutMs = 45000 } = {}) {
    const loaded = new Promise((resolve) => {
      this.cdp.on('Page.loadEventFired', () => resolve(true));
      setTimeout(() => resolve(false), timeoutMs);
    });
    await this.cdp.send('Page.navigate', { url }, timeoutMs);
    await loaded;
    await sleep(waitMs);
  }

  async mouseClick(x, y) {
    const base = { x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 };
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...base }).catch(() => {});
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...base }).catch(() => {});
    await sleep(60);
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base }).catch(() => {});
  }

  async waitFor(expression, { timeoutMs = 25000, pollMs = 1000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.eval(expression).catch(() => false)) return true;
      await sleep(pollMs);
    }
    return false;
  }

  close() { this.cdp.close(); }
}

// ------------------------------------------------------- Cloudflare / Turnstile
/** Every IFRAME reachable through closed shadow roots, with viewport quads. */
async function piercedFrames(cdp) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const nodes = [];
  const walk = (n) => {
    if (!n) return;
    if (String(n.nodeName || '').toLowerCase() === 'iframe') nodes.push(n);
    for (const c of n.children || []) walk(c);
    if (n.contentDocument) walk(n.contentDocument);
    for (const s of n.shadowRoots || []) walk(s);
  };
  walk(root);
  const out = [];
  for (const n of nodes) {
    let quads = [];
    try { quads = (await cdp.send('DOM.getContentQuads', { nodeId: n.nodeId })).quads || []; } catch (e) { /* invisible */ }
    const q = quads && quads[0];
    out.push({
      box: q ? {
        x: Math.round(Math.min(q[0], q[4] ?? q[0])),
        y: Math.round(Math.min(q[1], q[5] ?? q[1])),
        w: Math.round(Math.abs(q[2] - q[0])),
        h: Math.round(Math.abs(q[5] - q[1])),
      } : null,
    });
  }
  return out;
}

const READ_NATIVE = '(document.querySelector(\'[name="cf-turnstile-response"]\') || {}).value || ""';
const READ_ANY = `(() => { try { if (window.__iaMount && window.__iaId != null && typeof turnstile !== 'undefined') return turnstile.getResponse(window.__iaId) || window.__iaMount; } catch (e) {} return document.querySelector('[name="cf-turnstile-response"]') ? document.querySelector('[name="cf-turnstile-response"]').value : ''; })()`;
const MOUNT_TURNSTILE = (sitekey) => `(async () => {
  const put = (div) => new Promise((resolve) => {
    const go = () => { try { window.__iaId = turnstile.render(div, { sitekey: ${JSON.stringify(sitekey)}, callback: (t) => { window.__iaMount = t; }, 'error-callback': () => {} }); resolve(true); } catch (e) { resolve(false); } };
    go();
  });
  if (typeof turnstile === 'undefined') {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.onload = () => setTimeout(resolve, 1500);
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }
  const div = document.createElement('div');
  div.id = '__ia_box';
  div.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff';
  document.body.appendChild(div);
  return put(div);
})()`;

/**
 * A Turnstile token for the panel's sitekey: the page's own widget first, then
 * an explicitly mounted one clicked in the rhythm the lab uses (two clicks per
 * widget box per round, 1 s apart). The token is bound to the solving IP.
 */
async function obtainToken(cdp, page, sitekey, label = 'ts') {
  const ROUNDS = 14;
  for (let t = 0; t < 8; t++) {
    const tok = await page.eval(READ_NATIVE).catch(() => '');
    if (tok && tok.length > 20) return { token: tok, via: 'native' };
    await sleep(2000);
  }
  await page.eval(MOUNT_TURNSTILE(sitekey)).catch(() => {});
  let clicks = 0;
  for (let round = 1; round <= ROUNDS; round++) {
    const boxes = (await piercedFrames(cdp).catch(() => []))
      .filter((f) => f.box && f.box.w > 20 && f.box.h > 15 && f.box.w < 600 && f.box.h < 200);
    if (round === 1 || round % 5 === 0) log(`  [${label}] click round ${round}/${ROUNDS} boxes=${boxes.length}`);
    if (!boxes.length) { await sleep(1500); continue; }
    for (const b of boxes) {
      for (const frac of [0.12, 0.5]) {
        await page.mouseClick(b.box.x + Math.round(b.box.w * frac), b.box.y + Math.round(b.box.h / 2));
        clicks++;
        await sleep(1000);
        const tok = await page.eval(READ_ANY).catch(() => '');
        if (tok && tok.length > 20) return { token: tok, via: 'click', clicks };
      }
    }
    await sleep(1500);
  }
  return { token: '', via: 'none', clicks };
}

// ---------------------------------------------------------------------- mail
/** temp.tf: real Microsoft-family mailboxes, one plus-alias per account, JSON reader. */
class Mailbox {
  constructor(address = null) { this.address = address; }

  async #call(method, p, body) {
    for (let i = 0; i < 4; i++) {
      const r = await request(TEMPTF + p, { method, body, timeoutMs: 30000 }).catch((e) => ({ error: e }));
      if (r.error) { await sleep(1500); continue; }
      if (r.status === 200) return r.json;
      if (r.status === 429) { await sleep(20000); continue; }
      throw new Error(`temp.tf ${p} → ${r.status} ${String(r.text).slice(0, 120)}`);
    }
    throw new Error(`temp.tf ${p}: no answer after retries`);
  }

  /** One fresh alias on a live Outlook/Hotmail pool account. */
  async open() {
    const j = await this.#call('GET', '/api/account?providers=outlook,hotmail&dot=0&plus=1');
    const address = String((j && j.email) || '').trim();
    if (!/@/.test(address)) throw new Error(`temp.tf: no address in ${JSON.stringify(j).slice(0, 120)}`);
    this.address = address;
    return address;
  }

  async messages() {
    if (!this.address) throw new Error('mailbox: open() first');
    const j = await this.#call('POST', '/api/check', { email: this.address, wait: false });
    const list = Array.isArray(j) ? j : (j && (j.data || j.messages)) || [];
    return list.map((m, i) => ({
      id: String(m.id || i),
      subject: String(m.subject || ''),
      from: String(m.from || ''),
      text: String(m.text || m.body || m.html || ''),
    }));
  }

  /**
   * The signup mail carries a *link*, not a code:
   *   https://<ref>.supabase.co/auth/v1/verify?token=…&type=signup&redirect_to=…
   * Anything already in the shared pool box before the send is ignored.
   */
  async waitForLink({ timeoutMs = MAIL_WAIT_MS, pollMs = 6000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    const seen = new Set();
    while (Date.now() < deadline) {
      for (const m of await this.messages()) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        if (!/inferall|supabase|confirm/i.test(`${m.subject} ${m.from}`)) continue;
        const hit = String(m.text).match(/\/auth\/v1\/verify\?([^"'&\s]+=[^"'&\s]+(?:&(?:amp;)?[^"'&\s]+=[^"'&\s]+)*)/);
        if (!hit) continue;
        const q = new URLSearchParams(hit[1].replace(/&amp;/g, '&'));
        const token = q.get('token');
        if (token) return { token, type: q.get('type') || 'signup', query: hit[1].replace(/&amp;/g, '&'), subject: m.subject };
      }
      await sleep(pollMs);
    }
    throw new Error(`no signup link in ${this.address} within ${Math.round(timeoutMs / 1000)}s`);
  }
}

// --------------------------------------------------------------------- panel
/** Same-origin / cross-origin in-page fetch: it inherits the exit IP, UA and cookies. */
async function ipage(page, url, { method = 'POST', headers = {}, body = null, timeoutMs = 60000 } = {}) {
  const r = await page.eval(`(async () => {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), ${timeoutMs});
      const res = await fetch(${JSON.stringify(url)}, { method: ${JSON.stringify(method)}, credentials: 'include',
        headers: { 'Content-Type': 'application/json'${Object.entries(headers).map(([k, v]) => `, ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join('')} },
        ${body == null ? '' : `body: ${JSON.stringify(JSON.stringify(body))},`} signal: ac.signal });
      clearTimeout(t);
      return { status: res.status, body: await res.text() };
    } catch (e) { return { status: 0, body: String(e && e.message || e) }; }
  })()`, timeoutMs + 15000);
  let json = null;
  try { json = JSON.parse(r.body); } catch (e) { /* html (cloudflare) */ }
  return { status: r.status, json, text: String(r.body).slice(0, 1200) };
}

/** app gate → supabase otp → link → session → gateway key. One account. */
async function mintOnExit(page, exit, sitekey) {
  const box = new Mailbox();
  let email = await box.open();
  log(`  box ${email}`);
  const rec = { email, exit: proxyLabel(exit), at: new Date().toISOString() };

  await page.goto(`${BASE}/auth`, { waitMs: 4000 });
  const healthy = await page.waitFor("!!document.querySelector('main') && document.querySelectorAll('input').length > 0", { timeoutMs: 30000 });
  log(`  page ${await page.url()} healthy=${healthy}`);
  if (!healthy) throw new Error('auth page did not render');

  // the app gate only wants a non-empty token; Supabase does the real check
  const gate = await ipage(page, `${BASE}/api/turnstile/verify`, { body: { token: 'nonempty', email } });
  log(`  app gate → ${gate.status} ${JSON.stringify(gate.json).slice(0, 120)}`);
  if (!(gate.json && gate.json.ok === true)) throw new Error(`app gate refused: ${gate.text.slice(0, 120)}`);

  const ts = await obtainToken(page.cdp, page, sitekey, 'ts');
  log(`  ts ${ts.token.length}(${ts.via})`);
  if (!ts.token) throw new Error('turnstile-token-empty');

  // Supabase first, page second: the browser's connect() to supabase.co is what
  // breaks on some exits ("Failed to fetch"), and a *retry* of /otp would issue a
  // second mail and invalidate the first link — so the in-page call is only the
  // fallback for a transport-level failure (status 0), never a re-send.
  const both = async (url, opts) => {
    const viaNode = await request(url, { method: 'POST', ...opts }).catch((e) => ({ status: 0, json: null, text: String(e.message) }));
    if (viaNode.status !== 0) return viaNode;
    log(`  (HTTP/2 fetch failed — retrying in the page) ${String(viaNode.text).slice(0, 60)}`);
    return ipage(page, url, opts);
  };
  const otp = await both(`${SUPABASE}/auth/v1/otp`, {
    headers: { apikey: ANON_KEY },
    body: {
      email,
      create_user: true,
      email_redirect_to: `${BASE}/auth/callback`,
      gotrue_meta_security: { captcha_token: ts.token },
    },
  });
  log(`  otp → ${otp.status} ${otp.json ? JSON.stringify(otp.json).slice(0, 160) : otp.text.slice(0, 160)}`);
  if (otp.status >= 400) throw new Error(`otp refused: ${otp.text.slice(0, 160)}`);

  const link = await box.waitForLink();
  log(`  mail token «${String(link.subject).slice(0, 40)}» type=${link.type}`);

  // The working chain (report.md, 2026-10-20) is the mail's own **link**: a GET on
  // /auth/v1/verify answers 303 and carries access/refresh in the Location
  // fragment. The POST form burns the single-use token on a type mismatch, which
  // is why it answered otp_expired for every type — so the link is tried first.
  let session = null;
  let last = null;
  if (link.query) {
    const v = await request(`${SUPABASE}/auth/v1/verify?${link.query}`, { method: 'GET', headers: { apikey: ANON_KEY } }).catch((e) => ({ status: 0, text: e.message }));
    const loc = String((v.headers && (v.headers.location || v.headers.Location)) || '');
    const frag = loc.includes('#') ? new URLSearchParams(loc.slice(loc.indexOf('#') + 1)) : null;
    const access = frag && frag.get('access_token');
    if (access) {
      const who = await request(`${SUPABASE}/auth/v1/user`, { method: 'GET', headers: { apikey: ANON_KEY, authorization: `Bearer ${access}` } }).catch(() => ({ json: null }));
      session = { access_token: access, refresh_token: frag.get('refresh_token'), expires_in: Number(frag.get('expires_in')) || null, user: (who.json && who.json.id) ? who.json : null };
      log(`  verify(link) → ${v.status} user=${session.user && session.user.id}`);
    } else {
      last = `link:${v.status} ${loc.slice(0, 120)} ${String(v.text).slice(0, 80)}`;
      log(`  verify(link) ✖ ${last}`);
    }
  }
  for (const type of session ? [] : [link.type]) {
    const v = await both(`${SUPABASE}/auth/v1/verify`, {
      headers: { apikey: ANON_KEY },
      body: { type, token: link.token, email },
    });
    const s = v.json && (v.json.session || v.json);
    if (v.status < 400 && s && s.access_token) { session = s; log(`  verify(${type}) → ${v.status} user=${s.user && s.user.id}`); break; }
    last = `${type}:${v.status} ${JSON.stringify(v.json).slice(0, 120)}`;
    log(`  verify(${type}) ✖ ${last}`);
  }
  if (!session) throw new Error(`verify failed — ${last}`);
  rec.user_id = session.user && session.user.id;
  rec.expires_at = session.expires_at;

  // The key route answers plain JSON, so it goes over the node client (no
  // same-origin cookie is needed here, unlike the console page).
  const cr = await request(`${GATEWAY}/ai/v1/keys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { name: `bulk-${Date.now().toString(36)}`, scopes: null, controls: { budget_cents: null, budget_period: 'lifetime', allowed_models: null, expires_at: null } },
  }).catch((e) => ({ status: 0, json: null, text: String(e.message) }));
  const key = cr.json && (cr.json.key || (cr.json.keys && cr.json.keys[0] && cr.json.keys[0].key));
  log(`  key → ${cr.status} ${key ? `${key.slice(0, 12)}…` : JSON.stringify(cr.json).slice(0, 160)}`);
  if (typeof key !== 'string' || !key.startsWith('ifu_')) throw new Error(`key not readable: ${cr.text.slice(0, 160)}`);
  rec.key = key;
  rec.tier = cr.json.tier;
  return rec;
}

// ----------------------------------------------------------------------- proof
const P1 = 'Reply with the single word: pong';
const P2 = 'Name three colours, comma separated.';
const TOOLS = [{ type: 'function', function: { name: 'get_time', description: 'Returns the current time', parameters: { type: 'object', properties: {} } } }];

const ansOf = (json, text) => {
  const m = json && json.choices && json.choices[0] && json.choices[0].message;
  if (m) {
    const t = String(m.content || m.reasoning_content || m.reasoning || '').trim();
    if (t) return { text: t, toolCalls: m.tool_calls || json.choices[0].message.tool_calls || null };
  }
  // panels that answer stream-shaped even with stream:false
  if (typeof text === 'string' && /^data:/m.test(text)) {
    let acc = '';
    let tools = null;
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      let j = null;
      try { j = JSON.parse(line.slice(5).trim() || '{}'); } catch (e) { continue; }
      for (const ch of j.choices || []) {
        const d = ch.delta || {};
        acc += (d.content || '') + (d.reasoning_content || '');
        if (d.tool_calls) tools = d.tool_calls;
      }
    }
    return { text: acc.trim(), toolCalls: tools };
  }
  return { text: '', toolCalls: null };
};

/** chat-200 + two different prompts (non-empty, different text) + a tool call. */
async function proveKey(key, model = MODEL) {
  const auth = { authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  const out = { models: null, chat: [], tools: null };
  const models = await request(`${GATEWAY}/v1/models`, { headers: { authorization: `Bearer ${key}` } }).catch((e) => ({ status: 0, text: String(e.message) }));
  const ids = ((models.json && models.json.data) || []).map((m) => m.id);
  out.models = { status: models.status, ids: ids.length };
  const want = [model, ...ids.filter((i) => /gpt-oss|nemotron|qwen|llama/i.test(i))].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 3);

  const answers = [];
  for (const prompt of [P1, P2]) {
    for (const id of want) {
      const r = await request(`${GATEWAY}/v1/chat/completions`, {
        method: 'POST',
        headers: auth,
        body: { model: id, messages: [{ role: 'user', content: prompt }], max_tokens: 64, stream: false },
        timeoutMs: 90000,
      });
      const { text } = ansOf(r.json, r.text);
      out.chat.push({ model: id, prompt: prompt.slice(0, 12), status: r.status, chars: text.length, sample: text.slice(0, 60) });
      if (r.status === 200 && text) { answers.push(text); break; }
    }
  }
  out.sane = answers.length === 2 && answers[0].length > 0 && answers[1].length > 0 && answers[0] !== answers[1];

  const id = want[0];
  const t = await request(`${GATEWAY}/v1/chat/completions`, {
    method: 'POST',
    headers: auth,
    body: { model: id, messages: [{ role: 'user', content: 'What time is it right now? Use the get_time tool.' }], tools: TOOLS, tool_choice: 'auto', max_tokens: 256, stream: false },
    timeoutMs: 90000,
  });
  const { toolCalls, text } = ansOf(t.json, t.text);
  out.tools = { model: id, status: t.status, called: !!(toolCalls && toolCalls.length), name: toolCalls && toolCalls[0] && toolCalls[0].function && toolCalls[0].function.name, chars: text.length };

  out.live = out.models.status === 200 && out.sane && !!(out.tools && out.tools.called);
  return out;
}

// ---------------------------------------------------------------------- files
const readKeys = () => fs.existsSync(KEYS_FILE)
  ? fs.readFileSync(KEYS_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'))
  : [];
const appendKey = (key) => {
  if (readKeys().includes(key)) return false;
  fs.appendFileSync(KEYS_FILE, (fs.existsSync(KEYS_FILE) && fs.statSync(KEYS_FILE).size ? '\n' : '') + key + '\n');
  return true;
};
const readAccounts = () => { try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch (e) { return []; } };
const saveAccount = (rec) => {
  const all = readAccounts();
  const i = all.findIndex((r) => r.email === rec.email);
  if (i >= 0) all[i] = rec; else all.push(rec);
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(all, null, 2) + '\n');
};

// ----------------------------------------------------------------------- modes
/**
 * Chrome pins its proxy at launch, so each attempt gets its own browser on that
 * attempt's exit: one account, one exit, one browser, one tab.
 */
async function mint(exits, count) {
  log(`sitekey ${SITEKEY_FALLBACK} · model ${MODEL} · ${exits.length ? `${exits.length} exit(s)` : 'DIRECT (no proxy)'} · ${HEADLESS ? 'headless (NOT recommended)' : 'headful'}`);
  let minted = 0;
  for (let n = 1; n <= count; n++) {
    const attempts = Math.max(TRIES, exits.length);
    for (let k = 0; k < attempts; k++) {
      const exit = exits.length ? exits[(n - 1 + k) % exits.length] : null;
      const port = PORT_ARG || await freePort();
      const chrome = await launchChrome(exit, port).catch((e) => { log(`chrome failed: ${e.message}`); return null; });
      if (!chrome) break;
      let page = null;
      try {
        page = await Page.open(port);
        const rec = await mintOnExit(page, exit, SITEKEY_FALLBACK);
        const proof = await proveKey(rec.key);
        rec.proof = proof;
        if (!proof.live) {
          rec.status = 'key-unverified';
          saveAccount(rec);
          log(`  ✖ key not proven: ${JSON.stringify(proof).slice(0, 220)}`);
          continue;
        }
        rec.status = 'minted';
        appendKey(rec.key);
        saveAccount(rec);
        minted++;
        log(`  ✔ key ${n}/${count} live — models=${proof.models.status}(${proof.models.ids}) sanity=${proof.sane} tools=${proof.tools.called ? proof.tools.name : 'no'}`);
        break;
      } catch (e) {
        log(`  ✖ ${proxyLabel(exit)}: ${String(e.message).slice(0, 180)}`);
        if (k + 1 >= attempts) log(`  ✖ giving up on account ${n}/${count}`);
      } finally {
        if (page) page.close();
        if (!KEEP) killChrome(chrome.child, chrome.profile);
        else log(`chrome kept on ${port} (exit ${proxyLabel(exit)})`);
      }
    }
  }
  log(`done: ${minted}/${count} keys minted`);
  if (minted) log(`keys.txt → ${KEYS_FILE}`);
}

async function verifyOnly() {
  const keys = readKeys();
  if (!keys.length) { log(`no keys in ${KEYS_FILE}`); return; }
  let live = 0;
  for (const key of keys) {
    const proof = await proveKey(key);
    if (proof.live) live++;
    log(`${key.slice(0, 12)}… models=${proof.models.status}(${proof.models.ids}) sanity=${proof.sane} tools=${proof.tools.called ? proof.tools.name : 'no'} ${proof.live ? 'LIVE' : 'DEAD'}`);
  }
  log(`live: ${live}/${keys.length}`);
}

// The Supabase anon key is public by design (it ships in every visitor's bundle
// and carries no privileges beyond what RLS allows); it is read from the app's
// own page at run time so this file carries no credential at rest.
let ANON_KEY = '';
async function discoverAnonKey(port, exit) {
  if (process.env.INFERALL_ANON) return process.env.INFERALL_ANON;
  const stored = path.join(OUT_DIR, 'anon-key.txt');
  if (fs.existsSync(stored)) return fs.readFileSync(stored, 'utf8').trim();
  log('discovering the Supabase anon key from the app bundle…');
  const chrome = await launchChrome(exit, port);
  let page = null;
  try {
    page = await Page.open(port);
    await page.goto(`${BASE}/auth`, { waitMs: 4000 });
    const chunks = await page.eval(`Array.from(document.querySelectorAll('script[src]')).map((s) => s.src).filter((s) => /_next\\/static|chunks/.test(s))`);
    const found = await page.eval(`(async () => {
      const urls = ${JSON.stringify(chunks)};
      for (const u of urls) {
        try { const t = await (await fetch(u)).text(); const m = t.match(/eyJ[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{10,}/); if (m) return m[0]; } catch (e) {}
      }
      return '';
    })()`);
    if (found) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.writeFileSync(stored, found + '\n');
      return found;
    }
  } finally {
    if (page) page.close();
    killChrome(chrome.child, chrome.profile);
  }
  throw new Error('could not discover the Supabase anon key — set INFERALL_ANON');
}


/** Which exits actually reach the app: one pinned Chrome each, no account touched. */
async function screen(exits) {
  if (!exits.length) { log('nothing to screen — pass --pool or --proxy'); return 0; }
  let ok = 0;
  for (const exit of exits.slice(0, 64)) {
    const port = PORT_ARG || await freePort();
    const chrome = await launchChrome(exit, port).catch(() => null);
    if (!chrome) { log(`✖ ${proxyLabel(exit)}: chrome would not start`); continue; }
    let page = null;
    try {
      page = await Page.open(port);
      const r = await ipage(page, `${BASE}/auth`, { method: 'GET' });
      const reached = r.status === 200 && /inferall|create your account/i.test(r.text);
      if (reached) ok++;
      log(`${reached ? '✔' : '✖'} ${proxyLabel(exit)} → ${r.status}`);
    } catch (e) {
      log(`✖ ${proxyLabel(exit)}: ${String(e.message).slice(0, 100)}`);
    } finally {
      if (page) page.close();
      killChrome(chrome.child, chrome.profile);
    }
  }
  log(`screened ${Math.min(exits.length, 64)} exit(s): ${ok} reach ${BASE}/auth`);
  return ok;
}

// ------------------------------------------------------------------------ main
(async () => {
  const exits = loadExits();
  if (!exits.length) log('running WITHOUT a proxy (direct) — pass --pool proxies.txt to rotate exits');
  if (SCREEN) return void (await screen(exits));
  ANON_KEY = await discoverAnonKey(await freePort(), exits.length ? exits[0] : null);
  log(`anon key ${ANON_KEY.slice(0, 18)}…(${ANON_KEY.length})`);
  if (VERIFY_ONLY) return verifyOnly();
  await mint(exits, COUNT);
})().catch((e) => { console.error('FATAL', e && e.message ? e.message : e); process.exit(1); });
