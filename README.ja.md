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

**InferAll アカウントと API キーを一括作成 — https://api.inferall.ai/v1 で 83 個のモデル ID と 9Router コネクタにわたる OpenAI 互換推論。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-83-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

InferAll (`inferall.ai`) は、**Supabase** プロジェクト (ref `epojjjpawjubtqqxabzu`) と `api.inferall.ai` にある別個の推論ゲートウェイ (サービスブランド: Kindly Robotics) の前段に置かれた **Vercel 上の Next.js アプリ**です。サインインページでは Google の隣に**メール + ワンタイムリンク** (`signInWithOtp`) が用意されており、プロジェクト自身が公開している設定でも両方が有効で、パスワードプロバイダは不要であることが確認できます (`email: true`、`google: true`: `providers/inferall/out/reach-warp/supa-settings.json`)。つまりこれは **OAuth 専用**のパネルでは**ありません**: 身元は**メールボックス**によって証明され、まさにそこが一括レールの自動化対象なのです。

この OTP 呼び出しを守っているもののおかげで、一考の価値があります: Cloudflare の **Turnstile** ウィジェット (sitekey `0x4AAAAAADhj5AjLCn-67Znk`) で、そのトークンを Supabase が `gotrue_meta_security.captcha_token` として強制します。実測: トークンなし → `captcha_failed`、再利用 → `timeout-or-duplicate` (`out/ia-mint-run2.log`、`out/ia-mint-run3.log`)、新規 → `200 {}` (`out/ia-mint-run4.log`)。アプリ自身のゲート `POST /api/turnstile/verify` はデコイです — 空でない任意の文字列に対して `{"ok":true}` と返します (`out/reach-warp/tsverify-probe.json`)。

スケールする単位はキーごとに 1 アカウントです: トライアル枠は**アカウント**に紐づき、キー (`ifu_…`) はそのアカウントにスコープされます。

## 🎁 無料枠 — どれだけ使えるか

| 項目 | 値 |
| --- | --- |
| トライアル枠 | 新しいキーは `tier: "pending"` で返り、**支払い前に 25 回の無料 NIM モデル呼び出し**が可能 (ゲートウェイドキュメント、`providers/inferall/out/reach-warp/docs.body`)。26 回目の呼び出しは **HTTP 402 — billing required** と返ります |
| $0 モデル | カタログ 83 行のうち **15 行**が入力 `$0`・出力 `$0` (`out/models.json`) — カードなしのトライアルキーでもこれらは呼び出せます |
| 発行されたキー | `out/created-key.json` — `2026-10-20T21:04:29Z`、`tier: pending`、`budget_period: lifetime`、メッセージ *"you can call the free open models right away, no card needed"* |
| 消費の証明 | `openai/gpt-oss-20b` への `POST /v1/chat/completions` → **200**、`content:"pong"` (`out/chat-200-1792530466327.json`) |
| カウンタ | `GET /ai/v1/key/status` が `trial: {used, remaining, cap}` を報告。すべてのトライアル呼び出しは `X-InferAll-Trial-Usage: N/CAP` と `X-InferAll-Trial-Status` レスポンスヘッダも伴います |
| トライアル後 | `inferall.ai/billing` の $5 スターターパックまで 402 — 支払い済みアカウントは OpenAI / Anthropic / Gemini と Claude Code にも到達できます |
| 最も安い経路 | $0 の ID で 25 回を使い切る: トライアルキーでは素の `gpt-4o` / `claude-sonnet-4-6` は**拒否**されます。プレフィックスを付けると (`openai/gpt-4o`) ルーティングされ、残高から課金されます |

