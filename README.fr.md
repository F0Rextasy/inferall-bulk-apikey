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

**Créez en masse des comptes InferAll et des clés API — inférence compatible OpenAI sur https://api.inferall.ai/v1 à travers 83 identifiants de modèles + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Niveau gratuit](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-83-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cela existe

InferAll (`inferall.ai`) est une **application Next.js sur Vercel** devant un projet **Supabase** (réf `epojjjpawjubtqqxabzu`) et une passerelle d'inférence distincte à `api.inferall.ai` (marque de service : Kindly Robotics). La page de connexion propose **e-mail + lien à usage unique** (`signInWithOtp`) à côté de Google — les paramètres publiés du projet confirment que les deux sont activés et qu'aucun fournisseur de mot de passe n'est nécessaire (`email: true`, `google: true` : `providers/inferall/out/reach-warp/supa-settings.json`). Cela en fait **pas** un panneau réservé à OAuth : l'identité est prouvée par la **boîte mail**, ce qui est exactement la partie qu'un rail en masse automatise.

Cela vaut la peine à cause de ce qui garde cet appel OTP : un widget Cloudflare **Turnstile** (sitekey `0x4AAAAAADhj5AjLCn-67Znk`) dont le jeton est imposé par Supabase comme `gotrue_meta_security.captcha_token`. Mesuré : pas de jeton → `captcha_failed`, un jeton réutilisé → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), un jeton frais → `200 {}` (`out/ia-mint-run4.log`). La propre barrière de l'application `POST /api/turnstile/verify` est un leurre — elle répond `{"ok":true}` à n'importe quelle chaîne non vide (`out/reach-warp/tsverify-probe.json`).

L'unité qui passe à l'échelle est un compte par clé : l'allocation d'essai vit sur le **compte**, et la clé (`ifu_…`) lui est rattachée.

## 🎁 Niveau gratuit — combien vous obtenez

| Quoi | Valeur |
| --- | --- |
| Allocation d'essai | une clé fraîche revient avec `tier: "pending"` et obtient **25 appels gratuits aux modèles NIM avant tout paiement** (docs de la passerelle, `providers/inferall/out/reach-warp/docs.body`) ; le 26e appel répond **HTTP 402 — facturation requise** |
| Modèles à 0 $ | **15 des 83** lignes du catalogue sont à `$0` en entrée et `$0` en sortie (`out/models.json`) — une clé d'essai sans carte peut appeler celles-ci |
| Clé créée | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, message *« vous pouvez appeler les modèles ouverts gratuits tout de suite, sans carte »* |
| Preuve de dépense | `POST /v1/chat/completions` sur `openai/gpt-oss-20b` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Compteur | `GET /ai/v1/key/status` rapporte `trial: {used, remaining, cap}` ; chaque appel d'essai porte aussi les en-têtes de réponse `X-InferAll-Trial-Usage: N/CAP` et `X-InferAll-Trial-Status` |
| Après l'essai | 402 jusqu'au pack de démarrage à 5 $ sur `inferall.ai/billing` — un compte payant atteint alors aussi OpenAI / Anthropic / Gemini et Claude Code |
| Chemin le moins cher | épuisez les 25 appels sur les identifiants à 0 $ : sur une clé d'essai, un `gpt-4o` / `claude-sonnet-4-6` nu est **refusé** ; préfixez-le (`openai/gpt-4o`) et il est routé, facturé depuis le solde |

