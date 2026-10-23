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

**批量创建 InferAll 账户和 API 密钥 —— 在 https://api.inferall.ai/v1 上提供 OpenAI 兼容推理，覆盖 83 个模型 id + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-83-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

InferAll（`inferall.ai`）是一个部署在 Vercel 上的 **Next.js 应用**，前端背后是一个 **Supabase** 项目（ref `epojjjpawjubtqqxabzu`），以及位于 `api.inferall.ai` 的独立推理网关（服务品牌：Kindly Robotics）。登录页面在 Google 之外还提供**电子邮件 + 一次性链接**（`signInWithOtp`）——该项目自己发布的设置确认两者均已开启，且不需要密码提供方（`email: true`、`google: true`：`providers/inferall/out/reach-warp/supa-settings.json`）。这使得它**并非仅支持 OAuth** 的面板：身份由**邮箱**证明，而这正是批量流水线可以自动化的部分。

值得一试，是因为守护该 OTP 调用的东西：一个 Cloudflare **Turnstile** 组件（sitekey `0x4AAAAAADhj5AjLCn-67Znk`），其 token 被 Supabase 作为 `gotrue_meta_security.captcha_token` 强制执行。实测：无 token → `captcha_failed`，重复使用 → `timeout-or-duplicate`（`out/ia-mint-run2.log`、`out/ia-mint-run3.log`），全新 token → `200 {}`（`out/ia-mint-run4.log`）。应用自身的关卡 `POST /api/turnstile/verify` 是个诱饵——它对任何非空字符串都返回 `{"ok":true}`（`out/reach-warp/tsverify-probe.json`）。

可扩展的单元是每个密钥对应一个账户：试用额度存在于**账户**上，而密钥（`ifu_…`）的作用域就绑定在该账户上。

## 🎁 免费额度 —— 你能得到多少

| 项目 | 值 |
| --- | --- |
| 试用额度 | 新密钥返回时是 `tier: "pending"`，在**任何付款之前可获得 25 次免费 NIM 模型调用**（网关文档，`providers/inferall/out/reach-warp/docs.body`）；第 26 次调用返回 **HTTP 402 —— 需要计费** |
| $0 模型 | 目录中 **83 行里有 15 行** 输入 `$0`、输出 `$0`（`out/models.json`）——无卡试用密钥可以调用这些 |
| 已铸造的密钥 | `out/created-key.json` —— `2026-10-20T21:04:29Z`，`tier: pending`，`budget_period: lifetime`，消息 *"you can call the free open models right away, no card needed"* |
| 消费证明 | 对 `openai/gpt-oss-20b` 发起 `POST /v1/chat/completions` → **200**，`content:"pong"`（`out/chat-200-1792530466327.json`） |
| 计数器 | `GET /ai/v1/key/status` 报告 `trial: {used, remaining, cap}`；每次试用调用还带有 `X-InferAll-Trial-Usage: N/CAP` 和 `X-InferAll-Trial-Status` 响应头 |
| 试用之后 | 在 `inferall.ai/billing` 购买 $5 入门包之前返回 402 —— 付费账户之后还能访问 OpenAI / Anthropic / Gemini 和 Claude Code |
| 最省钱的路径 | 把 25 次调用用在 $0 的 id 上：在试用密钥上，裸的 `gpt-4o` / `claude-sonnet-4-6` 会被**拒绝**；加上前缀（`openai/gpt-4o`）即可路由，从余额计费 |

