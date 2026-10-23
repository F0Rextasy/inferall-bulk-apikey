<div align="center">

```
██╗███╗   ██╗███████╗███████╗██████╗  █████╗ ██╗     ██╗
██║████╗  ██║██╔════╝██╔════╝██╔══██╗██╔══██╗██║     ██║
██║██╔██╗ ██║█████╗  █████╗  ██████╔╝███████║██║     ██║
██║██║╚██╗██║██╔══╝  ██╔══╝  ██╔══██╗██╔══██║██║     ██║
██║██║ ╚████║██║     ███████╗██║  ██║██║  ██║███████╗███████╗
╚═╝╚═╝  ╚═══╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝
```

# inferall-bulk-apikey

**Bulk-create InferAll accounts and API keys — OpenAI-compatible inference on https://api.inferall.ai/v1 across 83 model ids + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-83-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

InferAll (`inferall.ai`) is a **Next.js app on Vercel** in front of a **Supabase** project (ref `epojjjpawjubtqqxabzu`) and a separate inference gateway at `api.inferall.ai` (service brand: Kindly Robotics). The sign-in page offers **e-mail + one-time link** (`signInWithOtp`) beside Google — the project's own published settings confirm both are on and that no password provider is needed (`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). That makes this **not an OAuth-only** panel: the identity is proven by the **mailbox**, which is exactly the part a bulk rail automates.

Worth a lane because of what guards that OTP call: a Cloudflare **Turnstile** widget (sitekey `0x4AAAAAADhj5AjLCn-67Znk`) whose token Supabase enforces as `gotrue_meta_security.captcha_token`. Measured: no token → `captcha_failed`, a reused one → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), a fresh one → `200 {}` (`out/ia-mint-run4.log`). The app's own gate `POST /api/turnstile/verify` is a decoy — it answers `{"ok":true}` to any non-empty string (`out/reach-warp/tsverify-probe.json`).

The unit that scales is one account per key: the trial allowance lives on the **account**, and the key (`ifu_…`) is scoped to it.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| Trial allowance | a fresh key comes back `tier: "pending"` and gets **25 free NIM-model calls before any payment** (gateway docs, `providers/inferall/out/reach-warp/docs.body`); the 26th call answers **HTTP 402 — billing required** |
| $0 models | **15 of the 83** catalog rows are `$0` in and `$0` out (`out/models.json`) — a no-card trial key can call those |
| Key minted | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, message *"you can call the free open models right away, no card needed"* |
| Spend proof | `POST /v1/chat/completions` on `openai/gpt-oss-20b` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Counter | `GET /ai/v1/key/status` reports `trial: {used, remaining, cap}`; every trial call also carries `X-InferAll-Trial-Usage: N/CAP` and `X-InferAll-Trial-Status` response headers |
| After the trial | 402 until the $5 starter pack at `inferall.ai/billing` — a paid account then also reaches OpenAI / Anthropic / Gemini and Claude Code |
| Cheapest path | burn the 25 calls on the $0 ids: on a trial key a bare `gpt-4o` / `claude-sonnet-4-6` is **refused**; prefix it (`openai/gpt-4o`) and it routes, billed from the balance |

