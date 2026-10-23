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

**Crea cuentas y claves de API de InferAll en masa — inferencia compatible con OpenAI en https://api.inferall.ai/v1 en 83 ids de modelos + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-83-of-them) · [🧪 Usa la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

InferAll (`inferall.ai`) es una **aplicación Next.js en Vercel** delante de un proyecto de **Supabase** (ref `epojjjpawjubtqqxabzu`) y una pasarela de inferencia independiente en `api.inferall.ai` (marca de servicio: Kindly Robotics). La página de inicio de sesión ofrece **correo electrónico + enlace de un solo uso** (`signInWithOtp`) junto a Google — la propia configuración publicada del proyecto confirma que ambos están activados y que no se necesita ningún proveedor de contraseña (`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). Eso hace que este **no sea** un panel solo de OAuth: la identidad se demuestra mediante el **buzón de correo**, que es exactamente la parte que automatiza un riel masivo.

Merece la pena por lo que protege esa llamada OTP: un widget de Cloudflare **Turnstile** (sitekey `0x4AAAAAADhj5AjLCn-67Znk`) cuyo token Supabase exige como `gotrue_meta_security.captcha_token`. Medido: sin token → `captcha_failed`, uno reutilizado → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), uno nuevo → `200 {}` (`out/ia-mint-run4.log`). La propia puerta de la aplicación `POST /api/turnstile/verify` es un señuelo — responde `{"ok":true}` a cualquier cadena no vacía (`out/reach-warp/tsverify-probe.json`).

La unidad que escala es una cuenta por clave: la asignación de prueba vive en la **cuenta**, y la clave (`ifu_…`) está limitada a ella.

## 🎁 Nivel gratuito — cuánto obtienes

| Qué | Valor |
| --- | --- |
| Asignación de prueba | una clave nueva vuelve con `tier: "pending"` y obtiene **25 llamadas gratuitas a modelos NIM antes de cualquier pago** (documentación de la pasarela, `providers/inferall/out/reach-warp/docs.body`); la llamada número 26 responde **HTTP 402 — se requiere facturación** |
| Modelos a $0 | **15 de las 83** filas del catálogo son `$0` de entrada y `$0` de salida (`out/models.json`) — una clave de prueba sin tarjeta puede llamar a esos |
| Clave creada | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, mensaje *"you can call the free open models right away, no card needed"* |
| Prueba de gasto | `POST /v1/chat/completions` en `openai/gpt-oss-20b` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Contador | `GET /ai/v1/key/status` informa `trial: {used, remaining, cap}`; cada llamada de prueba también lleva las cabeceras de respuesta `X-InferAll-Trial-Usage: N/CAP` y `X-InferAll-Trial-Status` |
| Después de la prueba | 402 hasta el paquete inicial de $5 en `inferall.ai/billing` — una cuenta de pago también alcanza entonces OpenAI / Anthropic / Gemini y Claude Code |
| Ruta más barata | consume las 25 llamadas en los ids a $0: en una clave de prueba un `gpt-4o` / `claude-sonnet-4-6` sin prefijo es **rechazado**; añádele el prefijo (`openai/gpt-4o`) y enruta, facturado desde el saldo |

> 💡 El nivel gratuito lo define InferAll y puede cambiar. Consulta las cifras en vivo en [inferall.ai](https://inferall.ai) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 83

`GET /v1/models` con la clave de prueba respondió **83 ids de modelos** (`providers/inferall/out/models.json`, 2026-10-20), cada fila con su propio `pricing`:

* **15 filas son $0/$0** — el conjunto de prueba que una clave sin tarjeta puede llamar realmente: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, más las rutas de imagen (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **Propios de InferAll** — `inferall-uncensored`, `inferall-uncensored-large`.

El catálogo sirve también como lista de precios (`inferall.ai/models` lo renderiza, `GET /v1/models` es el JSON sin procesar) y **marca los gratuitos** que una clave de prueba puede llamar. Un id que la pasarela no puede enrutar se rechaza con `400`; nunca se sustituye en silencio, y `resp.model` en la respuesta siempre nombra el modelo que realmente respondió.

## 🧪 Cómo usar la API

La URL base es **`https://api.inferall.ai/v1`** — compatible con OpenAI, así que cualquier cliente de OpenAI funciona (`OPENAI_BASE_URL` + clave `ifu_…`). Las aplicaciones con forma de Anthropic pueden apuntar `ANTHROPIC_BASE_URL` a `https://api.inferall.ai` en su lugar.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* en una clave de **prueba**, nombra un **modelo a $0** (o añade el prefijo de proveedor a uno de pago); en una cuenta de pago también enrutan `gpt-4o` / `claude-sonnet-4-6` sin prefijo
* `X-Inferall-Routing: exact` desactiva el fallback automático de modelo/proveedor alternativo de la pasarela (que está activado por defecto, y puede ejecutar una solicitud de respaldo paralela para modelos gratuitos elegibles)
* `GET /ai/v1/key/status` devuelve el contador de prueba y el saldo; `X-InferAll-Trial-Usage` lleva el mismo contador en cada respuesta
* la clave se imprime **una sola vez** en el momento de la creación — `POST /ai/v1/keys` es el único lugar donde existe en texto plano

## 🛠 Inicio rápido

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

Una clave se escribe en `keys.txt` **solo** después de que pase la puerta: `/v1/models` → 200, dos prompts diferentes respondidos con dos textos no vacíos diferentes, y una llamada de herramienta `get_time` real. Todo lo que falla se registra en `accounts.json` y se reintenta en la siguiente ejecución.

### 🖱️ El lanzador

`src/launcher.js` (mismo banner que este README) arranca el envoltorio del conector: crea, verifica, filtra la lista de proxies, muestra la configuración recordada y registra las claves en un 9Router local — los flags de la CLI siguen siendo configurables sin leer el código fuente, y las respuestas viven en `launcher.config.json`. `src/connect-9router.js` registra el proveedor bajo el prefijo `inferall` con `openai/gpt-oss-20b` como modelo predeterminado, una conexión por clave en `keys.txt`.

## 🚀 Un solo comando

El captcha se resuelve por ti — un comando crea N claves verificadas:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` es el valor predeterminado y no hay que pasar nada: el `src/solver.js` integrado abre un Chrome con interfaz, monta el widget de Turnstile y devuelve el token automáticamente. `--dry` imprime el plan resuelto (recuento, grupo de salidas, solucionador, modelo) y sale **sin escribir ningún archivo y sin ninguna llamada de red**. `node src/launcher.js` (o `npm start`) es el mismo camino en forma de menú.

> ⚠️ **Términos y riesgo de cuenta.** Esta es una herramienta de automatización, no un vendedor de cuentas. Los registros masivos y la creación de claves son enteramente tu responsabilidad: pueden infringir los Términos de Servicio del proveedor y provocar el bloqueo de direcciones, salidas o cuentas. Úsala solo en infraestructura que tengas permitido automatizar, y mantén baja la tasa de solicitudes.

## ✅ Verificado y funcionando — cada clave se prueba

Ejecución de laboratorio **2026-10-20**, a través de una salida WARP fijada (`socks5h://127.0.0.1:40000`):

* buzón — un alias plus de Outlook de `temp.tf` (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); el correo de registro es un **enlace, no un código** — asunto `Confirm Your Signup`, desde la propia dirección `noreply` de la aplicación en `inferall.ai` (`out/ia-maildump.out`)
* Turnstile — se hizo clic en el widget hasta que respondió con un token de 752 caracteres, aceptado por `/auth/v1/otp` → `200 {}`; los tres intentos anteriores muestran exactamente por qué importa el token (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* sesión — `GET /auth/v1/verify` → `303` con `access_token`/`refresh_token` en el fragmento (`out/verify-headers.txt`); una cookie de `@supabase/ssr` `sb-<ref>-auth-token=base64-…` hace que `GET /keys` responda **200** (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18.522 bytes)
* clave — `POST https://api.inferall.ai/ai/v1/keys` con el token de acceso de Supabase → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* prueba en vivo — **chat-200 dos veces**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) y la reverificación `2026-10-20T21:14:46Z`, 7m00s después (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — modelo `openai/gpt-oss-20b`, ambos respondiendo `content:"pong"`; `/v1/models` con esa clave → 83 filas

Evidencia: `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) y el informe `providers/inferall/report.md` (ACTUALIZACIÓN 2026-10-20).

> **Controles de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de escribirse en `keys.txt`
> (las claves muertas nunca se entregan). Las combinaciones del router siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar a herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Vuelve a ejecutar el paso de verificación cuando quieras;
> los fallos se informan, nunca se ocultan.

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

Por cuenta, cada solicitud dirigida al proveedor a través de **una salida** — el token de Turnstile está vinculado a la IP que lo resuelve, así que la página, la llamada OTP y el buzón deben compartir esa dirección:

1. **buzón** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` devuelve un alias plus nuevo en una cuenta activa del grupo Outlook/Hotmail. El panel rechaza los dominios desechables (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **página** — un Chrome real con interfaz (`--remote-debugging-port`, perfil desechable, `--lang=en-US`) apuntado a `/auth`, opcionalmente detrás de `--proxy-server`. Cada llamada posterior se hace **en esa página** (`fetch`, `credentials:'include'`), así que hereda la IP de salida, el UA y las cookies.
3. **puerta de la aplicación** — `POST /api/turnstile/verify` no quiere nada más que un token no vacío; la comprobación real es la de Supabase, junto al OTP.
4. **Turnstile** — el widget se lee desde la página, y si permanece vacío se monta uno explícitamente (`render=explicit`) y se hace clic en él con un ritmo fijo; los iframes se atraviesan a través de shadow roots cerrados para encontrar la caja.
5. **OTP** — `POST <ref>.supabase.co/auth/v1/otp` con `gotrue_meta_security.captcha_token` → el **enlace** de confirmación llega por correo.
6. **sesión** — `POST /auth/v1/verify` con el token del enlace (se prueban `signup` / `magiclink` / `email`) → `access_token`.
7. **clave** — `POST https://api.inferall.ai/ai/v1/keys` con ese token → `ifu_…`, escrito en `keys.txt` solo una vez que pasa el paso 8.
8. **puerta** — `/v1/models` → 200, dos prompts diferentes respondidos con texto no vacío diferente, y una llamada de herramienta `get_time` en vivo (`proveKey()` en `src/cli.js`).

## ⚙️ Opciones de la CLI

| flag | significado |
| --- | --- |
| `--count N` | cuentas (= claves) a crear — cada una pasa por la puerta antes de conservarse |
| `--pool <file>` | lista de salidas, un proxy por línea (o `INFERALL_PROXIES` / `INFERALL_POOL`); por defecto `proxies.txt` si existe |
| `--proxy <url>` | una única salida para todo (`http://`, `socks5://`, `socks4://`, o `host:port` sin más) |
| `--exits K` | candidatos de salida probados por cuenta (por defecto 3) |
| `--model <id>` | modelo usado para la puerta en vivo (por defecto `openai/gpt-oss-20b`) |
| `--port N` | puerto de Chrome DevTools (por defecto: uno libre) |
| `--browser PATH` | binario de Chrome (o `CHROME_PATH`; autodetectado en Windows/macOS/Linux) |
| `--headless` | **NO recomendado** — el laboratorio ejecuta esto con interfaz |
| `--keep` | deja Chrome abierto cuando termina la ejecución |
| `--verify-only` | vuelve a probar cada clave en `keys.txt` a través de la puerta, no crea ninguna |
| `--screen` | solo prueba la lista de proxies contra `inferall.ai/auth` (las primeras 64 salidas) |
| `--mail-timeout <s>` | cuánto esperar el correo de registro (por defecto 300) |

Entorno: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (anula la clave anon de Supabase autodescubierta), `CHROME_PATH`. Sin un grupo, la herramienta se ejecuta **directa**.

## 🛰️ Detrás de un proxy

Una lista de salidas es opcional — sin ella todo va directo:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* un intento = **una salida, un navegador, una cuenta** (Chrome fija su proxy al arrancar, así que un reintento obtiene un navegador nuevo en la siguiente salida)
* la salida debe alcanzar `inferall.ai`, `<ref>.supabase.co` **y** el riel de correo — el token de Turnstile está vinculado a la IP que lo resuelve, así que separarlos rompe el registro
* medido el 2026-10-15: el rendimiento del grupo gratuito para este host fue de **0 salidas funcionales de 274** en dos cribados (`providers/inferall/report.md`) — una aplicación de Vercel más salidas gratuitas es una mala combinación, así que presupuesta una salida residencial/cribada en lugar de culpar al código
* la creación exitosa del 2026-10-20 se ejecutó a través de una única salida WARP (`providers/inferall/out/extwave-journal.md`)

## 📄 Archivos

| archivo | qué |
| --- | --- |
| `keys.txt` | claves verificadas, una por línea (escrito solo por la puerta) |
| `accounts.json` | registro cuenta ↔ clave ↔ puerta |
| `proxies.txt` | lista de salidas opcional, una por línea |
| `launcher.config.json` | lo que recuerda el lanzador (generado, ignorado por git) |
| `repo-spec.json` | esta especificación de empaquetado |
| `public-cli.js` | crear / verificar / cribar (solo stdlib de node, sin dependencias) |
| `description.txt`, `report.md` | informe medido del panel |
| `out/session-*.json` | sesión de Supabase capturada durante la creación |
| `out/created-key.json` | la respuesta de la clave + su `tier` / `controls` |
| `out/chat-200-*.json` | las dos pruebas chat-200 (creación + reverificación 7m después) |
| `out/models.json` | la respuesta de los 83 modelos con precios por fila |
| `out/reach-warp/` | cuerpos de sondeo sin procesar: `/auth`, `/keys`, configuración de Supabase, clave anon, sonda de Turnstile |

## 🔌 Conectar con 9Router

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

O deja que la herramienta lo haga: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` registra un nodo `openai-compatible` y una conexión por clave en `keys.txt` (`inferall-001`, `inferall-002`, …). Volver a ejecutarlo es idempotente y 9Router equilibra la carga entre las claves.

## 🔌 Conectar con OmniRoute

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

O deja que la herramienta lo haga: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` registra un nodo `openai-compatible` y una conexión por clave en `keys.txt` (`inferall-001`, `inferall-002`, …). Volver a ejecutarlo es idempotente y OmniRoute equilibra la carga entre las claves.

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 Qué da el proveedor | Una dirección de correo por clave — OTP por correo de Supabase detrás de Cloudflare Turnstile, 25 llamadas NIM gratuitas por cuenta, cada clave verificada por chat |
| 🔑 Qué te da una clave | una clave de API limitada a su propia cuenta: los 83 ids de modelos en el endpoint de abajo, con los límites de tu plan. La cuota vive en la **cuenta**, que es exactamente por lo que esta herramienta crea una cuenta por clave |
| 🌐 Forma de la API | Compatible con OpenAI: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Tus datos | solo se contacta con inferall.ai y el backend de buzón que configures; las claves permanecen en tu máquina |

## 🐞 Problemas

* **`supabase.co` solo habla HTTP/2.** Medido el 2026-10-23: `curl --http1.1` se cuelga, HTTP/2 responde `401` en 0,4 s, y el `https.request` de node nunca se completa en ese host. Por eso `src/cli.js` lleva un segundo cliente — `requestH2()` — y enruta cada llamada a `*.supabase.co` a través de él (`H2_HOSTS`). Cualquier herramienta tuya que hable con GoTrue por HTTP/1.1 parecerá un agujero negro.
* **La puerta de la aplicación es un señuelo.** `POST /api/turnstile/verify` responde `{"ok":true}` a la cadena literal `nonempty` (`out/reach-warp/tsverify-probe.json`); Supabase es quien exige el captcha (`captcha_failed` / `timeout-or-duplicate`), y un token de Turnstile es de un solo uso y está vinculado a la IP.
* **Se rechaza Chrome sin interfaz.** El widget solo se resuelve en un navegador visible; `--headless` existe por completitud, no para producción.
* **La ruta de creación por navegador aún no ha completado una cuenta de principio a fin.** En los carriles del 2026-10-21 la página se renderizó, la puerta de la aplicación respondió `ok:true` y se obtuvo un token de Turnstile (`709`/`730` caracteres), pero el `fetch` OTP dentro de la página devolvía `status 0` sin respuesta cada vez y el lector de `temp.tf` entonces se atascaba (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). La clave que se entrega aquí fue creada por la ruta curl/WARP del laboratorio (`out/ia-mint.js`, `out/ia-keys.js`) y reverificada dos veces; `--verify-only` y el conector 9Router son las rutas probadas en esta compilación, y la creación requiere una salida cribada más un riel de correo que responda.
* **Sin código en el correo.** El mensaje de registro lleva solo un **enlace** `/auth/v1/verify?token=…` — un riel que espere un código de 6 dígitos agotará el tiempo de espera.
* **Una clave, una cuenta.** El contador de prueba de 25 llamadas vive en la cuenta, así que crear dos claves desde una cuenta no lo duplicaría — y el endpoint devuelve la clave en texto plano exactamente una vez, por lo que se escribe en disco inmediatamente.
* Si InferAll cambia la forma de su registro o el widget, la herramienta se detiene en ese paso y dice cuál. **[Abre un issue](../../issues)** con el comando que ejecutaste y la salida exacta; los PR son bienvenidos.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>