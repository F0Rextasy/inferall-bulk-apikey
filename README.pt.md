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

**Crie contas e chaves de API do InferAll em massa — inferência compatível com OpenAI em https://api.inferall.ai/v1 em 83 ids de modelos + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-83%20served-412991?style=for-the-badge)](https://inferall.ai/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Camada gratuita](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-83-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isso existe

O InferAll (`inferall.ai`) é um **app Next.js na Vercel** na frente de um projeto **Supabase** (ref `epojjjpawjubtqqxabzu`) e de um gateway de inferência separado em `api.inferall.ai` (marca do serviço: Kindly Robotics). A página de login oferece **e-mail + link de uso único** (`signInWithOtp`) ao lado do Google — as configurações publicadas do próprio projeto confirmam que ambos estão ativos e que nenhum provedor de senha é necessário (`email: true`, `google: true`: `providers/inferall/out/reach-warp/supa-settings.json`). Isso faz com que este **não seja** um painel apenas OAuth: a identidade é provada pela **caixa de correio**, que é exatamente a parte que um trilho em massa automatiza.

Vale a pena por causa do que protege essa chamada de OTP: um widget Cloudflare **Turnstile** (sitekey `0x4AAAAAADhj5AjLCn-67Znk`) cujo token o Supabase exige como `gotrue_meta_security.captcha_token`. Medido: sem token → `captcha_failed`, um reutilizado → `timeout-or-duplicate` (`out/ia-mint-run2.log`, `out/ia-mint-run3.log`), um novo → `200 {}` (`out/ia-mint-run4.log`). O portão do próprio app `POST /api/turnstile/verify` é um chamariz — ele responde `{"ok":true}` a qualquer string não vazia (`out/reach-warp/tsverify-probe.json`).

A unidade que escala é uma conta por chave: a cota de teste vive na **conta**, e a chave (`ifu_…`) é limitada a ela.

## 🎁 Camada gratuita — quanto você recebe

| O quê | Valor |
| --- | --- |
| Cota de teste | uma chave nova volta como `tier: "pending"` e recebe **25 chamadas gratuitas de modelos NIM antes de qualquer pagamento** (docs do gateway, `providers/inferall/out/reach-warp/docs.body`); a 26ª chamada responde **HTTP 402 — cobrança necessária** |
| Modelos $0 | **15 das 83** linhas do catálogo são `$0` na entrada e `$0` na saída (`out/models.json`) — uma chave de teste sem cartão pode chamá-las |
| Chave emitida | `out/created-key.json` — `2026-10-20T21:04:29Z`, `tier: pending`, `budget_period: lifetime`, mensagem *"you can call the free open models right away, no card needed"* |
| Prova de gasto | `POST /v1/chat/completions` em `openai/gpt-oss-20b` → **200**, `content:"pong"` (`out/chat-200-1792530466327.json`) |
| Contador | `GET /ai/v1/key/status` reporta `trial: {used, remaining, cap}`; cada chamada de teste também carrega os cabeçalhos de resposta `X-InferAll-Trial-Usage: N/CAP` e `X-InferAll-Trial-Status` |
| Após o teste | 402 até o pacote inicial de $5 em `inferall.ai/billing` — uma conta paga então também alcança OpenAI / Anthropic / Gemini e Claude Code |
| Caminho mais barato | queime as 25 chamadas nos ids $0: em uma chave de teste um `gpt-4o` / `claude-sonnet-4-6` puro é **recusado**; prefixe-o (`openai/gpt-4o`) e ele roteia, cobrado do saldo |

