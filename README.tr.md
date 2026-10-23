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

**InferAll hesaplarını ve API anahtarlarını toplu oluşturun — https://api.inferall.ai/v1 üzerinde 83 model kimliği ve 9Router bağlayıcısı ile OpenAI uyumlu çıkarım.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-83-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

InferAll (`inferall.ai`), bir **Supabase** projesinin (ref `epojjjpawjubtqqxabzu`) önünde çalışan bir **Vercel üzerindeki Next.js uygulaması** ve `api.inferall.ai` adresinde ayrı bir çıkarım ağ geçididir (servis markası: Kindly Robotics). Giriş sayfası, Google'ın yanında **e-posta + tek kullanımlık bağlantı** (`signInWithOtp`) sunar — projenin kendi yayımlanmış ayarları her ikisinin de açık olduğunu ve hiçbir parola sağlayıcısına gerek olmadığını doğrular (`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). Bu da bunu **yalnızca OAuth** paneli olmaktan çıkarır: kimlik **posta kutusu** tarafından kanıtlanır, ki toplu bir hat tam da bu kısmı otomatikleştirir.

Bir şeridi hak ediyor çünkü o OTP çağrısını koruyan şey dikkate değer: Supabase'in `gotrue_meta_security.captcha_token` olarak zorunlu kıldığı bir Cloudflare **Turnstile** widget'ı (sitekey `0x4AAAAAADhj5AjLCn-67Znk`). Ölçüldü: token yok → `captcha_failed`, yeniden kullanılan → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), yeni → `200 {}` (`out/ia-mint-run4.log`). Uygulamanın kendi kapısı `POST /api/turnstile/verify` bir yemdir — boş olmayan herhangi bir dizeye `{"ok":true}` yanıtı verir (`out/reach-warp/tsverify-probe.json`).

Ölçeklenen birim, anahtar başına bir hesaptır: deneme hakkı **hesapta** bulunur ve anahtar (`ifu_…`) ona kapsamlandırılmıştır.

## 🎁 Ücretsiz katman — ne kadar alırsınız

| Ne | Değer |
| --- | --- |
| Deneme hakkı | yeni bir anahtar `tier: "pending"` olarak döner ve **herhangi bir ödeme öncesinde 25 ücretsiz NIM-model çağrısı** alır (ağ geçidi belgeleri, `providers/inferall/out/reach-warp/docs.body`); 26. çağrı **HTTP 402 — faturalandırma gerekli** yanıtını verir |
| $0 modeller | katalogdaki 83 satırın **15'i** girişte `$0` ve çıkışta `$0`'dır (`out/models.json`) — kartsız bir deneme anahtarı bunları çağırabilir |
| Oluşturulan anahtar | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, mesaj *"ücretsiz açık modelleri hemen çağırabilirsiniz, kart gerekmez"* |
| Harcama kanıtı | `openai/gpt-oss-20b` üzerinde `POST /v1/chat/completions` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Sayaç | `GET /ai/v1/key/status` `trial: {used, remaining, cap}` bildirir; her deneme çağrısı ayrıca `X-InferAll-Trial-Usage: N/CAP` ve `X-InferAll-Trial-Status` yanıt başlıklarını taşır |
| Deneme sonrası | `inferall.ai/billing` adresindeki 5$ başlangıç paketine kadar 402 — ücretli bir hesap ayrıca OpenAI / Anthropic / Gemini ve Claude Code'a da erişir |
| En ucuz yol | 25 çağrıyı $0 kimliklerinde harcayın: bir deneme anahtarında çıplak `gpt-4o` / `claude-sonnet-4-6` **reddedilir**; önüne ekleyin (`openai/gpt-4o`) ve yönlendirilir, bakiyeden faturalandırılır |