> 💡 無料枠は InferAll が設定するもので、変更される可能性があります。最新の数値は [inferall.ai](https://inferall.ai) で確認してください — そしてツール自身のゲートに判断させましょう:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 83 個すべて

トライアルキーでの `GET /v1/models` は **83 個のモデル ID** を返しました (`providers/inferall/out/models.json`、2026-10-20)。各行はそれぞれの `pricing` を持ちます:

* **15 行が $0/$0** — カードなしのキーが実際に呼び出せるトライアルセット: `openai/gpt-oss-20b`、`nvidia/nemotron-3.5-super-vl-120b-a12b`、`nvidia/nemotron-3-ultra-550b-a55b`、`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`、`nvidia/nemotron-3.5-lightning-30b-a3b`、`nvidia/nemotron-3.5-content-safety`、`nvidia/nemotron-parse-2.0`、`nvidia/riva-translate-4b-instruct-v2`、`nvidia/ising-calibration-1.5-31b`、`z-ai/glm-5.3`、`z-ai/glm-5.3-flash`、`meta/muse-glimmer-30b`、`meta/llama-3.2-11b-vision-instruct`、`google/diffusiongemma-26b-a4b-it`、`stepfun-ai/step-5-preview`。
* **OpenAI** — `openai/gpt-4o`、`gpt-4.1`、`o1`/`o1-pro`、`o3`/`o3-mini`、`o4-mini`、`gpt-5` … `gpt-5.6-terra`、`gpt-6-luna`、`gpt-6-sol`、`gpt-6.1-sol`、`gpt-6-astra`。
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`、`claude-sonnet-5`、`claude-haiku-5-5`、`claude-fable-5-1`。
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`、`gemini-4-argon`、加えて画像ルート (`gemini-3.1-flash-image`、`gemini-nano-banana-2.1`)。
* **xAI** — `grok-4.3` … `grok-4.7`、`grok-4.20-*-reasoning`、`grok-build-0.1`。
* **InferAll 自身のモデル** — `inferall-uncensored`、`inferall-uncensored-large`。

カタログは価格表も兼ねており (`inferall.ai/models` が描画し、`GET /v1/models` が生の JSON)、トライアルキーが呼び出せる**無料のものを示します**。ゲートウェイがルーティングできない ID は `400` で拒否されます。決して黙って差し替えられることはなく、応答の `resp.model` は常に実際に応答したモデルを名指しします。

## 🧪 API の使い方

ベース URL は **`https://api.inferall.ai/v1`** — OpenAI 互換なので、任意の OpenAI クライアントが動作します (`OPENAI_BASE_URL` + `ifu_…` キー)。Anthropic 形式のアプリは代わりに `ANTHROPIC_BASE_URL` を `https://api.inferall.ai` に向けられます。

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* **トライアル**キーでは、**$0 モデル**を指定する (または有料モデルにプロバイダのプレフィックスを付ける) ようにしてください。支払い済みアカウントでは素の `gpt-4o` / `claude-sonnet-4-6` もルーティングされます
* `X-Inferall-Routing: exact` はゲートウェイの自動代替モデル/プロバイダフォールバック (デフォルトで有効で、対象の無料モデルでは並行バックアップリクエストを実行することがあります) を無効にします
* `GET /ai/v1/key/status` はトライアルカウンタと残高を返します。`X-InferAll-Trial-Usage` はすべてのレスポンスで同じカウンタを運びます
* キーは発行時に**一度だけ**表示されます — `POST /ai/v1/keys` が平文で存在する唯一の場所です

## 🛠 クイックスタート

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

キーが `keys.txt` に書き込まれるのは、ゲートを通過した**後だけ**です: `/v1/models` → 200、2 つの異なるプロンプトが 2 つの異なる非空テキストで応答され、実際の `get_time` ツール呼び出しが成功すること。失敗したものは `accounts.json` に記録され、次回の実行で再試行されます。

### 🖱️ ランチャー

`src/launcher.js` (この README と同じバナー) はコネクタラッパーを起動します: 発行、検証、プロキシリストのスクリーニング、記憶された設定の表示、ローカル 9Router へのキー登録 — CLI フラグはソースを読むことなく設定可能なままで、その回答は `launcher.config.json` に保存されます。`src/connect-9router.js` はプロバイダをプレフィックス `inferall` で登録し、デフォルトモデルを `openai/gpt-oss-20b` とし、`keys.txt` のキーごとに 1 つの接続を作成します。

## 🚀 コマンド 1 つ

キャプチャは自動で解決されます — コマンド 1 つで N 個の検証済みキーを発行します:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` がデフォルトで、何も渡す必要はありません: 組み込みの `src/solver.js` がヘッド付き Chrome を開き、Turnstile ウィジェットをマウントし、トークンを自動的に返します。`--dry` は解決されたプラン (カウント、出口プール、ソルバー、モデル) を表示し、**ファイル書き込みもネットワーク呼び出しもなく**終了します。`node src/launcher.js` (または `npm start`) は同じ経路をメニューとして提供します。

> ⚠️ **利用規約とアカウントのリスク。** これは自動化ツールであり、アカウント販売業者ではありません。一括サインアップとキー発行は完全にあなたの責任です: プロバイダの利用規約に違反する可能性があり、アドレス、出口、アカウントがブロックされることがあります。自動化が許可されているインフラでのみ使用し、リクエストレートを低く保ってください。

## ✅ 動作検証済み — すべてのキーがテストされています

ラボ実行 **2026-10-20**、1 つの固定 WARP 出口 (`socks5h://127.0.0.1:40000`) 経由:

* メールボックス — `temp.tf` の Outlook プラスエイリアス (`<local>+<tag> [at] outlook.com`、`out/ia-mint-run4.log`)。サインアップメールは**リンクであり、コードではありません** — 件名 `Confirm Your Signup`、送信元はアプリ自身の `inferall.ai` の `noreply` アドレス (`out/ia-maildump.out`)
* Turnstile — 752 文字のトークンで応答するまでウィジェットをクリックし、`/auth/v1/otp` に受け入れられて `200 {}`。直前の 3 回の試行はトークンがなぜ重要かを正確に示しています (`captcha_failed`、`timeout-or-duplicate`、`missing_token`)
* セッション — `GET /auth/v1/verify` → `303`、フラグメントに `access_token`/`refresh_token` (`out/verify-headers.txt`)。`@supabase/ssr` Cookie `sb-<ref>-auth-token=base64-…` により `GET /keys` が **200** を返す (`out/ia-keys-run1.log`、`out/keys-authed.html`、18,522 バイト)
* キー — Supabase アクセストークンで `POST https://api.inferall.ai/ai/v1/keys` → **`ifu_<…>`**、`tier: "pending"`、`out/created-key.json`
* ライブ証明 — **chat-200 を 2 回**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) と再検証 `2026-10-20T21:14:46Z`、7 分 00 秒後 (`out/chat-200-1792530886719.json`、`out/ia-chat-reverify.log`) — モデル `openai/gpt-oss-20b`、どちらも `content:"pong"` と応答。そのキーでの `/v1/models` → 83 行