> 💡 Le niveau gratuit est défini par InferAll et peut changer. Vérifiez les chiffres en direct sur [inferall.ai](https://inferall.ai) — et laissez la propre barrière de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 83

`GET /v1/models` avec la clé d'essai a répondu **83 identifiants de modèles** (`providers/inferall/out/models.json`, 2026-10-20), chaque ligne portant son propre `pricing` :

* **15 lignes sont à 0 $/0 $** — l'ensemble d'essai qu'une clé sans carte peut réellement appeler : `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, plus les routes d'images (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **Les propres modèles d'InferAll** — `inferall-uncensored`, `inferall-uncensored-large`.

Le catalogue fait aussi office de liste de prix (`inferall.ai/models` l'affiche, `GET /v1/models` est le JSON brut) et il **marque les modèles gratuits** qu'une clé d'essai peut appeler. Un identifiant que la passerelle ne peut pas router est refusé avec `400` ; il n'est jamais remplacé silencieusement, et `resp.model` dans la réponse nomme toujours le modèle qui a réellement répondu.

## 🧪 Comment utiliser l'API

L'URL de base est **`https://api.inferall.ai/v1`** — compatible OpenAI, donc n'importe quel client OpenAI fonctionne (`OPENAI_BASE_URL` + clé `ifu_…`). Les applications au format Anthropic peuvent pointer `ANTHROPIC_BASE_URL` vers `https://api.inferall.ai` à la place.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* sur une clé d'**essai**, nommez un **modèle à 0 $** (ou préfixez un modèle payant avec son fournisseur) ; sur un compte payant, un `gpt-4o` / `claude-sonnet-4-6` nu est aussi routé
* `X-Inferall-Routing: exact` désactive le repli automatique de la passerelle vers un modèle/fournisseur alternatif (activé par défaut, et qui peut lancer une requête de secours parallèle pour les modèles gratuits éligibles)
* `GET /ai/v1/key/status` renvoie le compteur d'essai et le solde ; `X-InferAll-Trial-Usage` porte le même compteur sur chaque réponse
* la clé est affichée **une seule fois** au moment de la création — `POST /ai/v1/keys` est le seul endroit où elle existe en clair

## 🛠 Démarrage rapide

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

Une clé n'est écrite dans `keys.txt` **qu'**après le passage de la barrière : `/v1/models` → 200, deux invites différentes répondues par deux textes non vides différents, et un véritable appel d'outil `get_time`. Tout ce qui échoue est consigné dans `accounts.json` et réessayé à la prochaine exécution.

### 🖱️ Le lanceur

`src/launcher.js` (même bannière que ce README) démarre l'enveloppe du connecteur : création, vérification, filtrage de la liste de proxys, affichage des paramètres mémorisés, et enregistrement des clés dans un 9Router local — les options de la CLI restent configurables sans lire le code source, et les réponses vivent dans `launcher.config.json`. `src/connect-9router.js` enregistre le fournisseur sous le préfixe `inferall` avec `openai/gpt-oss-20b` comme modèle par défaut, une connexion par clé dans `keys.txt`.

## 🚀 Une seule commande

Le captcha est résolu pour vous — une commande crée N clés vérifiées :

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` est la valeur par défaut et rien ne doit être passé : le `src/solver.js` intégré ouvre un Chrome avec interface, monte le widget Turnstile et renvoie le jeton automatiquement. `--dry` affiche le plan résolu (nombre, pool de sorties, solveur, modèle) et se termine avec **aucun fichier écrit et aucun appel réseau**. `node src/launcher.js` (ou `npm start`) est le même chemin sous forme de menu.

> ⚠️ **Conditions et risque de compte.** C'est un outil d'automatisation, pas un vendeur de comptes. Les inscriptions en masse et la création de clés sont entièrement de votre responsabilité : elles peuvent enfreindre les Conditions d'utilisation du fournisseur et entraîner le blocage d'adresses, de sorties ou de comptes. Utilisez-le uniquement sur une infrastructure que vous êtes autorisé à automatiser, et gardez un faible débit de requêtes.

## ✅ Vérifié fonctionnel — chaque clé est testée

Exécution en laboratoire le **2026-10-20**, via une sortie WARP épinglée (`socks5h://127.0.0.1:40000`) :

* boîte mail — un alias plus Outlook `temp.tf` (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`) ; le mail d'inscription est un **lien, pas un code** — objet `Confirm Your Signup`, depuis la propre adresse `noreply` de l'application à `inferall.ai` (`out/ia-maildump.out`)
* Turnstile — widget cliqué jusqu'à ce qu'il réponde avec un jeton de 752 caractères, accepté par `/auth/v1/otp` → `200 {}` ; les trois tentatives précédentes montrent exactement pourquoi le jeton compte (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* session — `GET /auth/v1/verify` → `303` avec `access_token`/`refresh_token` dans le fragment (`out/verify-headers.txt`) ; un cookie `@supabase/ssr` `sb-<ref>-auth-token=base64-…` fait répondre `GET /keys` **200** (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18 522 octets)
* clé — `POST https://api.inferall.ai/ai/v1/keys` avec le jeton d'accès Supabase → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* preuve en direct — **chat-200 deux fois** : `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) et la re-vérification `2026-10-20T21:14:46Z`, 7 min 00 s plus tard (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — modèle `openai/gpt-oss-20b`, les deux répondant `content:"pong"` ; `/v1/models` avec cette clé → 83 lignes

Preuves : `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) et le compte rendu `providers/inferall/report.md` (MISE À JOUR 2026-10-20).

> **Barrières de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combinaisons du routeur suivent la même règle au niveau du modèle : une entrée est
> ajoutée **uniquement si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans prise en charge des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais cachés.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

Par compte, chaque requête vers le fournisseur passe par **une seule sortie** — le jeton Turnstile est lié à l'IP de résolution, donc la page, l'appel OTP et la boîte mail doivent partager cette adresse :

1. **boîte mail** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` renvoie un alias plus frais sur un compte actif du pool Outlook/Hotmail. Les domaines jetables sont refusés par le panneau (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **page** — un vrai Chrome avec interface (`--remote-debugging-port`, profil jetable, `--lang=en-US`) pointé vers `/auth`, éventuellement derrière `--proxy-server`. Chaque appel ultérieur est effectué **dans cette page** (`fetch`, `credentials:'include'`), donc il hérite de l'IP de sortie, de l'UA et des cookies.
3. **barrière de l'application** — `POST /api/turnstile/verify` ne veut rien d'autre qu'un jeton non vide ; la vraie vérification est celle de Supabase, juste à côté de l'OTP.
4. **Turnstile** — le widget est lu depuis la page, et s'il reste vide, un est monté explicitement (`render=explicit`) et cliqué selon un rythme fixe ; les iframes sont percées à travers des racines d'ombre fermées pour trouver la case.
5. **OTP** — `POST <ref>.supabase.co/auth/v1/otp` avec `gotrue_meta_security.captcha_token` → le **lien** de confirmation arrive par mail.
6. **session** — `POST /auth/v1/verify` avec le jeton du lien (`signup` / `magiclink` / `email` sont tous essayés) → `access_token`.
7. **clé** — `POST https://api.inferall.ai/ai/v1/keys` avec ce jeton → `ifu_…`, écrit dans `keys.txt` seulement une fois l'étape 8 passée.
8. **barrière** — `/v1/models` → 200, deux invites différentes répondues par un texte non vide différent, et un appel d'outil `get_time` en direct (`proveKey()` dans `src/cli.js`).

## ⚙️ Options de la CLI

| option | signification |
| --- | --- |
| `--count N` | comptes (= clés) à créer — chacun est filtré avant d'être conservé |
| `--pool <file>` | liste de sorties, un proxy par ligne (ou `INFERALL_PROXIES` / `INFERALL_POOL`) ; par défaut `proxies.txt` s'il est présent |
| `--proxy <url>` | une seule sortie pour tout (`http://`, `socks5://`, `socks4://`, ou `host:port` nu) |
| `--exits K` | candidats de sortie essayés par compte (par défaut 3) |
| `--model <id>` | modèle utilisé pour la barrière en direct (par défaut `openai/gpt-oss-20b`) |
| `--port N` | port Chrome DevTools (par défaut : un port libre) |
| `--browser PATH` | binaire Chrome (ou `CHROME_PATH` ; auto-détecté sur Windows/macOS/Linux) |
| `--headless` | **NON recommandé** — le laboratoire exécute ceci avec interface |
| `--keep` | laisser Chrome ouvert à la fin de l'exécution |
| `--verify-only` | re-prouver chaque clé dans `keys.txt` via la barrière, ne rien créer |
| `--screen` | tester uniquement la liste de proxys contre `inferall.ai/auth` (64 premières sorties) |
| `--mail-timeout <s>` | combien de temps attendre le mail d'inscription (par défaut 300) |

Env : `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (remplacer la clé anon Supabase auto-découverte), `CHROME_PATH`. Sans pool, l'outil s'exécute **en direct**.

## 🛰️ Derrière un proxy

Une liste de sorties est facultative — sans elle, tout passe en direct :

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* une tentative = **une sortie, un navigateur, un compte** (Chrome fixe son proxy au lancement, donc une nouvelle tentative obtient un navigateur frais sur la sortie suivante)
* la sortie doit atteindre `inferall.ai`, `<ref>.supabase.co` **et** le rail de mail — le jeton Turnstile est lié à l'IP de résolution, donc les séparer casse l'inscription
* mesuré le 2026-10-15 : le rendement du pool gratuit pour cet hôte était de **0 sortie fonctionnelle sur 274** sur deux filtrages (`providers/inferall/report.md`) — une application Vercel plus des sorties gratuites est un mauvais duo, donc prévoyez une sortie résidentielle/filtrée plutôt que de blâmer le code
* la création réussie du 2026-10-20 s'est faite via une seule sortie WARP (`providers/inferall/out/extwave-journal.md`)

## 📄 Fichiers

| fichier | quoi |
| --- | --- |
| `keys.txt` | clés vérifiées, une par ligne (écrites uniquement par la barrière) |
| `accounts.json` | enregistrement compte ↔ clé ↔ barrière |
| `proxies.txt` | liste de sorties facultative, une par ligne |
| `launcher.config.json` | ce que le lanceur mémorise (généré, ignoré par git) |
| `repo-spec.json` | cette spécification d'empaquetage |
| `public-cli.js` | création / vérification / filtrage (stdlib node uniquement, aucune dépendance) |
| `description.txt`, `report.md` | compte rendu mesuré du panneau |
| `out/session-*.json` | session Supabase capturée pendant la création |
| `out/created-key.json` | la réponse de la clé + son `tier` / `controls` |
| `out/chat-200-*.json` | les deux preuves chat-200 (création + re-vérification 7 min plus tard) |
| `out/models.json` | la réponse des 83 modèles avec le prix par ligne |
| `out/reach-warp/` | corps de sondage bruts : `/auth`, `/keys`, paramètres Supabase, clé anon, sonde Turnstile |

## 🔌 Connexion à 9Router

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Ou laissez l'outil le faire : `node src/connect-9router.js --base http://localhost:20128 --password <pw>` enregistre un nœud `openai-compatible` et une connexion par clé dans `keys.txt` (`inferall-001`, `inferall-002`, …). Le relancer est idempotent et 9Router répartit la charge entre les clés.

## 🔌 Connexion à OmniRoute

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Ou laissez l'outil le faire : `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` enregistre un nœud `openai-compatible` et une connexion par clé dans `keys.txt` (`inferall-001`, `inferall-002`, …). Le relancer est idempotent et OmniRoute répartit la charge entre les clés.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 Ce que le fournisseur donne | Une adresse e-mail par clé — OTP e-mail Supabase derrière Cloudflare Turnstile, 25 appels NIM gratuits par compte, chaque clé vérifiée par chat |
| 🔑 Ce qu'une clé vous apporte | une clé API rattachée à son propre compte : les 83 identifiants de modèles sur le point de terminaison ci-dessous, aux limites de votre forfait. Le quota vit sur le **compte**, ce qui est exactement pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | Compatible OpenAI : `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Vos données | seuls inferall.ai et le backend de boîte mail que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

* **`supabase.co` ne parle qu'en HTTP/2.** Mesuré le 2026-10-23 : `curl --http1.1` se bloque, HTTP/2 répond `401` en 0,4 s, et le `https.request` de node ne se termine jamais sur cet hôte. `src/cli.js` embarque donc un second client — `requestH2()` — et route chaque appel `*.supabase.co` à travers lui (`H2_HOSTS`). Tout outil de votre cru qui parle à GoTrue en HTTP/1.1 ressemblera à un trou noir.
* **La barrière de l'application est un leurre.** `POST /api/turnstile/verify` répond `{"ok":true}` à la chaîne littérale `nonempty` (`out/reach-warp/tsverify-probe.json`) ; c'est Supabase qui impose le captcha (`captcha_failed` / `timeout-or-duplicate`), et un jeton Turnstile est à usage unique et lié à l'IP.
* **Chrome sans interface est refusé.** Le widget ne se valide que dans un navigateur visible ; `--headless` existe par souci d'exhaustivité, pas pour la production.
* **Le chemin de création par navigateur n'a pas encore terminé un compte de bout en bout.** Dans les voies du 2026-10-21, la page s'est rendue, la barrière de l'application a répondu `ok:true` et un jeton Turnstile a été obtenu (`709`/`730` caractères), mais le `fetch` OTP dans la page est revenu `status 0` sans réponse à chaque fois et le lecteur `temp.tf` s'est ensuite bloqué (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). La clé livrée ici a été créée par le chemin curl/WARP du laboratoire (`out/ia-mint.js`, `out/ia-keys.js`) et re-vérifiée deux fois ; `--verify-only` et le connecteur 9Router sont les chemins prouvés sur cette version, et la création exige une sortie filtrée plus un rail de mail qui répond.
* **Pas de code dans le mail.** Le message d'inscription ne porte qu'un **lien** `/auth/v1/verify?token=…` — un rail qui attend un code à 6 chiffres expirera.
* **Une clé, un compte.** Le compteur d'essai de 25 appels vit sur le compte, donc créer deux clés depuis un seul compte ne le doublerait pas — et le point de terminaison renvoie la clé en clair exactement une fois, ce qui explique pourquoi elle est écrite sur disque immédiatement.
* Si InferAll change la forme de son inscription ou le widget, l'outil s'arrête à cette étape et indique laquelle. **[Ouvrez un ticket](../../issues)** avec la commande que vous avez exécutée et la sortie exacte ; les PR sont bienvenues.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>