> 💡 Ücretsiz katman InferAll tarafından belirlenir ve değişebilir. Canlı sayıları [inferall.ai](https://inferall.ai) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — 83'ünün tamamı

Deneme anahtarıyla `GET /v1/models` **83 model kimliği** yanıtladı (`providers/inferall/out/models.json`, 2026-10-20), her satır kendi `pricing` bilgisini taşıyor:

* **15 satır $0/$0** — kartsız bir anahtarın gerçekten çağırabileceği deneme kümesi: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, ayrıca görsel rotaları (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **InferAll'ın kendi** — `inferall-uncensored`, `inferall-uncensored-large`.

Katalog aynı zamanda fiyat listesi olarak da işlev görür (`inferall.ai/models` bunu işler, `GET /v1/models` ham JSON'dur) ve bir deneme anahtarının çağırabileceği **ücretsiz olanları işaretler**. Ağ geçidinin yönlendiremediği bir kimlik `400` ile reddedilir; asla sessizce değiştirilmez ve yanıttaki `resp.model` her zaman gerçekte yanıt veren modeli adlandırır.

## 🧪 API nasıl kullanılır

Temel URL **`https://api.inferall.ai/v1`**'dir — OpenAI uyumlu, yani herhangi bir OpenAI istemcisi çalışır (`OPENAI_BASE_URL` + `ifu_…` anahtarı). Anthropic biçimli uygulamalar bunun yerine `ANTHROPIC_BASE_URL`'i `https://api.inferall.ai` adresine yönlendirebilir.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* bir **deneme** anahtarında, bir **$0 model** adlandırın (veya ücretli bir modelin önüne sağlayıcısını ekleyin); ücretli bir hesapta çıplak `gpt-4o` / `claude-sonnet-4-6` de yönlendirilir
* `X-Inferall-Routing: exact`, ağ geçidinin otomatik alternatif model/sağlayıcı yedeklemesini devre dışı bırakır (varsayılan olarak açıktır ve uygun ücretsiz modeller için paralel bir yedek istek çalıştırabilir)
* `GET /ai/v1/key/status` deneme sayacını ve bakiyeyi döndürür; `X-InferAll-Trial-Usage` her yanıtta aynı sayacı taşır
* anahtar oluşturma anında **bir kez** yazdırılır — `POST /ai/v1/keys` onun düz metin olarak bulunduğu tek yerdir

## 🛠 Hızlı başlangıç

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

Bir anahtar `keys.txt` dosyasına **yalnızca** kapı geçildikten sonra yazılır: `/v1/models` → 200, iki farklı istem iki farklı boş olmayan metinle yanıtlanır ve gerçek bir `get_time` araç çağrısı. Başarısız olan her şey `accounts.json` dosyasına kaydedilir ve sonraki çalıştırmada yeniden denenir.

### 🖱️ Başlatıcı

`src/launcher.js` (bu README ile aynı banner) bağlayıcı sarmalayıcıyı başlatır: oluştur, doğrula, proxy listesini tara, hatırlanan ayarları göster ve anahtarları yerel bir 9Router'a kaydet — CLI bayrakları kaynağı okumadan yapılandırılabilir kalır ve yanıtlar `launcher.config.json` dosyasında yaşar. `src/connect-9router.js`, sağlayıcıyı `inferall` öneki altında varsayılan model olarak `openai/gpt-oss-20b` ile kaydeder, `keys.txt` içindeki her anahtar için bir bağlantı oluşturur.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

Laboratuvar çalıştırması **2026-10-20**, sabitlenmiş tek bir WARP çıkışı üzerinden (`socks5h://127.0.0.1:40000`):

* posta kutusu — bir `temp.tf` Outlook artı takma adı (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); kayıt postası bir **bağlantıdır, kod değil** — konu `Confirm Your Signup`, uygulamanın kendi `noreply` adresinden `inferall.ai` üzerinde (`out/ia-maildump.out`)
* Turnstile — widget 752 karakterlik bir token yanıtlayana kadar tıklandı, `/auth/v1/otp` tarafından kabul edildi → `200 {}`; önceki üç deneme token'ın neden önemli olduğunu tam olarak gösteriyor (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* oturum — `GET /auth/v1/verify` → parçada `access_token`/`refresh_token` ile `303` (`out/verify-headers.txt`); bir `@supabase/ssr` çerezi `sb-<ref>-auth-token=base64-…` `GET /keys`'i **200** yanıtlar hale getirir (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18.522 bayt)
* anahtar — Supabase erişim token'ı ile `POST https://api.inferall.ai/ai/v1/keys` → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* canlı kanıt — **iki kez chat-200**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) ve 7dk00sn sonra yeniden doğrulama `2026-10-20T21:14:46Z` (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — model `openai/gpt-oss-20b`, her ikisi de `content:"pong"` yanıtlıyor; o anahtarla `/v1/models` → 83 satır

Kanıt: `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) ve yazı `providers/inferall/report.md` (GÜNCELLEME 2026-10-20).

> **Kalite kapıları.** Buradaki her anahtar `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Router kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtlıyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> başarısızlıklar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

Hesap başına, sağlayıcıya bağlı her istek **tek bir çıkış** üzerinden — Turnstile token'ı çözümleyen IP'ye bağlıdır, bu yüzden sayfa, OTP çağrısı ve posta kutusu aynı adresi paylaşmalıdır:

1. **posta kutusu** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` canlı bir Outlook/Hotmail havuz hesabında bir taze artı takma adı döndürür. Tek kullanımlık alan adları panel tarafından reddedilir (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **sayfa** — `/auth` adresine yönlendirilmiş gerçek bir başlı (headful) Chrome (`--remote-debugging-port`, tek kullanımlık profil, `--lang=en-US`), isteğe bağlı olarak `--proxy-server` arkasında. Sonraki her çağrı **o sayfada** yapılır (`fetch`, `credentials:'include'`), böylece çıkış IP'sini, UA'yı ve çerezleri devralır.
3. **uygulama kapısı** — `POST /api/turnstile/verify` boş olmayan bir token'dan başka bir şey istemez; gerçek kontrol Supabase'inkidir, OTP'nin yanında.
4. **Turnstile** — widget sayfadan okunur ve boş kalırsa açıkça bağlanır (`render=explicit`) ve sabit bir ritimde tıklanır; kutuyu bulmak için iframe'ler kapalı gölge köklerinden delinir.
5. **OTP** — `gotrue_meta_security.captcha_token` ile `POST <ref>.supabase.co/auth/v1/otp` → onay **bağlantısı** posta yoluyla gelir.
6. **oturum** — bağlantının token'ı ile `POST /auth/v1/verify` (`signup` / `magiclink` / `email` hepsi denenir) → `access_token`.
7. **anahtar** — o token ile `POST https://api.inferall.ai/ai/v1/keys` → `ifu_…`, yalnızca 8. adım geçtikten sonra `keys.txt` dosyasına yazılır.
8. **kapı** — `/v1/models` → 200, iki farklı istem farklı boş olmayan metinle yanıtlanır ve canlı bir `get_time` araç çağrısı (`src/cli.js` içindeki `proveKey()`).

## ⚙️ CLI seçenekleri

| bayrak | anlamı |
| --- | --- |
| `--count N` | oluşturulacak hesap (= anahtar) sayısı — her biri saklanmadan önce kapıdan geçirilir |
| `--pool <file>` | çıkış listesi, satır başına bir proxy (veya `INFERALL_PROXIES` / `INFERALL_POOL`); varsa `proxies.txt` varsayılan |
| `--proxy <url>` | her şey için tek çıkış (`http://`, `socks5://`, `socks4://` veya çıplak `host:port`) |
| `--exits K` | hesap başına denen çıkış adayları (varsayılan 3) |
| `--model <id>` | canlı kapı için kullanılan model (varsayılan `openai/gpt-oss-20b`) |
| `--port N` | Chrome DevTools portu (varsayılan: boş bir port) |
| `--browser PATH` | Chrome ikili dosyası (veya `CHROME_PATH`; Windows/macOS/Linux'ta otomatik algılanır) |
| `--headless` | **ÖNERİLMEZ** — laboratuvar bunu başlı (headful) çalıştırır |
| `--keep` | çalıştırma bittiğinde Chrome'u açık bırak |
| `--verify-only` | `keys.txt` içindeki her anahtarı kapıdan yeniden geçir, hiçbir şey oluşturma |
| `--screen` | yalnızca proxy listesini `inferall.ai/auth` adresine karşı test et (ilk 64 çıkış) |
| `--mail-timeout <s>` | kayıt postasını ne kadar bekleyeceği (varsayılan 300) |

Ortam: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (otomatik keşfedilen Supabase anon anahtarını geçersiz kıl), `CHROME_PATH`. Havuz olmadan araç **doğrudan** çalışır.

## 🛰️ Proxy arkasında

Çıkış listesi isteğe bağlıdır — olmadan her şey doğrudan gider:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* bir deneme = **bir çıkış, bir tarayıcı, bir hesap** (Chrome proxy'sini başlatmada sabitler, bu yüzden yeniden deneme bir sonraki çıkışta taze bir tarayıcı alır)
* çıkış `inferall.ai`, `<ref>.supabase.co` **ve** posta hattına ulaşmalıdır — Turnstile token'ı çözümleyen IP'ye bağlıdır, bu yüzden bunları ayırmak kaydı bozar
* 2026-10-15'te ölçüldü: ücretsiz havuzun bu ana bilgisayar için verimi iki taramada **274 çıkıştan 0 çalışan çıkış** oldu (`providers/inferall/report.md`) — bir Vercel uygulaması artı ücretsiz çıkışlar kötü bir ikilidir, bu yüzden kodu suçlamak yerine konut/taranmış bir çıkış bütçeleyin
* başarılı 2026-10-20 oluşturma tek bir WARP çıkışı üzerinden çalıştı (`providers/inferall/out/extwave-journal.md`)

## 📄 Dosyalar

| dosya | ne |
| --- | --- |
| `keys.txt` | doğrulanmış anahtarlar, satır başına bir tane (yalnızca kapı tarafından yazılır) |
| `accounts.json` | hesap ↔ anahtar ↔ kapı kaydı |
| `proxies.txt` | isteğe bağlı çıkış listesi, satır başına bir tane |
| `launcher.config.json` | başlatıcının hatırladıkları (oluşturulur, git tarafından yok sayılır) |
| `repo-spec.json` | bu paketleme spesifikasyonu |
| `public-cli.js` | oluştur / doğrula / tara (yalnızca node stdlib, bağımlılık yok) |
| `description.txt`, `report.md` | panelin ölçülmüş yazısı |
| `out/session-*.json` | oluşturma sırasında yakalanan Supabase oturumu |
| `out/created-key.json` | anahtar yanıtı + `tier` / `controls` bilgisi |
| `out/chat-200-*.json` | iki chat-200 kanıtı (oluşturma + 7dk sonra yeniden doğrulama) |
| `out/models.json` | satır başına fiyatlandırma ile 83 model yanıtı |
| `out/reach-warp/` | ham yoklama gövdeleri: `/auth`, `/keys`, Supabase ayarları, anon anahtar, Turnstile yoklaması |

## 🔌 9Router'a bağlan

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Ya da aracın yapmasına izin verin: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` bir `openai-compatible` düğümü ve `keys.txt` içindeki her anahtar için bir bağlantı kaydeder (`inferall-001`, `inferall-002`, …). Yeniden çalıştırmak idempotenttir ve 9Router anahtarlar arasında yük dengeler.

## 🔌 OmniRoute'a bağlan

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Ya da aracın yapmasına izin verin: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` bir `openai-compatible` düğümü ve `keys.txt` içindeki her anahtar için bir bağlantı kaydeder (`inferall-001`, `inferall-002`, …). Yeniden çalıştırmak idempotenttir ve OmniRoute anahtarlar arasında yük dengeler.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 Sağlayıcının verdikleri | Anahtar başına bir e-posta adresi — Cloudflare Turnstile arkasında Supabase e-posta OTP'si, hesap başına 25 ücretsiz NIM çağrısı, her anahtar sohbet doğrulamalı |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabına kapsamlandırılmış bir API anahtarı: aşağıdaki uç noktada 83 model kimliği, planınızın limitlerinde. Kota **hesapta** bulunur, bu aracın anahtar başına bir hesap oluşturmasının nedeni tam da budur |
| 🌐 API biçimi | OpenAI uyumlu: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca inferall.ai ve yapılandırdığınız posta kutusu arka ucuna bağlanılır; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

* **`supabase.co` yalnızca HTTP/2 konuşur.** 2026-10-23'te ölçüldü: `curl --http1.1` takılır, HTTP/2 0,4 sn'de `401` yanıtlar ve node'un `https.request`'i o ana bilgisayarda asla tamamlanmaz. Bu nedenle `src/cli.js` ikinci bir istemci taşır — `requestH2()` — ve her `*.supabase.co` çağrısını onun üzerinden yönlendirir (`H2_HOSTS`). GoTrue ile HTTP/1.1 üzerinden konuşan kendi aracınız bir kara delik gibi görünecektir.
* **Uygulama kapısı bir yemdir.** `POST /api/turnstile/verify`, `nonempty` dizesine bile `{"ok":true}` yanıtı verir (`out/reach-warp/tsverify-probe.json`); captcha'yı zorunlu kılan Supabase'tir (`captcha_failed` / `timeout-or-duplicate`) ve bir Turnstile token'ı tek kullanımlıktır ve IP'ye bağlıdır.
* **Başsız (headless) Chrome reddedilir.** Widget yalnızca görünür bir tarayıcıda temizlenir; `--headless` eksiksizlik için vardır, üretim için değil.
* **Tarayıcı oluşturma yolu henüz bir hesabı uçtan uca tamamlamadı.** 2026-10-21 şeritlerinde sayfa işlendi, uygulama kapısı `ok:true` yanıtladı ve bir Turnstile token'ı elde edildi (`709`/`730` karakter), ancak sayfa içi OTP `fetch` her seferinde yanıtsız `status 0` döndü ve ardından `temp.tf` okuyucusu takıldı (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). Burada gönderilen anahtar laboratuvarın curl/WARP yoluyla oluşturuldu (`out/ia-mint.js`, `out/ia-keys.js`) ve iki kez yeniden doğrulandı; `--verify-only` ve 9Router bağlayıcısı bu derlemede kanıtlanmış yollardır ve oluşturma taranmış bir çıkış ile yanıt veren bir posta hattı gerektirir.
* **Postada kod yok.** Kayıt mesajı yalnızca bir `/auth/v1/verify?token=…` **bağlantısı** taşır — 6 haneli bir kod bekleyen bir hat zaman aşımına uğrar.
* **Bir anahtar, bir hesap.** 25 çağrılık deneme sayacı hesapta bulunur, bu yüzden bir hesaptan iki anahtar oluşturmak onu ikiye katlamaz — ve uç nokta düz metin anahtarı tam olarak bir kez geri verir, bu yüzden hemen diske yazılır.
* InferAll kayıt biçimini veya widget'ı değiştirirse, araç o adımda durur ve hangisi olduğunu söyler. Çalıştırdığınız komut ve tam çıktı ile **[bir sorun açın](../../issues)**; PR'lar memnuniyetle karşılanır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey katkıda bulunanlar

</div>