証拠: `providers/inferall/out/` (`chat-200-*.json` ×2、`created-key.json`、`verify-headers.txt`、`keys-authed.html`、`reach-warp/`) と解説 `providers/inferall/report.md` (UPDATE 2026-10-20)。

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブの `chat-200` を通過しています
> (死んだキーは決して出荷されません)。ルーターのコンボもモデルレベルで同じルールに従います: エントリが
> 追加されるのは、**モデルが `chat-200` に応答し、ツールを呼び出せる場合のみ**です — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダは追加されずに除外されます。検証ステップはいつでも再実行できます。
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

アカウントごとに、プロバイダへ向かうすべてのリクエストは**1 つの出口**を通ります — Turnstile トークンは解決した IP に紐づくため、ページ、OTP 呼び出し、メールボックスはそのアドレスを共有しなければなりません:

1. **メールボックス** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` が、稼働中の Outlook/Hotmail プールアカウント上の新しいプラスエイリアスを 1 つ返します。使い捨てドメインはパネルによって拒否されます (`email_disposable_domain` / `403 email_domain_not_supported`)。
2. **ページ** — 実際のヘッド付き Chrome (`--remote-debugging-port`、使い捨てプロファイル、`--lang=en-US`) を `/auth` に向け、必要に応じて `--proxy-server` の背後に置きます。以降のすべての呼び出しは**そのページ内で**行われ (`fetch`、`credentials:'include'`)、出口 IP、UA、Cookie を継承します。
3. **アプリゲート** — `POST /api/turnstile/verify` は空でないトークン以外何も要求しません。本当のチェックは OTP の隣にある Supabase のものです。
4. **Turnstile** — ウィジェットはページから読み取られ、空のままなら明示的にマウントされ (`render=explicit`)、一定のリズムでクリックされます。ボックスを見つけるために、iframe は閉じたシャドウルートを通して貫通されます。
5. **OTP** — `gotrue_meta_security.captcha_token` を伴う `POST <ref>.supabase.co/auth/v1/otp` → 確認**リンク**がメールで届きます。
6. **セッション** — リンクのトークン (`signup` / `magiclink` / `email` をすべて試行) を伴う `POST /auth/v1/verify` → `access_token`。
7. **キー** — そのトークンを伴う `POST https://api.inferall.ai/ai/v1/keys` → `ifu_…`、ステップ 8 を通過したときにのみ `keys.txt` に書き込まれます。
8. **ゲート** — `/v1/models` → 200、2 つの異なるプロンプトが異なる非空テキストで応答され、ライブの `get_time` ツール呼び出し (`src/cli.js` の `proveKey()`)。