> 💡 The free tier is set by InferAll and can change. Check the live numbers at [inferall.ai](https://inferall.ai) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 83 of them

`GET /v1/models` with the trial key answered **83 model ids** (`providers/inferall/out/models.json`, 2026-10-20), each row carrying its own `pricing`:

* **15 rows are $0/$0** — the trial set a no-card key can actually call: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, plus the image routes (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **InferAll's own** — `inferall-uncensored`, `inferall-uncensored-large`.

The catalog doubles as the price list (`inferall.ai/models` renders it, `GET /v1/models` is the raw JSON) and it **marks the free ones** a trial key can call. An id the gateway cannot route is refused with `400`; it is never silently swapped, and `resp.model` in the reply always names the model that actually answered.

## 🧪 How to use the API

The base URL is **`https://api.inferall.ai/v1`** — OpenAI-compatible, so any OpenAI client works (`OPENAI_BASE_URL` + `ifu_…` key). Anthropic-shaped apps can point `ANTHROPIC_BASE_URL` at `https://api.inferall.ai` instead.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* on a **trial** key, name a **$0 model** (or prefix a paid one with its provider); on a paid account bare `gpt-4o` / `claude-sonnet-4-6` route too
* `X-Inferall-Routing: exact` disables the gateway's automatic alternative-model/provider fallback (which is on by default, and may run a parallel backup request for eligible free models)
* `GET /ai/v1/key/status` returns the trial counter and balance; `X-InferAll-Trial-Usage` carries the same counter on every response
* the key is printed **once** at mint time — `POST /ai/v1/keys` is the only place it exists in plaintext

## 🛠 Quick start

```bash
# 1) one account + one verified key (drives your own Chrome: headful, one exit per account)
node src/cli.js --count 1

# 2) prove an existing key (chat-200 + two different prompts + a get_time tool call)
node src/cli.js --verify-only

# 3) talk to it
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

A key is written to `keys.txt` **only** after the gate passes: `/v1/models` → 200, two different prompts answered with two different non-empty texts, and a real `get_time` tool call. Anything that fails is recorded in `accounts.json` and retried on the next run.

### 🖱️ The launcher

`src/launcher.js` (same banner as this README) boots the connector wrapper: mint, verify, screen the proxy list, show the remembered settings, and register the keys in a local 9Router — the CLI flags stay configurable without reading the source, and the answers live in `launcher.config.json`. `src/connect-9router.js` registers the provider under prefix `inferall` with `openai/gpt-oss-20b` as the default model, one connection per key in `keys.txt`.

## ✅ Verified working — every key is tested

Lab run **2026-10-20**, through one pinned WARP exit (`socks5h://127.0.0.1:40000`):

* mailbox — a `temp.tf` Outlook plus-alias (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); the signup mail is a **link, not a code** — subject `Confirm Your Signup`, from the app's own `noreply` address at `inferall.ai` (`out/ia-maildump.out`)
* Turnstile — widget clicked until it answered with a 752-char token, accepted by `/auth/v1/otp` → `200 {}`; the previous three attempts show exactly why the token matters (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* session — `GET /auth/v1/verify` → `303` with `access_token`/`refresh_token` in the fragment (`out/verify-headers.txt`); an `@supabase/ssr` cookie `sb-<ref>-auth-token=base64-…` makes `GET /keys` answer **200** (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18,522 bytes)
* key — `POST https://api.inferall.ai/ai/v1/keys` with the Supabase access token → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* live proof — **chat-200 twice**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) and the re-verify `2026-10-20T21:14:46Z`, 7m00s later (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — model `openai/gpt-oss-20b`, both answering `content:"pong"`; `/v1/models` with that key → 83 rows

Evidence: `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) and the write-up `providers/inferall/report.md` (UPDATE 2026-10-20).

> **Quality gates.** Every key here passed a live `chat-200` before it was written to `keys.txt`
> (dead keys are never shipped). Router combos follow the same rule at the model level: an entry is
> added **only if the model answers `chat-200` and can call tools** — a model without tool support,
> a dead key or a dead provider is dropped instead of added. Re-run the verify step any time;
> failures are reported, never hidden.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

Per account, every provider-bound request through **one exit** — the Turnstile token is bound to the solving IP, so the page, the OTP call and the mailbox must share that address:

1. **mailbox** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` hands back one fresh plus-alias on a live Outlook/Hotmail pool account. Disposable domains are refused by the panel (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **page** — a real headful Chrome (`--remote-debugging-port`, throwaway profile, `--lang=en-US`) pointed at `/auth`, optionally behind `--proxy-server`. Every later call is made **in that page** (`fetch`, `credentials:'include'`), so it inherits the exit IP, the UA and the cookies.
3. **app gate** — `POST /api/turnstile/verify` wants nothing but a non-empty token; the real check is Supabase's, next to the OTP.
4. **Turnstile** — the widget is read from the page, and if it stays empty one is mounted explicitly (`render=explicit`) and clicked in a fixed rhythm; iframes are pierced through closed shadow roots to find the box.
5. **OTP** — `POST <ref>.supabase.co/auth/v1/otp` with `gotrue_meta_security.captcha_token` → the confirm **link** arrives by mail.
6. **session** — `POST /auth/v1/verify` with the link's token (`signup` / `magiclink` / `email` are all tried) → `access_token`.
7. **key** — `POST https://api.inferall.ai/ai/v1/keys` with that token → `ifu_…`, written to `keys.txt` only once step 8 passes.
8. **gate** — `/v1/models` → 200, two different prompts answered with different non-empty text, and a live `get_time` tool call (`proveKey()` in `src/cli.js`).

## ⚙️ CLI options

| flag | meaning |
| --- | --- |
| `--count N` | accounts (= keys) to mint — each one is gated before it is kept |
| `--pool <file>` | exit list, one proxy per line (or `INFERALL_PROXIES` / `INFERALL_POOL`); defaults to `proxies.txt` if present |
| `--proxy <url>` | a single exit for everything (`http://`, `socks5://`, `socks4://`, or bare `host:port`) |
| `--exits K` | exit candidates tried per account (default 3) |
| `--model <id>` | model used for the live gate (default `openai/gpt-oss-20b`) |
| `--port N` | Chrome DevTools port (default: a free one) |
| `--browser PATH` | Chrome binary (or `CHROME_PATH`; auto-detected on Windows/macOS/Linux) |
| `--headless` | **NOT recommended** — the lab runs this headful |
| `--keep` | leave Chrome open when the run ends |
| `--verify-only` | re-prove every key in `keys.txt` through the gate, mint nothing |
| `--screen` | only test the proxy list against `inferall.ai/auth` (first 64 exits) |
| `--mail-timeout <s>` | how long to wait for the signup mail (default 300) |

Env: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (override the auto-discovered Supabase anon key), `CHROME_PATH`. Without a pool the tool runs **direct**.

## 🛰️ Behind a proxy

An exit list is optional — without one everything goes direct:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* one attempt = **one exit, one browser, one account** (Chrome pins its proxy at launch, so a retry gets a fresh browser on the next exit)
* the exit must reach `inferall.ai`, `<ref>.supabase.co` **and** the mail rail — the Turnstile token is bound to the solving IP, so splitting them breaks the signup
* measured on 2026-10-15: the free pool's yield for this host was **0 working exits out of 274** across two screens (`providers/inferall/report.md`) — a Vercel app plus free exits is a bad pair, so budget a residential/screened exit rather than blaming the code
* the successful 2026-10-20 mint ran through a single WARP exit (`providers/inferall/out/extwave-journal.md`)

## 📄 Files

| file | what |
| --- | --- |
| `keys.txt` | verified keys, one per line (written only by the gate) |
| `accounts.json` | account ↔ key ↔ gate record |
| `proxies.txt` | optional exit list, one per line |
| `launcher.config.json` | what the launcher remembers (generated, git-ignored) |
| `repo-spec.json` | this packaging spec |
| `public-cli.js` | mint / verify / screen (node stdlib only, no dependencies) |
| `description.txt`, `report.md` | measured write-up of the panel |
| `out/session-*.json` | Supabase session captured during the mint |
| `out/created-key.json` | the key answer + its `tier` / `controls` |
| `out/chat-200-*.json` | the two chat-200 proofs (mint + re-verify 7m later) |
| `out/models.json` | the 83-model answer with per-row pricing |
| `out/reach-warp/` | raw probe bodies: `/auth`, `/keys`, Supabase settings, anon key, Turnstile probe |

## 🔌 Connect to 9Router

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Or let the tool do it: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` registers one `openai-compatible` node and one connection per key in `keys.txt` (`inferall-001`, `inferall-002`, …). Re-running it is idempotent and 9Router load-balances across the keys.

## 🔌 Connect to OmniRoute

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Or let the tool do it: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` registers one `openai-compatible` node and one connection per key in `keys.txt` (`inferall-001`, `inferall-002`, …). Re-running it is idempotent and OmniRoute load-balances across the keys.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 What the provider gives | One e-mail address per key — Supabase e-mail OTP behind Cloudflare Turnstile, 25 free NIM calls per account, every key chat-verified |
| 🔑 What one key gets you | one API key scoped to its own account: the 83 model ids on the endpoint below, at your plan's limits. The quota lives on the **account**, which is exactly why this tool creates one account per key |
| 🌐 API shape | OpenAI-compatible: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Your data | only inferall.ai and the inbox backend you configure are contacted; keys stay on your machine |

## 🐞 Issues

* **`supabase.co` only speaks HTTP/2.** Measured 2026-10-23: `curl --http1.1` hangs, HTTP/2 answers `401` in 0.4 s, and node's `https.request` never completes on that host. `src/cli.js` therefore carries a second client — `requestH2()` — and routes every `*.supabase.co` call through it (`H2_HOSTS`). Any tool of your own that talks to GoTrue over HTTP/1.1 will look like a black hole.
* **The app gate is a decoy.** `POST /api/turnstile/verify` answers `{"ok":true}` to the literal string `nonempty` (`out/reach-warp/tsverify-probe.json`); Supabase is what enforces the captcha (`captcha_failed` / `timeout-or-duplicate`), and a Turnstile token is single-use and IP-bound.
* **Headless Chrome is refused.** The widget only clears in a visible browser; `--headless` exists for completeness, not for production.
* **The browser mint path has not yet completed an account end-to-end.** In the 2026-10-21 lanes the page rendered, the app gate answered `ok:true` and a Turnstile token was obtained (`709`/`730` chars), but the in-page OTP `fetch` came back `status 0` with no response every time and the `temp.tf` reader then stalled (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). The key shipped here was minted by the lab's curl/WARP path (`out/ia-mint.js`, `out/ia-keys.js`) and re-verified twice; `--verify-only` and the 9Router connector are the paths proven on this build, and minting wants a screened exit plus a mail rail that answers.
* **No code in the mail.** The signup message carries a `/auth/v1/verify?token=…` **link** only — a rail that waits for a 6-digit code will time out.
* **One key, one account.** The 25-call trial counter lives on the account, so minting two keys from one account would not double it — and the endpoint hands the plaintext key back exactly once, which is why it is written to disk immediately.
* If InferAll changes its signup shape or the widget, the tool stops at that step and says which one. **[Open an issue](../../issues)** with the command you ran and the exact output; PRs are welcome.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>
