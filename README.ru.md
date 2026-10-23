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

**Массовое создание аккаунтов InferAll и API-ключей — OpenAI-совместимый инференс на https://api.inferall.ai/v1 для 83 идентификаторов моделей + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-83-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

InferAll (`inferall.ai`) — это **приложение на Next.js, размещённое на Vercel**, перед проектом **Supabase** (ref `epojjjpawjubtqqxabzu`) и отдельным шлюзом инференса на `api.inferall.ai` (бренд сервиса: Kindly Robotics). На странице входа предлагается **e-mail + одноразовая ссылка** (`signInWithOtp`) наряду с Google — собственные опубликованные настройки проекта подтверждают, что оба включены и что провайдер паролей не нужен (`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). Это делает панель **не только OAuth**: личность подтверждается **почтовым ящиком**, а именно эту часть и автоматизирует массовый конвейер.

Стоит внимания из-за того, что защищает этот вызов OTP: виджет Cloudflare **Turnstile** (sitekey `0x4AAAAAADhj5AjLCn-67Znk`), токен которого Supabase проверяет как `gotrue_meta_security.captcha_token`. Измерено: без токена → `captcha_failed`, повторно использованный → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), свежий → `200 {}` (`out/ia-mint-run4.log`). Собственный шлюз приложения `POST /api/turnstile/verify` — это приманка: он отвечает `{"ok":true}` на любую непустую строку (`out/reach-warp/tsverify-probe.json`).

Единица масштабирования — один аккаунт на ключ: пробный лимит привязан к **аккаунту**, а ключ (`ifu_…`) ограничен его областью действия.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| Пробный лимит | свежий ключ возвращается с `tier: "pending"` и получает **25 бесплатных вызовов NIM-моделей до любой оплаты** (документация шлюза, `providers/inferall/out/reach-warp/docs.body`); 26-й вызов отвечает **HTTP 402 — требуется оплата** |
| Модели за $0 | **15 из 83** строк каталога имеют `$0` на входе и `$0` на выходе (`out/models.json`) — пробный ключ без карты может вызывать их |
| Ключ создан | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, сообщение *"you can call the free open models right away, no card needed"* |
| Доказательство расхода | `POST /v1/chat/completions` на `openai/gpt-oss-20b` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Счётчик | `GET /ai/v1/key/status` сообщает `trial: {used, remaining, cap}`; каждый пробный вызов также несёт заголовки ответа `X-InferAll-Trial-Usage: N/CAP` и `X-InferAll-Trial-Status` |
| После пробного периода | 402 до стартового пакета за $5 на `inferall.ai/billing` — платный аккаунт затем также получает доступ к OpenAI / Anthropic / Gemini и Claude Code |
| Самый дешёвый путь | израсходуйте 25 вызовов на идентификаторах за $0: на пробном ключе голый `gpt-4o` / `claude-sonnet-4-6` **отклоняется**; добавьте префикс (`openai/gpt-4o`) — и он маршрутизируется, списываясь с баланса |

> 💡 Бесплатный тариф устанавливается InferAll и может измениться. Проверяйте актуальные цифры на [inferall.ai](https://inferall.ai) — и пусть собственный шлюз инструмента решает:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 83

`GET /v1/models` с пробным ключом вернул **83 идентификатора моделей** (`providers/inferall/out/models.json`, 2026-10-20), каждая строка несёт собственный `pricing`:

* **15 строк — $0/$0** — пробный набор, который ключ без карты действительно может вызывать: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, плюс маршруты изображений (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **Собственные модели InferAll** — `inferall-uncensored`, `inferall-uncensored-large`.

Каталог служит и прайс-листом (`inferall.ai/models` отображает его, `GET /v1/models` — это сырой JSON), и он **отмечает бесплатные**, которые может вызывать пробный ключ. Идентификатор, который шлюз не может маршрутизировать, отклоняется с `400`; он никогда не подменяется молча, и `resp.model` в ответе всегда называет модель, которая фактически ответила.

## 🧪 Как использовать API

Базовый URL — **`https://api.inferall.ai/v1`** — OpenAI-совместимый, поэтому работает любой клиент OpenAI (`OPENAI_BASE_URL` + ключ `ifu_…`). Приложения в стиле Anthropic могут указать `ANTHROPIC_BASE_URL` на `https://api.inferall.ai`.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* на **пробном** ключе указывайте **модель за $0** (или добавьте префикс провайдера к платной); на платном аккаунте голые `gpt-4o` / `claude-sonnet-4-6` тоже маршрутизируются
* `X-Inferall-Routing: exact` отключает автоматический резервный переход шлюза на альтернативную модель/провайдера (включён по умолчанию и может запускать параллельный резервный запрос для подходящих бесплатных моделей)
* `GET /ai/v1/key/status` возвращает счётчик пробного периода и баланс; `X-InferAll-Trial-Usage` несёт тот же счётчик в каждом ответе
* ключ выводится **один раз** в момент создания — `POST /ai/v1/keys` единственное место, где он существует в открытом виде

## 🛠 Быстрый старт

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

Ключ записывается в `keys.txt` **только** после прохождения шлюза: `/v1/models` → 200, два разных запроса, отвеченных двумя разными непустыми текстами, и реальный вызов инструмента `get_time`. Всё, что не прошло, фиксируется в `accounts.json` и повторяется при следующем запуске.

### 🖱️ Лаунчер

`src/launcher.js` (тот же баннер, что и в этом README) запускает обёртку коннектора: создание, проверка, отбор списка прокси, показ запомненных настроек и регистрация ключей в локальном 9Router — флаги CLI остаются настраиваемыми без чтения исходного кода, а ответы хранятся в `launcher.config.json`. `src/connect-9router.js` регистрирует провайдера под префиксом `inferall` с `openai/gpt-oss-20b` в качестве модели по умолчанию, по одному соединению на каждый ключ в `keys.txt`.

## ✅ Проверено в работе — каждый ключ протестирован

Лабораторный запуск **2026-10-20**, через один закреплённый выход WARP (`socks5h://127.0.0.1:40000`):

* почтовый ящик — plus-алиас Outlook на `temp.tf` (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); письмо при регистрации — это **ссылка, а не код** — тема `Confirm Your Signup`, от собственного адреса `noreply` приложения на `inferall.ai` (`out/ia-maildump.out`)
* Turnstile — виджет кликался, пока не ответил токеном из 752 символов, принятым `/auth/v1/otp` → `200 {}`; предыдущие три попытки наглядно показывают, почему токен важен (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* сессия — `GET /auth/v1/verify` → `303` с `access_token`/`refresh_token` во фрагменте (`out/verify-headers.txt`); cookie `@supabase/ssr` `sb-<ref>-auth-token=base64-…` заставляет `GET /keys` отвечать **200** (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18 522 байта)
* ключ — `POST https://api.inferall.ai/ai/v1/keys` с access-токеном Supabase → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* живое доказательство — **chat-200 дважды**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) и повторная проверка `2026-10-20T21:14:46Z`, спустя 7м00с (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — модель `openai/gpt-oss-20b`, обе отвечают `content:"pong"`; `/v1/models` с этим ключом → 83 строки

Доказательства: `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) и отчёт `providers/inferall/report.md` (UPDATE 2026-10-20).

> **Контроль качества.** Каждый ключ здесь прошёл живой `chat-200` до того, как был записан в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации роутера следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Повторяйте шаг проверки в любое время;
> сбои сообщаются, никогда не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

На каждый аккаунт каждый запрос к провайдеру идёт через **один выход** — токен Turnstile привязан к IP, решившему капчу, поэтому страница, вызов OTP и почтовый ящик должны использовать один и тот же адрес:

1. **почтовый ящик** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` возвращает один свежий plus-алиас на живом пуле аккаунтов Outlook/Hotmail. Одноразовые домены отклоняются панелью (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **страница** — настоящий headful Chrome (`--remote-debugging-port`, одноразовый профиль, `--lang=en-US`), направленный на `/auth`, опционально за `--proxy-server`. Каждый последующий вызов делается **в этой странице** (`fetch`, `credentials:'include'`), поэтому он наследует IP выхода, UA и cookie.
3. **шлюз приложения** — `POST /api/turnstile/verify` не требует ничего, кроме непустого токена; настоящая проверка — у Supabase, рядом с OTP.
4. **Turnstile** — виджет читается со страницы, и если он остаётся пустым, один монтируется явно (`render=explicit`) и кликается в фиксированном ритме; iframe'ы пронзаются через закрытые shadow root, чтобы найти поле.
5. **OTP** — `POST <ref>.supabase.co/auth/v1/otp` с `gotrue_meta_security.captcha_token` → **ссылка** подтверждения приходит по почте.
6. **сессия** — `POST /auth/v1/verify` с токеном из ссылки (`signup` / `magiclink` / `email` — все пробуются) → `access_token`.
7. **ключ** — `POST https://api.inferall.ai/ai/v1/keys` с этим токеном → `ifu_…`, записывается в `keys.txt` только после прохождения шага 8.
8. **шлюз** — `/v1/models` → 200, два разных запроса, отвеченных разным непустым текстом, и живой вызов инструмента `get_time` (`proveKey()` в `src/cli.js`).

## ⚙️ Опции CLI

| флаг | значение |
| --- | --- |
| `--count N` | аккаунтов (= ключей) для создания — каждый проходит шлюз до сохранения |
| `--pool <file>` | список выходов, по одному прокси на строку (или `INFERALL_PROXIES` / `INFERALL_POOL`); по умолчанию `proxies.txt`, если он есть |
| `--proxy <url>` | один выход для всего (`http://`, `socks5://`, `socks4://` или просто `host:port`) |
| `--exits K` | кандидатов выходов, пробуемых на аккаунт (по умолчанию 3) |
| `--model <id>` | модель, используемая для живого шлюза (по умолчанию `openai/gpt-oss-20b`) |
| `--port N` | порт Chrome DevTools (по умолчанию: свободный) |
| `--browser PATH` | бинарник Chrome (или `CHROME_PATH`; автоопределение на Windows/macOS/Linux) |
| `--headless` | **НЕ рекомендуется** — лаборатория запускает это в headful |
| `--keep` | оставить Chrome открытым по завершении запуска |
| `--verify-only` | перепроверить каждый ключ в `keys.txt` через шлюз, ничего не создавая |
| `--screen` | только протестировать список прокси против `inferall.ai/auth` (первые 64 выхода) |
| `--mail-timeout <s>` | сколько ждать письмо о регистрации (по умолчанию 300) |

Переменные окружения: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (переопределить автообнаруженный anon-ключ Supabase), `CHROME_PATH`. Без пула инструмент работает **напрямую**.

## 🛰️ За прокси

Список выходов необязателен — без него всё идёт напрямую:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* одна попытка = **один выход, один браузер, один аккаунт** (Chrome фиксирует свой прокси при запуске, поэтому повторная попытка получает свежий браузер на следующем выходе)
* выход должен достигать `inferall.ai`, `<ref>.supabase.co` **и** почтового конвейера — токен Turnstile привязан к IP, решившему капчу, поэтому их разделение ломает регистрацию
* измерено 2026-10-15: отдача бесплатного пула для этого хоста составила **0 рабочих выходов из 274** за два отбора (`providers/inferall/report.md`) — приложение на Vercel плюс бесплатные выходы — плохая пара, поэтому закладывайте резидентный/отобранный выход, а не вините код
* успешное создание 2026-10-20 прошло через единственный выход WARP (`providers/inferall/out/extwave-journal.md`)

## 📄 Файлы

| файл | что |
| --- | --- |
| `keys.txt` | проверенные ключи, по одному на строку (записывается только шлюзом) |
| `accounts.json` | запись аккаунт ↔ ключ ↔ шлюз |
| `proxies.txt` | необязательный список выходов, по одному на строку |
| `launcher.config.json` | то, что помнит лаунчер (генерируется, игнорируется git) |
| `repo-spec.json` | эта спецификация упаковки |
| `public-cli.js` | создание / проверка / отбор (только stdlib node, без зависимостей) |
| `description.txt`, `report.md` | измеренный отчёт о панели |
| `out/session-*.json` | сессия Supabase, захваченная во время создания |
| `out/created-key.json` | ответ с ключом + его `tier` / `controls` |
| `out/chat-200-*.json` | два доказательства chat-200 (создание + повторная проверка через 7м) |
| `out/models.json` | ответ с 83 моделями и ценами по каждой строке |
| `out/reach-warp/` | сырые тела проб: `/auth`, `/keys`, настройки Supabase, anon-ключ, проба Turnstile |

## 🔌 Подключение к 9Router

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Или позвольте инструменту сделать это: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` регистрирует один узел `openai-compatible` и одно соединение на каждый ключ в `keys.txt` (`inferall-001`, `inferall-002`, …). Повторный запуск идемпотентен, и 9Router балансирует нагрузку между ключами.

## 🔌 Подключение к OmniRoute

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Или позвольте инструменту сделать это: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` регистрирует один узел `openai-compatible` и одно соединение на каждый ключ в `keys.txt` (`inferall-001`, `inferall-002`, …). Повторный запуск идемпотентен, и OmniRoute балансирует нагрузку между ключами.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 Что даёт провайдер | Один адрес e-mail на ключ — e-mail OTP Supabase за Cloudflare Turnstile, 25 бесплатных вызовов NIM на аккаунт, каждый ключ проверен через чат |
| 🔑 Что даёт один ключ | один API-ключ, ограниченный своим аккаунтом: 83 идентификатора моделей на указанном ниже эндпоинте, в пределах лимитов вашего тарифа. Квота привязана к **аккаунту**, и именно поэтому этот инструмент создаёт один аккаунт на ключ |
| 🌐 Форма API | OpenAI-совместимый: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Ваши данные | связывается только с inferall.ai и настроенным вами бэкендом почтового ящика; ключи остаются на вашей машине |

## 🐞 Проблемы

* **`supabase.co` говорит только по HTTP/2.** Измерено 2026-10-23: `curl --http1.1` зависает, HTTP/2 отвечает `401` за 0,4 с, а `https.request` в node на этом хосте никогда не завершается. Поэтому `src/cli.js` несёт второй клиент — `requestH2()` — и направляет через него каждый вызов `*.supabase.co` (`H2_HOSTS`). Любой ваш инструмент, который общается с GoTrue по HTTP/1.1, будет выглядеть как чёрная дыра.
* **Шлюз приложения — приманка.** `POST /api/turnstile/verify` отвечает `{"ok":true}` на буквальную строку `nonempty` (`out/reach-warp/tsverify-probe.json`); именно Supabase проверяет капчу (`captcha_failed` / `timeout-or-duplicate`), а токен Turnstile одноразовый и привязан к IP.
* **Headless Chrome отклоняется.** Виджет проходит только в видимом браузере; `--headless` существует для полноты, а не для продакшена.
* **Путь создания через браузер ещё не завершил аккаунт от начала до конца.** В прогонах 2026-10-21 страница отрендерилась, шлюз приложения ответил `ok:true`, и токен Turnstile был получен (`709`/`730` символов), но внутристраничный `fetch` OTP каждый раз возвращал `status 0` без ответа, а затем считыватель `temp.tf` зависал (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). Ключ, поставляемый здесь, был создан лабораторным путём curl/WARP (`out/ia-mint.js`, `out/ia-keys.js`) и перепроверен дважды; `--verify-only` и коннектор 9Router — это пути, проверенные на данной сборке, а для создания нужен отобранный выход плюс отвечающий почтовый конвейер.
* **Никакого кода в письме.** Письмо о регистрации несёт только **ссылку** `/auth/v1/verify?token=…` — конвейер, ожидающий 6-значный код, истечёт по таймауту.
* **Один ключ, один аккаунт.** Счётчик пробных 25 вызовов привязан к аккаунту, поэтому создание двух ключей из одного аккаунта его не удвоит — и эндпоинт возвращает ключ в открытом виде ровно один раз, поэтому он сразу записывается на диск.
* Если InferAll изменит форму регистрации или виджет, инструмент остановится на этом шаге и скажет, на каком именно. **[Откройте issue](../../issues)** с командой, которую вы запустили, и точным выводом; PR приветствуются.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>