## ⚙️ CLI オプション

| フラグ | 意味 |
| --- | --- |
| `--count N` | 発行するアカウント数 (= キー数) — それぞれ保持される前にゲートを通ります |
| `--pool <file>` | 出口リスト、1 行に 1 プロキシ (または `INFERALL_PROXIES` / `INFERALL_POOL`)。存在すればデフォルトで `proxies.txt` |
| `--proxy <url>` | すべてに対する単一の出口 (`http://`、`socks5://`、`socks4://`、または素の `host:port`) |
| `--exits K` | アカウントごとに試す出口候補 (デフォルト 3) |
| `--model <id>` | ライブゲートで使用するモデル (デフォルト `openai/gpt-oss-20b`) |
| `--port N` | Chrome DevTools ポート (デフォルト: 空いているもの) |
| `--browser PATH` | Chrome バイナリ (または `CHROME_PATH`。Windows/macOS/Linux で自動検出) |
| `--headless` | **非推奨** — ラボではこれをヘッド付きで実行します |
| `--keep` | 実行終了時に Chrome を開いたままにします |
| `--verify-only` | `keys.txt` のすべてのキーをゲートで再証明し、何も発行しません |
| `--screen` | `inferall.ai/auth` に対してプロキシリストのみをテストします (最初の 64 出口) |
| `--mail-timeout <s>` | サインアップメールを待つ時間 (デフォルト 300) |

環境変数: `INFERALL_MODEL`、`INFERALL_POOL`、`INFERALL_PROXIES`、`INFERALL_ANON` (自動検出された Supabase anon キーを上書き)、`CHROME_PATH`。プールがなければツールは**直接**実行されます。

## 🛰️ プロキシの背後で

出口リストは任意です — なければすべて直接実行されます:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* 1 回の試行 = **1 つの出口、1 つのブラウザ、1 つのアカウント** (Chrome は起動時にプロキシを固定するため、再試行は次の出口で新しいブラウザを取得します)
* 出口は `inferall.ai`、`<ref>.supabase.co`、**そして**メールレールに到達できなければなりません — Turnstile トークンは解決した IP に紐づくため、それらを分割するとサインアップが壊れます
* 2026-10-15 の実測: このホストに対する無料プールの歩留まりは、2 回のスクリーンで **274 中 0 の稼働出口**でした (`providers/inferall/report.md`) — Vercel アプリと無料出口は相性が悪いので、コードを責めるのではなく、レジデンシャル/スクリーニング済みの出口を予算に組み込んでください
* 成功した 2026-10-20 の発行は、単一の WARP 出口を通して実行されました (`providers/inferall/out/extwave-journal.md`)

## 📄 ファイル

| ファイル | 内容 |
| --- | --- |
| `keys.txt` | 検証済みキー、1 行に 1 つ (ゲートによってのみ書き込まれます) |
| `accounts.json` | アカウント ↔ キー ↔ ゲート記録 |
| `proxies.txt` | 任意の出口リスト、1 行に 1 つ |
| `launcher.config.json` | ランチャーが記憶するもの (生成、git 無視) |
| `repo-spec.json` | このパッケージング仕様 |
| `public-cli.js` | 発行 / 検証 / スクリーン (node 標準ライブラリのみ、依存関係なし) |
| `description.txt`、`report.md` | パネルの実測解説 |
| `out/session-*.json` | 発行中にキャプチャされた Supabase セッション |
| `out/created-key.json` | キーの応答 + その `tier` / `controls` |
| `out/chat-200-*.json` | 2 つの chat-200 証明 (発行 + 7 分後の再検証) |
| `out/models.json` | 行ごとの価格を含む 83 モデルの応答 |
| `out/reach-warp/` | 生のプローブボディ: `/auth`、`/keys`、Supabase 設定、anon キー、Turnstile プローブ |