> 💡 免费额度由 InferAll 设定，可能会变化。请在 [inferall.ai](https://inferall.ai) 查看实时数字——并让工具自身的关卡来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 —— 全部 83 个

用试用密钥请求 `GET /v1/models` 返回了 **83 个模型 id**（`providers/inferall/out/models.json`，2026-10-20），每一行都带有自己的 `pricing`：

* **15 行是 $0/$0** —— 无卡密钥实际可以调用的试用集合：`openai/gpt-oss-20b`、`nvidia/nemotron-3.5-super-vl-120b-a12b`、`nvidia/nemotron-3-ultra-550b-a55b`、`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`、`nvidia/nemotron-3.5-lightning-30b-a3b`、`nvidia/nemotron-3.5-content-safety`、`nvidia/nemotron-parse-2.0`、`nvidia/riva-translate-4b-instruct-v2`、`nvidia/ising-calibration-1.5-31b`、`z-ai/glm-5.3`、`z-ai/glm-5.3-flash`、`meta/muse-glimmer-30b`、`meta/llama-3.2-11b-vision-instruct`、`google/diffusiongemma-26b-a4b-it`、`stepfun-ai/step-5-preview`。
* **OpenAI** —— `openai/gpt-4o`、`gpt-4.1`、`o1`/`o1-pro`、`o3`/`o3-mini`、`o4-mini`、`gpt-5` … `gpt-5.6-terra`、`gpt-6-luna`、`gpt-6-sol`、`gpt-6.1-sol`、`gpt-6-astra`。
* **Anthropic** —— `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`、`claude-sonnet-5`、`claude-haiku-5-5`、`claude-fable-5-1`。
* **Gemini** —— `gemini/gemini-2.5-flash` … `gemini-3.8-flash`、`gemini-4-argon`，以及图像路由（`gemini-3.1-flash-image`、`gemini-nano-banana-2.1`）。
* **xAI** —— `grok-4.3` … `grok-4.7`、`grok-4.20-*-reasoning`、`grok-build-0.1`。
* **InferAll 自有** —— `inferall-uncensored`、`inferall-uncensored-large`。

该目录同时充当价目表（`inferall.ai/models` 渲染它，`GET /v1/models` 是原始 JSON），并且它**标记出**试用密钥可以调用的免费模型。网关无法路由的 id 会被以 `400` 拒绝；它绝不会被静默替换，回复中的 `resp.model` 始终指明实际作答的模型。

## 🧪 如何使用 API

基础 URL 是 **`https://api.inferall.ai/v1`** —— 兼容 OpenAI，因此任何 OpenAI 客户端都能用（`OPENAI_BASE_URL` + `ifu_…` 密钥）。Anthropic 形态的应用可以把 `ANTHROPIC_BASE_URL` 指向 `https://api.inferall.ai`。

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* 在**试用**密钥上，请指定一个 **$0 模型**（或给付费模型加上其提供方前缀）；在付费账户上，裸的 `gpt-4o` / `claude-sonnet-4-6` 也能路由
* `X-Inferall-Routing: exact` 会禁用网关的自动替代模型/提供方回退（默认开启，且可能为符合条件的免费模型运行并行备份请求）
* `GET /ai/v1/key/status` 返回试用计数器和余额；`X-InferAll-Trial-Usage` 在每个响应上携带相同的计数器
* 密钥在铸造时**只打印一次** —— `POST /ai/v1/keys` 是它唯一以明文存在的地方

## 🛠 快速开始

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

密钥**只有**在关卡通过后才会写入 `keys.txt`：`/v1/models` → 200，两个不同的提示词得到两段不同的非空文本，以及一次真实的 `get_time` 工具调用。任何失败都会被记录在 `accounts.json` 中，并在下次运行时重试。

### 🖱️ 启动器

`src/launcher.js`（与本 README 相同的横幅）启动连接器包装器：铸造、验证、筛选代理列表、显示记住的设置，并在本地 9Router 中注册密钥——CLI 标志无需阅读源码即可配置，答案保存在 `launcher.config.json` 中。`src/connect-9router.js` 在前缀 `inferall` 下注册提供方，默认模型为 `openai/gpt-oss-20b`，`keys.txt` 中每个密钥一个连接。

## 🚀 一条命令

验证码已为你解决——一条命令铸造 N 个已验证密钥：

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` 是默认值，无需传入任何参数：内嵌的 `src/solver.js` 会打开有头 Chrome，挂载 Turnstile 组件并自动返回 token。`--dry` 打印解析后的计划（数量、出口池、求解器、模型）并以**不写文件、不发网络请求**的方式退出。`node src/launcher.js`（或 `npm start`）是同一路径的菜单形式。

> ⚠️ **条款与账户风险。** 这是一个自动化工具，不是账户供应商。批量注册和密钥铸造完全由你负责：它们可能违反提供方的服务条款，并可能导致地址、出口或账户被封禁。请仅在你被允许自动化的基础设施上使用它，并保持低请求速率。

## ✅ 已验证可用 —— 每个密钥都经过测试

实验室运行 **2026-10-20**，通过一个固定的 WARP 出口（`socks5h://127.0.0.1:40000`）：

* 邮箱 —— 一个 `temp.tf` Outlook 加号别名（`<local>+<tag> [at] outlook.com`，`out/ia-mint-run4.log`）；注册邮件是一个**链接，不是验证码**——主题 `Confirm Your Signup`，来自应用自身在 `inferall.ai` 的 `noreply` 地址（`out/ia-maildump.out`）
* Turnstile —— 点击组件直到它返回一个 752 字符的 token，被 `/auth/v1/otp` 接受 → `200 {}`；前三次尝试恰好展示了 token 为何重要（`captcha_failed`、`timeout-or-duplicate`、`missing_token`）
* 会话 —— `GET /auth/v1/verify` → `303`，片段中包含 `access_token`/`refresh_token`（`out/verify-headers.txt`）；一个 `@supabase/ssr` cookie `sb-<ref>-auth-token=base64-…` 使 `GET /keys` 返回 **200**（`out/ia-keys-run1.log`、`out/keys-authed.html`，18,522 字节）
* 密钥 —— 用 Supabase 访问令牌发起 `POST https://api.inferall.ai/ai/v1/keys` → **`ifu_<…>`**，`tier: "pending"`，`out/created-key.json`
* 实时证明 —— **两次 chat-200**：`2026-10-20T21:07:46Z`（`out/chat-200-1792530466327.json`）以及 7 分 00 秒后的重新验证 `2026-10-20T21:14:46Z`（`out/chat-200-1792530886719.json`、`out/ia-chat-reverify.log`）——模型 `openai/gpt-oss-20b`，两者都回答 `content:"pong"`；用该密钥请求 `/v1/models` → 83 行

证据：`providers/inferall/out/`（`chat-200-*.json` ×2、`created-key.json`、`verify-headers.txt`、`keys-authed.html`、`reach-warp/`）以及报告 `providers/inferall/report.md`（UPDATE 2026-10-20）。

> **质量关卡。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
> （死密钥绝不会被交付）。路由器组合在模型层面遵循同样的规则：一个条目
> **只有在该模型回答 `chat-200` 且能调用工具时**才会被添加——不支持工具的模型、
> 死密钥或死提供方会被丢弃而不是添加。随时重新运行验证步骤；
> 失败会被报告，绝不会被隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

每个账户，所有发往提供方的请求都通过**一个出口**——Turnstile token 绑定到求解时的 IP，因此页面、OTP 调用和邮箱必须共享该地址：

1. **邮箱** —— `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` 返回一个活跃 Outlook/Hotmail 池账户上的全新加号别名。一次性域名会被面板拒绝（`email_disposable_domain` / `403 email_domain_not_supported`）。
2. **页面** —— 一个真实的有头 Chrome（`--remote-debugging-port`、一次性配置文件、`--lang=en-US`）指向 `/auth`，可选地位于 `--proxy-server` 之后。之后每次调用都**在该页面中**发起（`fetch`、`credentials:'include'`），因此它继承出口 IP、UA 和 cookie。
3. **应用关卡** —— `POST /api/turnstile/verify` 只要求一个非空 token；真正的检查是 Supabase 的，紧挨着 OTP。
4. **Turnstile** —— 从页面读取组件，如果它保持为空，则显式挂载一个（`render=explicit`）并以固定节奏点击；穿透封闭 shadow root 中的 iframe 来找到该框。
5. **OTP** —— 带 `gotrue_meta_security.captcha_token` 发起 `POST <ref>.supabase.co/auth/v1/otp` → 确认**链接**通过邮件到达。
6. **会话** —— 用链接中的 token 发起 `POST /auth/v1/verify`（`signup` / `magiclink` / `email` 都会尝试）→ `access_token`。
7. **密钥** —— 用该 token 发起 `POST https://api.inferall.ai/ai/v1/keys` → `ifu_…`，只有在第 8 步通过后才写入 `keys.txt`。
8. **关卡** —— `/v1/models` → 200，两个不同的提示词得到两段不同的非空文本，以及一次实时 `get_time` 工具调用（`src/cli.js` 中的 `proveKey()`）。

## ⚙️ CLI 选项

| 标志 | 含义 |
| --- | --- |
| `--count N` | 要铸造的账户数（= 密钥数）——每个在保留前都会过关 |
| `--pool <file>` | 出口列表，每行一个代理（或 `INFERALL_PROXIES` / `INFERALL_POOL`）；若存在则默认为 `proxies.txt` |
| `--proxy <url>` | 所有请求使用单一出口（`http://`、`socks5://`、`socks4://`，或裸 `host:port`） |
| `--exits K` | 每个账户尝试的出口候选数（默认 3） |
| `--model <id>` | 用于实时关卡的模型（默认 `openai/gpt-oss-20b`） |
| `--port N` | Chrome DevTools 端口（默认：一个空闲端口） |
| `--browser PATH` | Chrome 二进制文件（或 `CHROME_PATH`；在 Windows/macOS/Linux 上自动检测） |
| `--headless` | **不推荐** —— 实验室以有头模式运行 |
| `--keep` | 运行结束时保持 Chrome 打开 |
| `--verify-only` | 通过关卡重新验证 `keys.txt` 中的每个密钥，不铸造任何东西 |
| `--screen` | 仅针对 `inferall.ai/auth` 测试代理列表（前 64 个出口） |
| `--mail-timeout <s>` | 等待注册邮件的时间（默认 300） |

环境变量：`INFERALL_MODEL`、`INFERALL_POOL`、`INFERALL_PROXIES`、`INFERALL_ANON`（覆盖自动发现的 Supabase anon key）、`CHROME_PATH`。没有出口池时，工具以**直连**方式运行。

## 🛰️ 在代理之后

出口列表是可选的——没有它时一切都直连：

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* 一次尝试 = **一个出口、一个浏览器、一个账户**（Chrome 在启动时固定其代理，因此重试会在下一个出口上获得全新浏览器）
* 出口必须能到达 `inferall.ai`、`<ref>.supabase.co` **以及**邮件通道——Turnstile token 绑定到求解时的 IP，因此拆分它们会破坏注册
* 2026-10-15 实测：免费出口池对该主机的产出在两次筛选中是 **274 个出口中 0 个可用**（`providers/inferall/report.md`）——Vercel 应用加免费出口是糟糕的组合，所以请预算一个住宅/筛选过的出口，而不是责怪代码
* 2026-10-20 成功的铸造通过单个 WARP 出口运行（`providers/inferall/out/extwave-journal.md`）

## 📄 文件

| 文件 | 内容 |
| --- | --- |
| `keys.txt` | 已验证的密钥，每行一个（仅由关卡写入） |
| `accounts.json` | 账户 ↔ 密钥 ↔ 关卡记录 |
| `proxies.txt` | 可选的出口列表，每行一个 |
| `launcher.config.json` | 启动器记住的内容（生成，git 忽略） |
| `repo-spec.json` | 本打包规范 |
| `public-cli.js` | 铸造 / 验证 / 筛选（仅 node 标准库，无依赖） |
| `description.txt`、`report.md` | 对面板的实测报告 |
| `out/session-*.json` | 铸造期间捕获的 Supabase 会话 |
| `out/created-key.json` | 密钥响应及其 `tier` / `controls` |
| `out/chat-200-*.json` | 两次 chat-200 证明（铸造 + 7 分钟后重新验证） |
| `out/models.json` | 83 个模型的响应，含每行定价 |
| `out/reach-warp/` | 原始探测响应体：`/auth`、`/keys`、Supabase 设置、anon key、Turnstile 探测 |

## 🔌 连接到 9Router

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

或者让工具来做：`node src/connect-9router.js --base http://localhost:20128 --password <pw>` 注册一个 `openai-compatible` 节点，并为 `keys.txt` 中的每个密钥注册一个连接（`inferall-001`、`inferall-002`、…）。重复运行是幂等的，9Router 会在这些密钥之间负载均衡。

## 🔌 连接到 OmniRoute

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

或者让工具来做：`node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` 注册一个 `openai-compatible` 节点，并为 `keys.txt` 中的每个密钥注册一个连接（`inferall-001`、`inferall-002`、…）。重复运行是幂等的，OmniRoute 会在这些密钥之间负载均衡。

## 🔑 一个密钥能给你什么

| | |
| --- | --- |
| 🏢 提供方 | **InferAll** —— [inferall.ai](https://inferall.ai) |
| 🎁 提供方给什么 | 每个密钥一个电子邮件地址 —— Cloudflare Turnstile 背后的 Supabase 邮件 OTP，每个账户 25 次免费 NIM 调用，每个密钥都经过聊天验证 |
| 🔑 一个密钥能给你什么 | 一个作用域绑定到自己账户的 API 密钥：下方端点上的 83 个模型 id，受你套餐的限制。配额存在于**账户**上，这正是本工具为每个密钥创建一个账户的原因 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 你的数据 | 只联系 inferall.ai 和你配置的邮箱后端；密钥留在你的机器上 |

## 🐞 问题

* **`supabase.co` 只说 HTTP/2。** 2026-10-23 实测：`curl --http1.1` 挂起，HTTP/2 在 0.4 秒内返回 `401`，而 node 的 `https.request` 在该主机上永远无法完成。因此 `src/cli.js` 携带了第二个客户端——`requestH2()`——并将所有 `*.supabase.co` 调用路由通过它（`H2_HOSTS`）。任何你自己通过 HTTP/1.1 与 GoTrue 通信的工具都会看起来像黑洞。
* **应用关卡是诱饵。** `POST /api/turnstile/verify` 对字面字符串 `nonempty` 返回 `{"ok":true}`（`out/reach-warp/tsverify-probe.json`）；真正强制执行验证码的是 Supabase（`captcha_failed` / `timeout-or-duplicate`），而 Turnstile token 是一次性且绑定 IP 的。
* **无头 Chrome 会被拒绝。** 组件只在可见浏览器中通过；`--headless` 是为了完整性而存在，不是用于生产。
* **浏览器铸造路径尚未端到端完成一个账户。** 在 2026-10-21 的通道中，页面渲染了，应用关卡返回 `ok:true`，并获得了 Turnstile token（`709`/`730` 字符），但页面内的 OTP `fetch` 每次都返回 `status 0` 且无响应，随后 `temp.tf` 读取器停滞（`out/mint-lane2.log`、`out/mint-lane3.log`、`out/mint-lane-1792733036.log`）。这里交付的密钥是由实验室的 curl/WARP 路径铸造的（`out/ia-mint.js`、`out/ia-keys.js`）并重新验证了两次；`--verify-only` 和 9Router 连接器是在此构建上验证过的路径，而铸造需要一个筛选过的出口加上能响应的邮件通道。
* **邮件中没有验证码。** 注册消息只携带一个 `/auth/v1/verify?token=…` **链接**——等待 6 位数字验证码的通道会超时。
* **一个密钥，一个账户。** 25 次调用的试用计数器存在于账户上，因此从一个账户铸造两个密钥不会让它翻倍——而且端点只把明文密钥返回一次，这就是它被立即写入磁盘的原因。
* 如果 InferAll 更改其注册形态或组件，工具会在该步骤停止并说明是哪一步。请附上你运行的命令和确切输出**[提交 issue](../../issues)**；欢迎 PR。

## 📄 许可证

MIT © 2026 —— 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>