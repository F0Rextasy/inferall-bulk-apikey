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

**InferAll 계정과 API 키를 대량으로 생성하세요 — https://api.inferall.ai/v1 에서 83개 모델 id에 걸친 OpenAI 호환 추론 + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-83-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 왜 이게 존재하는가

InferAll(`inferall.ai`)은 **Supabase** 프로젝트(ref `epojjjpawjubtqqxabzu`)와 `api.inferall.ai`의 별도 추론 게이트웨이(서비스 브랜드: Kindly Robotics) 앞에 놓인 **Vercel 위의 Next.js 앱**입니다. 로그인 페이지는 Google 옆에 **이메일 + 일회용 링크**(`signInWithOtp`)를 제공합니다 — 프로젝트가 직접 공개한 설정은 둘 다 켜져 있고 비밀번호 제공자가 필요 없다는 것을 확인해 줍니다(`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). 따라서 이것은 **OAuth 전용** 패널이 **아닙니다**: 신원은 **메일함**으로 증명되며, 바로 그 부분이 대량 레일이 자동화하는 대상입니다.

그 OTP 호출을 지키는 것 때문에 한 줄 worth a lane: Cloudflare **Turnstile** 위젯(사이트키 `0x4AAAAAADhj5AjLCn-67Znk`)이며, 그 토큰을 Supabase가 `gotrue_meta_security.captcha_token`으로 강제합니다. 측정 결과: 토큰 없음 → `captcha_failed`, 재사용된 것 → `timeout-or-duplicate`(`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), 새 것 → `200 {}`(`out/ia-mint-run4.log`). 앱 자체의 게이트 `POST /api/turnstile/verify`는 미끼입니다 — 어떤 비어 있지 않은 문자열에도 `{"ok":true}`로 응답합니다(`out/reach-warp/tsverify-probe.json`).

확장되는 단위는 키당 하나의 계정입니다: 체험 허용량은 **계정**에 있고, 키(`ifu_…`)는 그 계정에 범위가 지정됩니다.

## 🎁 무료 티어 — 얼마나 받는가

| 항목 | 값 |
| --- | --- |
| 체험 허용량 | 새 키는 `tier: "pending"`으로 반환되며 **결제 전 25회의 무료 NIM 모델 호출**을 받습니다(게이트웨이 문서, `providers/inferall/out/reach-warp/docs.body`); 26번째 호출은 **HTTP 402 — 청구 필요**로 응답합니다 |
| $0 모델 | 카탈로그 83개 행 중 **15개**가 입력 `$0`, 출력 `$0`입니다(`out/models.json`) — 카드 없는 체험 키로 호출할 수 있습니다 |
| 발급된 키 | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, 메시지 *"you can call the free open models right away, no card needed"* |
| 지출 증명 | `openai/gpt-oss-20b`에 대한 `POST /v1/chat/completions` → **200**, `content:"pong"`(`out/chat-200-1792530466327.json`) |
| 카운터 | `GET /ai/v1/key/status`가 `trial: {used, remaining, cap}`을 보고합니다; 모든 체험 호출은 `X-InferAll-Trial-Usage: N/CAP` 및 `X-InferAll-Trial-Status` 응답 헤더도 함께 전달합니다 |
| 체험 이후 | `inferall.ai/billing`의 $5 스타터 팩까지 402 — 유료 계정은 그러면 OpenAI / Anthropic / Gemini 및 Claude Code에도 도달합니다 |
| 가장 저렴한 경로 | $0 id에 25회 호출을 소진하세요: 체험 키에서는 순수한 `gpt-4o` / `claude-sonnet-4-6`이 **거부**됩니다; 접두사를 붙이면(`openai/gpt-4o`) 라우팅되고 잔액에서 청구됩니다 |