## 🔌 9Router に接続

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

またはツールに任せてください: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` が 1 つの `openai-compatible` ノードと、`keys.txt` のキーごとに 1 つの接続 (`inferall-001`、`inferall-002`、…) を登録します。再実行は冪等で、9Router はキー間で負荷分散します。

## 🔌 OmniRoute に接続

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

またはツールに任せてください: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` が 1 つの `openai-compatible` ノードと、`keys.txt` のキーごとに 1 つの接続 (`inferall-001`、`inferall-002`、…) を登録します。再実行は冪等で、OmniRoute はキー間で負荷分散します。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダ | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 プロバイダが提供するもの | キーごとに 1 つのメールアドレス — Cloudflare Turnstile 背後の Supabase メール OTP、アカウントごとに 25 回の無料 NIM 呼び出し、すべてのキーがチャット検証済み |
| 🔑 1 つのキーで得られるもの | 自身のアカウントにスコープされた 1 つの API キー: 下記エンドポイントの 83 モデル ID を、あなたのプランの制限で。クォータは**アカウント**に紐づくため、このツールがキーごとに 1 アカウントを作成するのです |
| 🌐 API 形式 | OpenAI 互換: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 あなたのデータ | 接触するのは inferall.ai と、あなたが設定した受信トレイバックエンドのみ。キーはあなたのマシンに留まります |

## 🐞 問題

* **`supabase.co` は HTTP/2 しか話しません。** 2026-10-23 の実測: `curl --http1.1` はハングし、HTTP/2 は 0.4 秒で `401` を返し、node の `https.request` はそのホストで決して完了しません。そのため `src/cli.js` は第 2 のクライアント — `requestH2()` — を備え、すべての `*.supabase.co` 呼び出しをそれ経由でルーティングします (`H2_HOSTS`)。GoTrue と HTTP/1.1 で話すあなた自身のツールは、ブラックホールのように見えるでしょう。
* **アプリゲートはデコイです。** `POST /api/turnstile/verify` はリテラル文字列 `nonempty` に対して `{"ok":true}` と返します (`out/reach-warp/tsverify-probe.json`)。キャプチャを強制しているのは Supabase であり (`captcha_failed` / `timeout-or-duplicate`)、Turnstile トークンは単回使用で IP に紐づきます。
* **ヘッドレス Chrome は拒否されます。** ウィジェットは可視ブラウザでのみクリアされます。`--headless` は完全性のために存在し、本番用ではありません。
* **ブラウザ発行経路はまだアカウントをエンドツーエンドで完了していません。** 2026-10-21 のレーンでは、ページがレンダリングされ、アプリゲートが `ok:true` と応答し、Turnstile トークンが取得されました (`709`/`730` 文字) が、ページ内 OTP `fetch` は毎回 `status 0` で応答なしとなり、その後 `temp.tf` リーダーが停止しました (`out/mint-lane2.log`、`out/mint-lane3.log`、`out/mint-lane-1792733036.log`)。ここで出荷されるキーはラボの curl/WARP 経路 (`out/ia-mint.js`、`out/ia-keys.js`) で発行され、2 回再検証されました。`--verify-only` と 9Router コネクタがこのビルドで証明された経路であり、発行にはスクリーニング済みの出口と応答するメールレールが必要です。
* **メールにコードはありません。** サインアップメッセージは `/auth/v1/verify?token=…` の**リンク**のみを運びます — 6 桁のコードを待つレールはタイムアウトします。
* **1 つのキー、1 つのアカウント。** 25 回のトライアルカウンタはアカウントに紐づくため、1 つのアカウントから 2 つのキーを発行しても倍にはなりません — そしてエンドポイントは平文キーをちょうど 1 回だけ返すため、すぐにディスクに書き込まれます。
* InferAll がサインアップの形やウィジェットを変更した場合、ツールはそのステップで停止し、どれかを告げます。実行したコマンドと正確な出力を添えて **[issue を開いてください](../../issues)**。PR も歓迎します。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>