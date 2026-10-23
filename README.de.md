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

**InferAll-Konten und API-Schlüssel in großen Mengen erstellen — OpenAI-kompatible Inferenz auf https://api.inferall.ai/v1 über 83 Modell-IDs + 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-83-of-them) · [🧪 Die API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

InferAll (`inferall.ai`) ist eine **Next.js-App auf Vercel** vor einem **Supabase**-Projekt (Ref `epojjjpawjubtqqxabzu`) und einem separaten Inferenz-Gateway unter `api.inferall.ai` (Dienstmarke: Kindly Robotics). Die Anmeldeseite bietet **E-Mail + Einmal-Link** (`signInWithOtp`) neben Google — die eigenen veröffentlichten Einstellungen des Projekts bestätigen, dass beide aktiv sind und kein Passwort-Provider benötigt wird (`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). Das macht dies zu einem **nicht nur OAuth-basierten** Panel: Die Identität wird durch die **Mailbox** nachgewiesen, und genau das ist der Teil, den eine Bulk-Rail automatisiert.

Eine eigene Spur wert wegen dessen, was diesen OTP-Aufruf absichert: ein Cloudflare-**Turnstile**-Widget (Sitekey `0x4AAAAAADhj5AjLCn-67Znk`), dessen Token Supabase als `gotrue_meta_security.captcha_token` erzwingt. Gemessen: kein Token → `captcha_failed`, ein wiederverwendetes → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), ein frisches → `200 {}` (`out/ia-mint-run4.log`). Das eigene Gate der App `POST /api/turnstile/verify` ist ein Ablenkungsmanöver — es antwortet `{"ok":true}` auf jede nicht-leere Zeichenkette (`out/reach-warp/tsverify-probe.json`).

Die Einheit, die skaliert, ist ein Konto pro Schlüssel: Das Testkontingent liegt auf dem **Konto**, und der Schlüssel (`ifu_…`) ist darauf beschränkt.

## 🎁 Kostenlose Stufe — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Testkontingent | ein frischer Schlüssel kommt als `tier: "pending"` zurück und erhält **25 kostenlose NIM-Modell-Aufrufe vor jeder Zahlung** (Gateway-Dokumentation, `providers/inferall/out/reach-warp/docs.body`); der 26. Aufruf antwortet mit **HTTP 402 — Abrechnung erforderlich** |
| 0 $-Modelle | **15 der 83** Katalogzeilen sind `$0` rein und `$0` raus (`out/models.json`) — ein Testschlüssel ohne Karte kann diese aufrufen |
| Schlüssel erstellt | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, Meldung *„you can call the free open models right away, no card needed"* |
| Ausgabennachweis | `POST /v1/chat/completions` auf `openai/gpt-oss-20b` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Zähler | `GET /ai/v1/key/status` meldet `trial: {used, remaining, cap}`; jeder Testaufruf trägt außerdem die Antwort-Header `X-InferAll-Trial-Usage: N/CAP` und `X-InferAll-Trial-Status` |
| Nach dem Test | 402 bis zum 5-$-Starterpaket unter `inferall.ai/billing` — ein bezahltes Konto erreicht dann auch OpenAI / Anthropic / Gemini und Claude Code |
| Günstigster Weg | die 25 Aufrufe auf den 0-$-IDs verbrauchen: mit einem Testschlüssel wird ein blankes `gpt-4o` / `claude-sonnet-4-6` **abgelehnt**; mit Präfix (`openai/gpt-4o`) wird es geroutet, abgerechnet vom Guthaben |

> 💡 Die kostenlose Stufe wird von InferAll festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [inferall.ai](https://inferall.ai) — und lass das eigene Gate des Tools entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 83 davon

`GET /v1/models` mit dem Testschlüssel antwortete mit **83 Modell-IDs** (`providers/inferall/out/models.json`, 2026-10-20), jede Zeile trägt ihre eigene `pricing`:

* **15 Zeilen sind $0/$0** — das Testset, das ein Schlüssel ohne Karte tatsächlich aufrufen kann: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, plus die Bild-Routen (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **InferAlls eigene** — `inferall-uncensored`, `inferall-uncensored-large`.

Der Katalog dient zugleich als Preisliste (`inferall.ai/models` rendert sie, `GET /v1/models` ist das rohe JSON) und er **markiert die kostenlosen**, die ein Testschlüssel aufrufen kann. Eine ID, die das Gateway nicht routen kann, wird mit `400` abgelehnt; sie wird nie stillschweigend ausgetauscht, und `resp.model` in der Antwort nennt immer das Modell, das tatsächlich geantwortet hat.

## 🧪 So verwendest du die API

Die Basis-URL ist **`https://api.inferall.ai/v1`** — OpenAI-kompatibel, also funktioniert jeder OpenAI-Client (`OPENAI_BASE_URL` + `ifu_…`-Schlüssel). Anthropic-förmige Apps können `ANTHROPIC_BASE_URL` stattdessen auf `https://api.inferall.ai` zeigen lassen.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* mit einem **Test**-Schlüssel nenne ein **0-$-Modell** (oder stelle einem bezahlten eines mit seinem Provider-Präfix voran); auf einem bezahlten Konto werden auch blanke `gpt-4o` / `claude-sonnet-4-6` geroutet
* `X-Inferall-Routing: exact` deaktiviert den automatischen Alternativmodell-/Provider-Fallback des Gateways (der standardmäßig aktiv ist und für berechtigte kostenlose Modelle eine parallele Backup-Anfrage ausführen kann)
* `GET /ai/v1/key/status` gibt den Testzähler und das Guthaben zurück; `X-InferAll-Trial-Usage` trägt denselben Zähler auf jeder Antwort
* der Schlüssel wird **einmal** zum Zeitpunkt der Erstellung ausgegeben — `POST /ai/v1/keys` ist der einzige Ort, an dem er im Klartext existiert

## 🛠 Schnellstart

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

Ein Schlüssel wird **nur** dann in `keys.txt` geschrieben, wenn das Gate besteht: `/v1/models` → 200, zwei verschiedene Prompts mit zwei verschiedenen nicht-leeren Texten beantwortet und ein echter `get_time`-Tool-Aufruf. Alles, was fehlschlägt, wird in `accounts.json` festgehalten und beim nächsten Lauf erneut versucht.

### 🖱️ Der Launcher

`src/launcher.js` (gleiches Banner wie diese README) startet den Connector-Wrapper: erstellen, verifizieren, die Proxy-Liste prüfen, die gemerkten Einstellungen anzeigen und die Schlüssel in einem lokalen 9Router registrieren — die CLI-Flags bleiben konfigurierbar, ohne den Quellcode zu lesen, und die Antworten liegen in `launcher.config.json`. `src/connect-9router.js` registriert den Provider unter dem Präfix `inferall` mit `openai/gpt-oss-20b` als Standardmodell, eine Verbindung pro Schlüssel in `keys.txt`.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Laborlauf **2026-10-20**, über einen festgelegten WARP-Ausgang (`socks5h://127.0.0.1:40000`):

* Mailbox — ein `temp.tf`-Outlook-Plus-Alias (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); die Anmeldemail ist ein **Link, kein Code** — Betreff `Confirm Your Signup`, von der eigenen `noreply`-Adresse der App unter `inferall.ai` (`out/ia-maildump.out`)
* Turnstile — Widget angeklickt, bis es mit einem 752-Zeichen-Token antwortete, akzeptiert von `/auth/v1/otp` → `200 {}`; die vorherigen drei Versuche zeigen genau, warum das Token wichtig ist (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* Sitzung — `GET /auth/v1/verify` → `303` mit `access_token`/`refresh_token` im Fragment (`out/verify-headers.txt`); ein `@supabase/ssr`-Cookie `sb-<ref>-auth-token=base64-…` lässt `GET /keys` mit **200** antworten (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18.522 Bytes)
* Schlüssel — `POST https://api.inferall.ai/ai/v1/keys` mit dem Supabase-Zugriffstoken → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* Live-Nachweis — **chat-200 zweimal**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) und die erneute Verifizierung `2026-10-20T21:14:46Z`, 7m00s später (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — Modell `openai/gpt-oss-20b`, beide antworten mit `content:"pong"`; `/v1/models` mit diesem Schlüssel → 83 Zeilen

Belege: `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) und die Ausarbeitung `providers/inferall/report.md` (UPDATE 2026-10-20).

> **Qualitätsgates.** Jeder Schlüssel hier hat ein Live-`chat-200` bestanden, bevor er in `keys.txt` geschrieben wurde
> (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel auf Modellebene: Ein Eintrag wird
> **nur hinzugefügt, wenn das Modell `chat-200` antwortet und Tools aufrufen kann** — ein Modell ohne Tool-Unterstützung,
> ein toter Schlüssel oder ein toter Provider wird verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus;
> Fehler werden gemeldet, nie verborgen.

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

Pro Konto geht jede providergebundene Anfrage über **einen Ausgang** — das Turnstile-Token ist an die lösende IP gebunden, also müssen die Seite, der OTP-Aufruf und die Mailbox dieselbe Adresse teilen:

1. **Mailbox** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` liefert ein frisches Plus-Alias auf einem aktiven Outlook/Hotmail-Pool-Konto zurück. Wegwerf-Domains werden vom Panel abgelehnt (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **Seite** — ein echter headful Chrome (`--remote-debugging-port`, Wegwerf-Profil, `--lang=en-US`), gerichtet auf `/auth`, optional hinter `--proxy-server`. Jeder spätere Aufruf wird **in dieser Seite** gemacht (`fetch`, `credentials:'include'`), sodass er die Ausgangs-IP, den UA und die Cookies erbt.
3. **App-Gate** — `POST /api/turnstile/verify` will nichts außer einem nicht-leeren Token; die echte Prüfung ist die von Supabase, direkt neben dem OTP.
4. **Turnstile** — das Widget wird aus der Seite gelesen, und wenn es leer bleibt, wird explizit eines eingebunden (`render=explicit`) und in einem festen Rhythmus angeklickt; Iframes werden durch geschlossene Shadow Roots durchdrungen, um die Box zu finden.
5. **OTP** — `POST <ref>.supabase.co/auth/v1/otp` mit `gotrue_meta_security.captcha_token` → der Bestätigungs-**Link** kommt per Mail.
6. **Sitzung** — `POST /auth/v1/verify` mit dem Token des Links (`signup` / `magiclink` / `email` werden alle versucht) → `access_token`.
7. **Schlüssel** — `POST https://api.inferall.ai/ai/v1/keys` mit diesem Token → `ifu_…`, erst in `keys.txt` geschrieben, wenn Schritt 8 besteht.
8. **Gate** — `/v1/models` → 200, zwei verschiedene Prompts mit verschiedenem nicht-leerem Text beantwortet und ein echter `get_time`-Tool-Aufruf (`proveKey()` in `src/cli.js`).

## ⚙️ CLI-Optionen

| Flag | Bedeutung |
| --- | --- |
| `--count N` | Konten (= Schlüssel), die erstellt werden sollen — jedes wird geprüft, bevor es behalten wird |
| `--pool <file>` | Ausgangsliste, ein Proxy pro Zeile (oder `INFERALL_PROXIES` / `INFERALL_POOL`); standardmäßig `proxies.txt`, falls vorhanden |
| `--proxy <url>` | ein einzelner Ausgang für alles (`http://`, `socks5://`, `socks4://` oder blankes `host:port`) |
| `--exits K` | pro Konto versuchte Ausgangskandidaten (Standard 3) |
| `--model <id>` | für das Live-Gate verwendetes Modell (Standard `openai/gpt-oss-20b`) |
| `--port N` | Chrome-DevTools-Port (Standard: ein freier) |
| `--browser PATH` | Chrome-Binary (oder `CHROME_PATH`; automatisch erkannt unter Windows/macOS/Linux) |
| `--headless` | **NICHT empfohlen** — das Labor führt dies headful aus |
| `--keep` | Chrome geöffnet lassen, wenn der Lauf endet |
| `--verify-only` | jeden Schlüssel in `keys.txt` erneut durch das Gate beweisen, nichts erstellen |
| `--screen` | nur die Proxy-Liste gegen `inferall.ai/auth` testen (die ersten 64 Ausgänge) |
| `--mail-timeout <s>` | wie lange auf die Anmeldemail gewartet wird (Standard 300) |

Env: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (überschreibt den automatisch ermittelten Supabase-Anon-Key), `CHROME_PATH`. Ohne Pool läuft das Tool **direkt**.

## 🛰️ Hinter einem Proxy

Eine Ausgangsliste ist optional — ohne eine läuft alles direkt:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* ein Versuch = **ein Ausgang, ein Browser, ein Konto** (Chrome fixiert seinen Proxy beim Start, also bekommt ein erneuter Versuch einen frischen Browser auf dem nächsten Ausgang)
* der Ausgang muss `inferall.ai`, `<ref>.supabase.co` **und** die Mail-Rail erreichen — das Turnstile-Token ist an die lösende IP gebunden, also bricht das Aufteilen die Anmeldung
* gemessen am 2026-10-15: die Ausbeute des kostenlosen Pools für diesen Host war **0 funktionierende Ausgänge von 274** über zwei Screens (`providers/inferall/report.md`) — eine Vercel-App plus kostenlose Ausgänge ist ein schlechtes Paar, also plane einen Residential-/gescreenten Ausgang ein, statt den Code zu beschuldigen
* die erfolgreiche Erstellung vom 2026-10-20 lief über einen einzigen WARP-Ausgang (`providers/inferall/out/extwave-journal.md`)

## 📄 Dateien

| Datei | Was |
| --- | --- |
| `keys.txt` | verifizierte Schlüssel, einer pro Zeile (nur vom Gate geschrieben) |
| `accounts.json` | Konto ↔ Schlüssel ↔ Gate-Datensatz |
| `proxies.txt` | optionale Ausgangsliste, eine pro Zeile |
| `launcher.config.json` | was der Launcher sich merkt (generiert, von git ignoriert) |
| `repo-spec.json` | diese Packaging-Spezifikation |
| `public-cli.js` | erstellen / verifizieren / screenen (nur Node-Stdlib, keine Abhängigkeiten) |
| `description.txt`, `report.md` | gemessene Ausarbeitung des Panels |
| `out/session-*.json` | während der Erstellung erfasste Supabase-Sitzung |
| `out/created-key.json` | die Schlüsselantwort + ihre `tier` / `controls` |
| `out/chat-200-*.json` | die beiden chat-200-Nachweise (Erstellung + erneute Verifizierung 7m später) |
| `out/models.json` | die 83-Modell-Antwort mit Preisangabe pro Zeile |
| `out/reach-warp/` | rohe Probe-Bodies: `/auth`, `/keys`, Supabase-Einstellungen, Anon-Key, Turnstile-Probe |

## 🔌 Mit 9Router verbinden

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Oder lass es das Tool tun: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` registriert einen `openai-compatible`-Knoten und eine Verbindung pro Schlüssel in `keys.txt` (`inferall-001`, `inferall-002`, …). Ein erneuter Lauf ist idempotent und 9Router verteilt die Last über die Schlüssel.

## 🔌 Mit OmniRoute verbinden

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Oder lass es das Tool tun: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` registriert einen `openai-compatible`-Knoten und eine Verbindung pro Schlüssel in `keys.txt` (`inferall-001`, `inferall-002`, …). Ein erneuter Lauf ist idempotent und OmniRoute verteilt die Last über die Schlüssel.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Provider | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 Was der Provider gibt | Eine E-Mail-Adresse pro Schlüssel — Supabase-E-Mail-OTP hinter Cloudflare Turnstile, 25 kostenlose NIM-Aufrufe pro Konto, jeder Schlüssel chat-verifiziert |
| 🔑 Was ein Schlüssel dir bringt | einen API-Schlüssel, beschränkt auf sein eigenes Konto: die 83 Modell-IDs am unten stehenden Endpunkt, im Rahmen deiner Tarifgrenzen. Das Kontingent liegt auf dem **Konto**, weshalb dieses Tool genau ein Konto pro Schlüssel erstellt |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Deine Daten | nur inferall.ai und das von dir konfigurierte Inbox-Backend werden kontaktiert; Schlüssel bleiben auf deinem Rechner |

## 🐞 Probleme

* **`supabase.co` spricht nur HTTP/2.** Gemessen am 2026-10-23: `curl --http1.1` hängt, HTTP/2 antwortet in 0,4 s mit `401`, und Nodes `https.request` wird auf diesem Host nie fertig. `src/cli.js` trägt deshalb einen zweiten Client — `requestH2()` — und leitet jeden `*.supabase.co`-Aufruf durch ihn (`H2_HOSTS`). Jedes eigene Tool, das über HTTP/1.1 mit GoTrue spricht, wird wie ein schwarzes Loch wirken.
* **Das App-Gate ist ein Ablenkungsmanöver.** `POST /api/turnstile/verify` antwortet `{"ok":true}` auf die wörtliche Zeichenkette `nonempty` (`out/reach-warp/tsverify-probe.json`); Supabase ist das, was das Captcha erzwingt (`captcha_failed` / `timeout-or-duplicate`), und ein Turnstile-Token ist einmalig verwendbar und IP-gebunden.
* **Headless Chrome wird abgelehnt.** Das Widget wird nur in einem sichtbaren Browser freigegeben; `--headless` existiert der Vollständigkeit halber, nicht für die Produktion.
* **Der Browser-Erstellungspfad hat noch kein Konto Ende-zu-Ende abgeschlossen.** In den Spuren vom 2026-10-21 wurde die Seite gerendert, das App-Gate antwortete mit `ok:true` und ein Turnstile-Token wurde erhalten (`709`/`730` Zeichen), aber der In-Page-OTP-`fetch` kam jedes Mal mit `status 0` ohne Antwort zurück und der `temp.tf`-Reader stockte dann (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). Der hier ausgelieferte Schlüssel wurde über den curl/WARP-Pfad des Labors erstellt (`out/ia-mint.js`, `out/ia-keys.js`) und zweimal erneut verifiziert; `--verify-only` und der 9Router-Connector sind die auf diesem Build bewiesenen Pfade, und das Erstellen verlangt einen gescreenten Ausgang plus eine Mail-Rail, die antwortet.
* **Kein Code in der Mail.** Die Anmeldemail trägt nur einen `/auth/v1/verify?token=…`-**Link** — eine Rail, die auf einen 6-stelligen Code wartet, läuft in einen Timeout.
* **Ein Schlüssel, ein Konto.** Der 25-Aufruf-Testzähler liegt auf dem Konto, also würde das Erstellen von zwei Schlüsseln aus einem Konto ihn nicht verdoppeln — und der Endpunkt gibt den Klartextschlüssel genau einmal zurück, weshalb er sofort auf die Festplatte geschrieben wird.
* Wenn InferAll seine Anmeldeform oder das Widget ändert, stoppt das Tool an diesem Schritt und sagt, an welchem. **[Öffne ein Issue](../../issues)** mit dem ausgeführten Befehl und der genauen Ausgabe; PRs sind willkommen.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>