> 💡 무료 티어는 InferAll이 설정하며 변경될 수 있습니다. 실시간 수치는 [inferall.ai](https://inferall.ai)에서 확인하세요 — 그리고 도구 자체의 게이트가 결정하게 하세요:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 모델 — 83개 전부

체험 키로 `GET /v1/models`는 **83개 모델 id**로 응답했습니다(`providers/inferall/out/models.json`, 2026-10-20), 각 행은 자체 `pricing`을 포함합니다:

* **15개 행이 $0/$0** — 카드 없는 키가 실제로 호출할 수 있는 체험 세트: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, 그리고 이미지 라우트(`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **InferAll 자체** — `inferall-uncensored`, `inferall-uncensored-large`.

카탈로그는 가격표 역할도 합니다(`inferall.ai/models`가 이를 렌더링하고, `GET /v1/models`는 원시 JSON입니다) 그리고 체험 키가 호출할 수 있는 **무료 모델을 표시**합니다. 게이트웨이가 라우팅할 수 없는 id는 `400`으로 거부됩니다; 조용히 교체되는 일은 없으며, 응답의 `resp.model`은 항상 실제로 답한 모델을 명시합니다.

## 🧪 API 사용 방법

베이스 URL은 **`https://api.inferall.ai/v1`** 입니다 — OpenAI 호환이므로 어떤 OpenAI 클라이언트든 작동합니다(`OPENAI_BASE_URL` + `ifu_…` 키). Anthropic 형태의 앱은 대신 `ANTHROPIC_BASE_URL`을 `https://api.inferall.ai`로 지정할 수 있습니다.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* **체험** 키에서는 **$0 모델**을 지정하세요(또는 유료 모델에 제공자 접두사를 붙이세요); 유료 계정에서는 순수한 `gpt-4o` / `claude-sonnet-4-6`도 라우팅됩니다
* `X-Inferall-Routing: exact`는 게이트웨이의 자동 대체 모델/제공자 폴백을 비활성화합니다(기본적으로 켜져 있으며, 적격 무료 모델에 대해 병렬 백업 요청을 실행할 수 있습니다)
* `GET /ai/v1/key/status`는 체험 카운터와 잔액을 반환합니다; `X-InferAll-Trial-Usage`는 모든 응답에 동일한 카운터를 전달합니다
* 키는 발급 시 **한 번만** 출력됩니다 — `POST /ai/v1/keys`가 평문으로 존재하는 유일한 곳입니다

## 🛠 빠른 시작

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

키는 게이트를 통과한 **후에만** `keys.txt`에 기록됩니다: `/v1/models` → 200, 두 개의 서로 다른 프롬프트에 두 개의 서로 다른 비어 있지 않은 텍스트로 응답, 그리고 실제 `get_time` 도구 호출. 실패한 것은 `accounts.json`에 기록되고 다음 실행에서 재시도됩니다.

### 🖱️ 런처

`src/launcher.js`(이 README와 동일한 배너)는 커넥터 래퍼를 부팅합니다: 발급, 검증, 프록시 목록 스크리닝, 기억된 설정 표시, 그리고 로컬 9Router에 키 등록 — CLI 플래그는 소스를 읽지 않고도 구성 가능하게 유지되며, 답은 `launcher.config.json`에 저장됩니다. `src/connect-9router.js`는 `inferall` 접두사 아래에 제공자를 등록하고 `openai/gpt-oss-20b`를 기본 모델로 하며, `keys.txt`의 키당 하나의 연결을 만듭니다.

## 🚀 명령 하나

캡차는 대신 해결됩니다 — 명령 하나로 N개의 검증된 키를 발급합니다:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto`가 기본이며 아무것도 전달할 필요가 없습니다: 내장된 `src/solver.js`가 헤드 있는 Chrome을 열고, Turnstile 위젯을 마운트하고 토큰을 자동으로 반환합니다. `--dry`는 해석된 계획(개수, 출구 풀, 솔버, 모델)을 출력하고 **파일 기록도 네트워크 호출도 없이** 종료합니다. `node src/launcher.js`(또는 `npm start`)는 메뉴로서 동일한 경로입니다.

> ⚠️ **약관 및 계정 위험.** 이것은 자동화 도구이지 계정 판매자가 아닙니다. 대량 가입과 키 발급은 전적으로 귀하의 책임입니다: 제공자의 서비스 약관을 위반할 수 있으며 주소, 출구 또는 계정이 차단될 수 있습니다. 자동화가 허용된 인프라에서만 사용하고 요청 속도를 낮게 유지하세요.

## ✅ 검증됨 — 모든 키가 테스트됩니다

랩 실행 **2026-10-20**, 하나의 고정된 WARP 출구(`socks5h://127.0.0.1:40000`)를 통해:

* 메일함 — `temp.tf` Outlook 플러스 별칭(`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); 가입 메일은 **링크이며 코드가 아닙니다** — 제목 `Confirm Your Signup`, `inferall.ai`의 앱 자체 `noreply` 주소에서 발송(`out/ia-maildump.out`)
* Turnstile — 752자 토큰으로 응답할 때까지 위젯을 클릭했고, `/auth/v1/otp`가 이를 수락 → `200 {}`; 이전 세 번의 시도는 토큰이 왜 중요한지 정확히 보여줍니다(`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* 세션 — `GET /auth/v1/verify` → `303`, 프래그먼트에 `access_token`/`refresh_token` 포함(`out/verify-headers.txt`); `@supabase/ssr` 쿠키 `sb-<ref>-auth-token=base64-…`가 `GET /keys`를 **200**으로 응답하게 함(`out/ia-keys-run1.log`, `out/keys-authed.html`, 18,522 바이트)
* 키 — Supabase 액세스 토큰으로 `POST https://api.inferall.ai/ai/v1/keys` → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* 라이브 증명 — **chat-200 두 번**: `2026-10-20T21:07:46Z`(`out/chat-200-1792530466327.json`) 그리고 7분 00초 후 재검증 `2026-10-20T21:14:46Z`(`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — 모델 `openai/gpt-oss-20b`, 둘 다 `content:"pong"`으로 응답; 그 키로 `/v1/models` → 83개 행

증거: `providers/inferall/out/`(`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) 및 보고서 `providers/inferall/report.md`(UPDATE 2026-10-20).

> **품질 게이트.** 여기의 모든 키는 `keys.txt`에 기록되기 전에 라이브 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 조합도 모델 수준에서 동일한 규칙을 따릅니다: 항목은
> **모델이 `chat-200`으로 응답하고 도구를 호출할 수 있는 경우에만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키 또는 죽은 제공자는 추가되지 않고 제거됩니다. 언제든지 검증 단계를 다시 실행하세요;
> 실패는 보고되며, 절대 숨겨지지 않습니다.

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

계정당, 모든 제공자 바운드 요청은 **하나의 출구**를 통해 — Turnstile 토큰은 해결한 IP에 바인딩되므로, 페이지, OTP 호출, 메일함이 그 주소를 공유해야 합니다:

1. **메일함** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1`이 살아 있는 Outlook/Hotmail 풀 계정에 하나의 새 플러스 별칭을 돌려줍니다. 일회용 도메인은 패널에서 거부됩니다(`email_disposable_domain` / `403 email_domain_not_supported`).
2. **페이지** — 실제 헤드 있는 Chrome(`--remote-debugging-port`, 일회용 프로필, `--lang=en-US`)을 `/auth`로 향하게 하고, 선택적으로 `--proxy-server` 뒤에 둡니다. 이후의 모든 호출은 **그 페이지 안에서**(`fetch`, `credentials:'include'`) 이루어지므로, 출구 IP, UA, 쿠키를 상속합니다.
3. **앱 게이트** — `POST /api/turnstile/verify`는 비어 있지 않은 토큰 외에는 아무것도 요구하지 않습니다; 실제 검사는 OTP 옆의 Supabase 것입니다.
4. **Turnstile** — 위젯을 페이지에서 읽고, 비어 있으면 명시적으로 마운트(`render=explicit`)하여 고정된 리듬으로 클릭합니다; 상자를 찾기 위해 닫힌 섀도 루트를 통해 iframe을 관통합니다.
5. **OTP** — `gotrue_meta_security.captcha_token`과 함께 `POST <ref>.supabase.co/auth/v1/otp` → 확인 **링크**가 메일로 도착합니다.
6. **세션** — 링크의 토큰으로 `POST /auth/v1/verify`(`signup` / `magiclink` / `email` 모두 시도) → `access_token`.
7. **키** — 그 토큰으로 `POST https://api.inferall.ai/ai/v1/keys` → `ifu_…`, 8단계를 통과한 후에만 `keys.txt`에 기록됩니다.
8. **게이트** — `/v1/models` → 200, 두 개의 서로 다른 프롬프트에 서로 다른 비어 있지 않은 텍스트로 응답, 그리고 라이브 `get_time` 도구 호출(`src/cli.js`의 `proveKey()`).

## ⚙️ CLI 옵션

| 플래그 | 의미 |
| --- | --- |
| `--count N` | 발급할 계정(= 키) — 각각은 유지되기 전에 게이트를 통과합니다 |
| `--pool <file>` | 출구 목록, 한 줄에 프록시 하나(또는 `INFERALL_PROXIES` / `INFERALL_POOL`); 있으면 기본값은 `proxies.txt` |
| `--proxy <url>` | 모든 것에 대한 단일 출구(`http://`, `socks5://`, `socks4://`, 또는 순수한 `host:port`) |
| `--exits K` | 계정당 시도되는 출구 후보(기본 3) |
| `--model <id>` | 라이브 게이트에 사용되는 모델(기본 `openai/gpt-oss-20b`) |
| `--port N` | Chrome DevTools 포트(기본: 사용 가능한 포트) |
| `--browser PATH` | Chrome 바이너리(또는 `CHROME_PATH`; Windows/macOS/Linux에서 자동 감지) |
| `--headless` | **권장하지 않음** — 랩은 이것을 헤드 있는 모드로 실행합니다 |
| `--keep` | 실행이 끝날 때 Chrome을 열어 둡니다 |
| `--verify-only` | `keys.txt`의 모든 키를 게이트를 통해 다시 증명하고, 아무것도 발급하지 않습니다 |
| `--screen` | `inferall.ai/auth`에 대해 프록시 목록만 테스트합니다(처음 64개 출구) |
| `--mail-timeout <s>` | 가입 메일을 기다리는 시간(기본 300) |

환경 변수: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON`(자동 감지된 Supabase anon 키 재정의), `CHROME_PATH`. 풀이 없으면 도구는 **직접** 실행됩니다.

## 🛰️ 프록시 뒤에서

출구 목록은 선택 사항입니다 — 없으면 모든 것이 직접 갑니다:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* 한 번의 시도 = **하나의 출구, 하나의 브라우저, 하나의 계정**(Chrome은 시작 시 프록시를 고정하므로, 재시도는 다음 출구에서 새 브라우저를 얻습니다)
* 출구는 `inferall.ai`, `<ref>.supabase.co` **그리고** 메일 레일에 도달해야 합니다 — Turnstile 토큰은 해결한 IP에 바인딩되므로, 이들을 분리하면 가입이 깨집니다
* 2026-10-15 측정: 이 호스트에 대한 무료 풀의 수율은 두 번의 스크린에 걸쳐 **274개 중 0개의 작동하는 출구**였습니다(`providers/inferall/report.md`) — Vercel 앱과 무료 출구는 나쁜 짝이므로, 코드를 탓하기보다 주거용/스크리닝된 출구를 예산에 넣으세요
* 성공한 2026-10-20 발급은 단일 WARP 출구를 통해 실행되었습니다(`providers/inferall/out/extwave-journal.md`)

## 📄 파일

| 파일 | 내용 |
| --- | --- |
| `keys.txt` | 검증된 키, 한 줄에 하나(게이트에 의해서만 기록됨) |
| `accounts.json` | 계정 ↔ 키 ↔ 게이트 기록 |
| `proxies.txt` | 선택적 출구 목록, 한 줄에 하나 |
| `launcher.config.json` | 런처가 기억하는 것(생성됨, git 무시됨) |
| `repo-spec.json` | 이 패키징 명세 |
| `public-cli.js` | 발급 / 검증 / 스크린(node 표준 라이브러리만, 의존성 없음) |
| `description.txt`, `report.md` | 패널에 대한 측정 보고서 |
| `out/session-*.json` | 발급 중 캡처된 Supabase 세션 |
| `out/created-key.json` | 키 응답 + 그 `tier` / `controls` |
| `out/chat-200-*.json` | 두 개의 chat-200 증명(발급 + 7분 후 재검증) |
| `out/models.json` | 행별 가격이 포함된 83개 모델 응답 |
| `out/reach-warp/` | 원시 프로브 본문: `/auth`, `/keys`, Supabase 설정, anon 키, Turnstile 프로브 |

## 🔌 9Router에 연결

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

또는 도구가 하게 하세요: `node src/connect-9router.js --base http://localhost:20128 --password <pw>`가 하나의 `openai-compatible` 노드와 `keys.txt`의 키당 하나의 연결(`inferall-001`, `inferall-002`, …)을 등록합니다. 재실행은 멱등적이며 9Router는 키들에 걸쳐 로드 밸런싱합니다.

## 🔌 OmniRoute에 연결

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

또는 도구가 하게 하세요: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>`가 하나의 `openai-compatible` 노드와 `keys.txt`의 키당 하나의 연결(`inferall-001`, `inferall-002`, …)을 등록합니다. 재실행은 멱등적이며 OmniRoute는 키들에 걸쳐 로드 밸런싱합니다.

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 제공자 | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 제공자가 주는 것 | 키당 하나의 이메일 주소 — Cloudflare Turnstile 뒤의 Supabase 이메일 OTP, 계정당 25회 무료 NIM 호출, 모든 키 채팅 검증됨 |
| 🔑 키 하나로 얻는 것 | 자체 계정에 범위가 지정된 하나의 API 키: 아래 엔드포인트의 83개 모델 id, 귀하의 플랜 한도 내에서. 할당량은 **계정**에 있으므로, 이 도구가 키당 하나의 계정을 만드는 것입니다 |
| 🌐 API 형태 | OpenAI 호환: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 귀하의 데이터 | inferall.ai와 귀하가 구성한 메일함 백엔드만 접촉됩니다; 키는 귀하의 머신에 남습니다 |

## 🐞 이슈

* **`supabase.co`는 HTTP/2만 사용합니다.** 2026-10-23 측정: `curl --http1.1`은 멈추고, HTTP/2는 0.4초에 `401`로 응답하며, node의 `https.request`는 그 호스트에서 절대 완료되지 않습니다. 따라서 `src/cli.js`는 두 번째 클라이언트 — `requestH2()` — 를 포함하고 모든 `*.supabase.co` 호출을 그것을 통해 라우팅합니다(`H2_HOSTS`). HTTP/1.1로 GoTrue와 통신하는 귀하의 도구는 블랙홀처럼 보일 것입니다.
* **앱 게이트는 미끼입니다.** `POST /api/turnstile/verify`는 리터럴 문자열 `nonempty`에도 `{"ok":true}`로 응답합니다(`out/reach-warp/tsverify-probe.json`); 캡차를 강제하는 것은 Supabase이며(`captcha_failed` / `timeout-or-duplicate`), Turnstile 토큰은 일회용이고 IP에 바인딩됩니다.
* **헤드리스 Chrome은 거부됩니다.** 위젯은 보이는 브라우저에서만 통과합니다; `--headless`는 완전성을 위해 존재하며, 프로덕션용이 아닙니다.
* **브라우저 발급 경로는 아직 계정을 끝까지 완료하지 못했습니다.** 2026-10-21 레인에서 페이지가 렌더링되고, 앱 게이트가 `ok:true`로 응답하고, Turnstile 토큰을 얻었지만(`709`/`730`자), 페이지 내 OTP `fetch`가 매번 응답 없이 `status 0`으로 돌아왔고 `temp.tf` 리더가 그 후 멈췄습니다(`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). 여기 배포된 키는 랩의 curl/WARP 경로(`out/ia-mint.js`, `out/ia-keys.js`)로 발급되었고 두 번 재검증되었습니다; `--verify-only`와 9Router 커넥터가 이 빌드에서 증명된 경로이며, 발급에는 스크리닝된 출구와 응답하는 메일 레일이 필요합니다.
* **메일에 코드가 없습니다.** 가입 메시지는 `/auth/v1/verify?token=…` **링크**만 전달합니다 — 6자리 코드를 기다리는 레일은 시간 초과됩니다.
* **키 하나, 계정 하나.** 25회 호출 체험 카운터는 계정에 있으므로, 한 계정에서 두 개의 키를 발급해도 두 배가 되지 않습니다 — 그리고 엔드포인트는 평문 키를 정확히 한 번만 돌려주므로, 즉시 디스크에 기록됩니다.
* InferAll이 가입 형태나 위젯을 변경하면, 도구는 그 단계에서 멈추고 어느 것인지 알려줍니다. 실행한 명령과 정확한 출력을 가지고 **[이슈를 열어주세요](../../issues)**; PR을 환영합니다.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE)를 참조하세요.

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>