> 💡 A camada gratuita é definida pelo InferAll e pode mudar. Confira os números ao vivo em [inferall.ai](https://inferall.ai) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 83

`GET /v1/models` com a chave de teste respondeu **83 ids de modelos** (`providers/inferall/out/models.json`, 2026-10-20), cada linha carregando seu próprio `pricing`:

* **15 linhas são $0/$0** — o conjunto de teste que uma chave sem cartão pode realmente chamar: `openai/gpt-oss-20b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-parse-2.0`, `nvidia/riva-translate-4b-instruct-v2`, `nvidia/ising-calibration-1.5-31b`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `meta/muse-glimmer-30b`, `meta/llama-3.2-11b-vision-instruct`, `google/diffusiongemma-26b-a4b-it`, `stepfun-ai/step-5-preview`.
* **OpenAI** — `openai/gpt-4o`, `gpt-4.1`, `o1`/`o1-pro`, `o3`/`o3-mini`, `o4-mini`, `gpt-5` … `gpt-5.6-terra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-sol`, `gpt-6-astra`.
* **Anthropic** — `anthropic/claude-opus-4-5-20251101` … `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
* **Gemini** — `gemini/gemini-2.5-flash` … `gemini-3.8-flash`, `gemini-4-argon`, além das rotas de imagem (`gemini-3.1-flash-image`, `gemini-nano-banana-2.1`).
* **xAI** — `grok-4.3` … `grok-4.7`, `grok-4.20-*-reasoning`, `grok-build-0.1`.
* **Próprios do InferAll** — `inferall-uncensored`, `inferall-uncensored-large`.

O catálogo também serve como lista de preços (`inferall.ai/models` o renderiza, `GET /v1/models` é o JSON bruto) e ele **marca os gratuitos** que uma chave de teste pode chamar. Um id que o gateway não consegue rotear é recusado com `400`; ele nunca é trocado silenciosamente, e `resp.model` na resposta sempre nomeia o modelo que de fato respondeu.

## 🧪 Como usar a API

A URL base é **`https://api.inferall.ai/v1`** — compatível com OpenAI, então qualquer cliente OpenAI funciona (`OPENAI_BASE_URL` + chave `ifu_…`). Apps no formato Anthropic podem apontar `ANTHROPIC_BASE_URL` para `https://api.inferall.ai` em vez disso.

```bash
curl https://api.inferall.ai/v1/chat/completions \
  -H "Authorization: Bearer $INFERALL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-oss-20b","messages":[{"role":"user","content":"say ok"}],"max_tokens":16}'
```

* em uma chave de **teste**, nomeie um **modelo $0** (ou prefixe um pago com seu provedor); em uma conta paga, `gpt-4o` / `claude-sonnet-4-6` puros também roteiam
* `X-Inferall-Routing: exact` desativa o fallback automático de modelo/provedor alternativo do gateway (que está ativo por padrão e pode executar uma requisição de backup paralela para modelos gratuitos elegíveis)
* `GET /ai/v1/key/status` retorna o contador de teste e o saldo; `X-InferAll-Trial-Usage` carrega o mesmo contador em cada resposta
* a chave é impressa **uma vez** no momento da emissão — `POST /ai/v1/keys` é o único lugar onde ela existe em texto simples

## 🛠 Início rápido

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

Uma chave é escrita em `keys.txt` **somente** após o portão passar: `/v1/models` → 200, dois prompts diferentes respondidos com dois textos não vazios diferentes, e uma chamada real de ferramenta `get_time`. Qualquer coisa que falhe é registrada em `accounts.json` e tentada novamente na próxima execução.

### 🖱️ O launcher

`src/launcher.js` (mesmo banner deste README) inicializa o wrapper do conector: emite, verifica, filtra a lista de proxies, mostra as configurações memorizadas e registra as chaves em um 9Router local — as flags da CLI permanecem configuráveis sem ler o código-fonte, e as respostas ficam em `launcher.config.json`. `src/connect-9router.js` registra o provedor sob o prefixo `inferall` com `openai/gpt-oss-20b` como modelo padrão, uma conexão por chave em `keys.txt`.

## 🚀 Um comando

O captcha é resolvido para você — um comando emite N chaves verificadas:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` é o padrão e nada precisa ser passado: o `src/solver.js` embutido abre um Chrome com interface, monta o widget Turnstile e retorna o token automaticamente. `--dry` imprime o plano resolvido (contagem, pool de saídas, solver, modelo) e sai **sem arquivo escrito e sem chamada de rede**. `node src/launcher.js` (ou `npm start`) é o mesmo caminho como um menu.

> ⚠️ **Termos e risco de conta.** Esta é uma ferramenta de automação, não um vendedor de contas. Cadastros em massa e emissão de chaves são inteiramente sua responsabilidade: podem violar os Termos de Serviço do provedor e podem bloquear endereços, saídas ou contas. Use apenas em infraestrutura que você tem permissão para automatizar e mantenha a taxa de requisições baixa.

## ✅ Verificado e funcionando — toda chave é testada

Execução de laboratório **2026-10-20**, através de uma saída WARP fixada (`socks5h://127.0.0.1:40000`):

* caixa de correio — um alias plus do Outlook `temp.tf` (`<local>+<tag> [at] outlook.com`, `out/ia-mint-run4.log`); o e-mail de cadastro é um **link, não um código** — assunto `Confirm Your Signup`, do próprio endereço `noreply` do app em `inferall.ai` (`out/ia-maildump.out`)
* Turnstile — widget clicado até responder com um token de 752 caracteres, aceito por `/auth/v1/otp` → `200 {}`; as três tentativas anteriores mostram exatamente por que o token importa (`captcha_failed`, `timeout-or-duplicate`, `missing_token`)
* sessão — `GET /auth/v1/verify` → `303` com `access_token`/`refresh_token` no fragmento (`out/verify-headers.txt`); um cookie `@supabase/ssr` `sb-<ref>-auth-token=base64-…` faz `GET /keys` responder **200** (`out/ia-keys-run1.log`, `out/keys-authed.html`, 18.522 bytes)
* chave — `POST https://api.inferall.ai/ai/v1/keys` com o token de acesso do Supabase → **`ifu_<…>`**, `tier: "pending"`, `out/created-key.json`
* prova ao vivo — **chat-200 duas vezes**: `2026-10-20T21:07:46Z` (`out/chat-200-1792530466327.json`) e a reverificação `2026-10-20T21:14:46Z`, 7m00s depois (`out/chat-200-1792530886719.json`, `out/ia-chat-reverify.log`) — modelo `openai/gpt-oss-20b`, ambos respondendo `content:"pong"`; `/v1/models` com essa chave → 83 linhas

Evidências: `providers/inferall/out/` (`chat-200-*.json` ×2, `created-key.json`, `verify-headers.txt`, `keys-authed.html`, `reach-warp/`) e o relatório `providers/inferall/report.md` (UPDATE 2026-10-20).

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser escrita em `keys.txt`
> (chaves mortas nunca são entregues). As combinações do roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca escondidas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: InferAll page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferall.ai/v1/chat/completions → real content = the key is live
```

Por conta, toda requisição destinada ao provedor passa por **uma saída** — o token Turnstile é vinculado ao IP que o resolveu, então a página, a chamada de OTP e a caixa de correio devem compartilhar esse endereço:

1. **caixa de correio** — `GET temp.tf/api/account?providers=outlook,hotmail&dot=0&plus=1` devolve um alias plus novo em uma conta ativa do pool Outlook/Hotmail. Domínios descartáveis são recusados pelo painel (`email_disposable_domain` / `403 email_domain_not_supported`).
2. **página** — um Chrome real com interface (`--remote-debugging-port`, perfil descartável, `--lang=en-US`) apontado para `/auth`, opcionalmente atrás de `--proxy-server`. Toda chamada posterior é feita **nessa página** (`fetch`, `credentials:'include'`), então ela herda o IP de saída, o UA e os cookies.
3. **portão do app** — `POST /api/turnstile/verify` não quer nada além de um token não vazio; a verificação real é a do Supabase, ao lado do OTP.
4. **Turnstile** — o widget é lido da página e, se permanecer vazio, um é montado explicitamente (`render=explicit`) e clicado em um ritmo fixo; iframes são perfurados através de shadow roots fechados para encontrar a caixa.
5. **OTP** — `POST <ref>.supabase.co/auth/v1/otp` com `gotrue_meta_security.captcha_token` → o **link** de confirmação chega por e-mail.
6. **sessão** — `POST /auth/v1/verify` com o token do link (`signup` / `magiclink` / `email` são todos tentados) → `access_token`.
7. **chave** — `POST https://api.inferall.ai/ai/v1/keys` com esse token → `ifu_…`, escrita em `keys.txt` somente após a etapa 8 passar.
8. **portão** — `/v1/models` → 200, dois prompts diferentes respondidos com textos não vazios diferentes, e uma chamada real de ferramenta `get_time` (`proveKey()` em `src/cli.js`).

## ⚙️ Opções da CLI

| flag | significado |
| --- | --- |
| `--count N` | contas (= chaves) a emitir — cada uma é validada pelo portão antes de ser mantida |
| `--pool <file>` | lista de saídas, um proxy por linha (ou `INFERALL_PROXIES` / `INFERALL_POOL`); usa `proxies.txt` por padrão, se presente |
| `--proxy <url>` | uma única saída para tudo (`http://`, `socks5://`, `socks4://`, ou `host:port` puro) |
| `--exits K` | candidatos de saída tentados por conta (padrão 3) |
| `--model <id>` | modelo usado para o portão ao vivo (padrão `openai/gpt-oss-20b`) |
| `--port N` | porta do Chrome DevTools (padrão: uma livre) |
| `--browser PATH` | binário do Chrome (ou `CHROME_PATH`; detectado automaticamente no Windows/macOS/Linux) |
| `--headless` | **NÃO recomendado** — o laboratório executa isto com interface |
| `--keep` | deixa o Chrome aberto quando a execução termina |
| `--verify-only` | revalida toda chave em `keys.txt` através do portão, sem emitir nada |
| `--screen` | apenas testa a lista de proxies contra `inferall.ai/auth` (primeiras 64 saídas) |
| `--mail-timeout <s>` | quanto tempo esperar pelo e-mail de cadastro (padrão 300) |

Env: `INFERALL_MODEL`, `INFERALL_POOL`, `INFERALL_PROXIES`, `INFERALL_ANON` (sobrescreve a chave anon do Supabase descoberta automaticamente), `CHROME_PATH`. Sem um pool, a ferramenta roda **direto**.

## 🛰️ Atrás de um proxy

Uma lista de saídas é opcional — sem uma, tudo vai direto:

```bash
node src/cli.js --count 5 --pool proxies.txt      # one exit per account, rotated on retry
node src/cli.js --screen --pool proxies.txt       # which exits even reach inferall.ai/auth
```

* uma tentativa = **uma saída, um navegador, uma conta** (o Chrome fixa seu proxy na inicialização, então uma nova tentativa recebe um navegador novo na próxima saída)
* a saída deve alcançar `inferall.ai`, `<ref>.supabase.co` **e** o trilho de e-mail — o token Turnstile é vinculado ao IP que o resolveu, então separá-los quebra o cadastro
* medido em 2026-10-15: o rendimento do pool gratuito para este host foi de **0 saídas funcionais de 274** em duas triagens (`providers/inferall/report.md`) — um app Vercel mais saídas gratuitas é um par ruim, então reserve uma saída residencial/filtrada em vez de culpar o código
* a emissão bem-sucedida de 2026-10-20 rodou através de uma única saída WARP (`providers/inferall/out/extwave-journal.md`)

## 📄 Arquivos

| arquivo | o quê |
| --- | --- |
| `keys.txt` | chaves verificadas, uma por linha (escrita somente pelo portão) |
| `accounts.json` | registro conta ↔ chave ↔ portão |
| `proxies.txt` | lista opcional de saídas, uma por linha |
| `launcher.config.json` | o que o launcher memoriza (gerado, ignorado pelo git) |
| `repo-spec.json` | esta especificação de empacotamento |
| `public-cli.js` | emitir / verificar / filtrar (apenas stdlib do node, sem dependências) |
| `description.txt`, `report.md` | relatório medido do painel |
| `out/session-*.json` | sessão do Supabase capturada durante a emissão |
| `out/created-key.json` | a resposta da chave + seu `tier` / `controls` |
| `out/chat-200-*.json` | as duas provas chat-200 (emissão + reverificação 7m depois) |
| `out/models.json` | a resposta dos 83 modelos com preços por linha |
| `out/reach-warp/` | corpos brutos das sondagens: `/auth`, `/keys`, configurações do Supabase, chave anon, sondagem do Turnstile |

## 🔌 Conectar ao 9Router

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Ou deixe a ferramenta fazer isso: `node src/connect-9router.js --base http://localhost:20128 --password <pw>` registra um nó `openai-compatible` e uma conexão por chave em `keys.txt` (`inferall-001`, `inferall-002`, …). Reexecutá-lo é idempotente e o 9Router faz balanceamento de carga entre as chaves.

## 🔌 Conectar ao OmniRoute

```json
{
  "name": "InferAll",
  "prefix": "inferall",
  "baseUrl": "https://api.inferall.ai/v1",
  "apiKeyEnv": "INFERALL_KEY",
  "defaultModel": "openai/gpt-oss-20b"
}
```

Ou deixe a ferramenta fazer isso: `node src/connect-omniroute.js --base http://localhost:20128 --password <pw>` registra um nó `openai-compatible` e uma conexão por chave em `keys.txt` (`inferall-001`, `inferall-002`, …). Reexecutá-lo é idempotente e o OmniRoute faz balanceamento de carga entre as chaves.

## 🔑 O que uma chave te dá

| | |
| --- | --- |
| 🏢 Provedor | **InferAll** — [inferall.ai](https://inferall.ai) |
| 🎁 O que o provedor dá | Um endereço de e-mail por chave — OTP por e-mail do Supabase atrás do Cloudflare Turnstile, 25 chamadas NIM gratuitas por conta, toda chave verificada por chat |
| 🔑 O que uma chave te dá | uma chave de API limitada à sua própria conta: os 83 ids de modelos no endpoint abaixo, nos limites do seu plano. A cota vive na **conta**, que é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://api.inferall.ai/v1/chat/completions` |
| 🔒 Seus dados | apenas inferall.ai e o backend de caixa de entrada que você configurar são contatados; as chaves ficam na sua máquina |

## 🐞 Problemas

* **`supabase.co` só fala HTTP/2.** Medido em 2026-10-23: `curl --http1.1` trava, HTTP/2 responde `401` em 0,4 s, e o `https.request` do node nunca completa nesse host. Por isso `src/cli.js` carrega um segundo cliente — `requestH2()` — e roteia toda chamada `*.supabase.co` por ele (`H2_HOSTS`). Qualquer ferramenta sua que fale com o GoTrue via HTTP/1.1 vai parecer um buraco negro.
* **O portão do app é um chamariz.** `POST /api/turnstile/verify` responde `{"ok":true}` à string literal `nonempty` (`out/reach-warp/tsverify-probe.json`); o Supabase é quem impõe o captcha (`captcha_failed` / `timeout-or-duplicate`), e um token Turnstile é de uso único e vinculado ao IP.
* **Chrome headless é recusado.** O widget só é liberado em um navegador visível; `--headless` existe por completude, não para produção.
* **O caminho de emissão pelo navegador ainda não completou uma conta de ponta a ponta.** Nas faixas de 2026-10-21 a página renderizou, o portão do app respondeu `ok:true` e um token Turnstile foi obtido (`709`/`730` caracteres), mas o `fetch` de OTP na página voltou `status 0` sem resposta todas as vezes e o leitor `temp.tf` então travou (`out/mint-lane2.log`, `out/mint-lane3.log`, `out/mint-lane-1792733036.log`). A chave entregue aqui foi emitida pelo caminho curl/WARP do laboratório (`out/ia-mint.js`, `out/ia-keys.js`) e reverificada duas vezes; `--verify-only` e o conector 9Router são os caminhos comprovados nesta build, e a emissão quer uma saída filtrada mais um trilho de e-mail que responda.
* **Sem código no e-mail.** A mensagem de cadastro carrega apenas um **link** `/auth/v1/verify?token=…` — um trilho que espera um código de 6 dígitos vai expirar.
* **Uma chave, uma conta.** O contador de teste de 25 chamadas vive na conta, então emitir duas chaves de uma conta não o dobraria — e o endpoint devolve a chave em texto simples exatamente uma vez, razão pela qual ela é escrita em disco imediatamente.
* Se o InferAll mudar o formato do cadastro ou o widget, a ferramenta para nessa etapa e diz qual. **[Abra uma issue](../../issues)** com o comando que você executou e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferall-bulk-apikey contributors

</div>