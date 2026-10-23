'use strict';
/*
 * src/solver.js — inferall's Chrome + Turnstile engine, moved out of cli.js.
 *
 * Locked contract (the one-command contract, 2026-10-23):
 *   const { solveCaptcha } = require('./solver.js');
 *   const { token, ms } = await solveCaptcha({ type: 'turnstile', sitekey, url, proxy });
 * The token is returned untrimmed, Chrome runs headed with a fresh profile
 * pinned to `proxy`, and the browser is closed before the promise settles. It
 * also exports the pieces cli.js drives directly.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn, spawnSync } = require('child_process');

// cli.js parses the same argv; re-read the few flags this module needs so it
// stays usable on its own.
const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};
const CHROME_BIN = flag('browser', process.env.CHROME_PATH || '');
const HEADLESS = argv.includes('--headless');
/** The one provider-specific in-page namespace, kept in a single place. */
const NS = '__ia';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

/** `http://host:port` for Chrome's --proxy-server. Chrome takes no userinfo in that
 *  URL (net::ERR_NO_SUPPORTED_PROXIES), so a credentialed exit's 407 is answered
 *  here, on the page's own session, through the Fetch domain. */
const chromeProxy = (p) => (p ? `${p.protocol}://${p.host}:${p.port}` : null);
async function proxyAuth(cdp, exit) {
  if (!exit || !exit.username) return;
  cdp.on('Fetch.authRequired', (p) => cdp.send('Fetch.continueWithAuth', {
    requestId: p.requestId,
    authChallengeResponse: { response: 'ProvideCredentials', username: exit.username, password: exit.password || '' },
  }).catch(() => {}));
  cdp.on('Fetch.requestPaused', (p) => cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {}));
  await cdp.send('Fetch.enable', { handleAuthRequests: true });
  log(`proxy auth via Fetch.handleAuthRequests (${chromeProxy(exit)})`);
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

  static async open(port, exit = null) {
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
    await proxyAuth(page.cdp, exit);
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
const READ_ANY = `(() => { try { if (window.${NS}Mount && window.${NS}Id != null && typeof turnstile !== 'undefined') return turnstile.getResponse(window.${NS}Id) || window.${NS}Mount; } catch (e) {} return document.querySelector('[name="cf-turnstile-response"]') ? document.querySelector('[name="cf-turnstile-response"]').value : ''; })()`;
const MOUNT_TURNSTILE = (sitekey) => `(async () => {
  const put = (div) => new Promise((resolve) => {
    const go = () => { try { window.${NS}Id = turnstile.render(div, { sitekey: ${JSON.stringify(sitekey)}, callback: (t) => { window.${NS}Mount = t; }, 'error-callback': () => {} }); resolve(true); } catch (e) { resolve(false); } };
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
  div.id = '${NS}_box';
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

/** 'http://user:pass@host:port' (or an exit object) -> the launchChrome shape. */
function toExit(p) {
  if (!p) return null;
  if (typeof p === 'object') return p;
  const s = String(p).trim();
  const m = s.match(/^(?:(https?|socks5h?):\/\/)?(?:([^:@/\s]+):([^@/\s]+)@)?([^:/\s]+):(\d+)$/);
  if (!m) return null;
  const protocol = (m[1] || 'http').replace('socks5h', 'socks5');
  return { protocol, host: m[4], port: parseInt(m[5], 10), username: m[2] || undefined, password: m[3] || undefined, line: s };
}

/**
 * One-shot Turnstile solve on a fresh, headed Chrome pinned to `proxy`:
 * navigate, mount our own widget, wait for the token, close the browser.
 */
async function solveCaptcha({ type = 'turnstile', sitekey, url, proxy = null } = {}) {
  const started = Date.now();
  if (type !== 'turnstile') throw new Error(`solveCaptcha: unsupported type "${type}" (turnstile is the only one here)`);
  if (!url) throw new Error('solveCaptcha: url is required');
  if (!sitekey) throw new Error('solveCaptcha: sitekey is required');
  const port = await freePort();
  const exit = toExit(proxy);
  const chrome = await launchChrome(exit, port);
  let page = null;
  try {
    page = await Page.open(port, exit);
    await page.goto(url, { waitMs: 3000 });
    const r = await obtainToken(page.cdp, page, sitekey, 'solve');
    if (!r.token) throw new Error('solveCaptcha: turnstile did not mint a token');
    return { token: r.token, ms: Date.now() - started };
  } finally {
    if (page) page.close();
    killChrome(chrome.child, chrome.profile);
  }
}

module.exports = {
  NS,
  solveCaptcha,
  sleep,
  log,
  findChrome,
  freePort,
  launchChrome,
  waitForCdp,
  killChrome,
  Cdp,
  Page,
  piercedFrames,
  obtainToken,
};
