# Urban Code Labs - Site

Site institucional da Urban Code Labs, hospedado na Vercel. Site estatico (HTML/CSS/JS)
com algumas Edge Functions para contato, geolocalizacao e feed de noticias.

Dominio de producao: https://urbancodelabs.com.br

> Convencao de escrita: a copy das paginas e os comentarios de codigo nao usam
> travessao (em-dash). Use virgula, ponto ou hifen. Sem cliches de texto gerado por IA.

---

## Estrutura

```
index.html                 Home (pt-BR) - pagina empresarial
en/index.html              Home (en) - versao em ingles
setor-publico/index.html   Landing do setor publico (pt-BR), autossuficiente
en/setor-publico/index.html Landing do setor publico (en)
style.css                  Estilos (tokens, temas dark/light, responsivo)
script.js                  JS do cliente (tema, i18n, carrosseis, formulario, noticias)
sitemap.xml, robots.txt    SEO
site.webmanifest           PWA/manifest
assets/                    Logos e imagens
vercel.json                Headers de seguranca (CSP), redirects, cache, cron
api/
  contact.js               POST do formulario -> envia e-mail via Resend
  geo.js                   Retorna o pais do visitante (header da Vercel)
  news.js                  Agrega feeds RSS/HN para a secao Tech News
  cron-news.js             Cron diario que revalida o cache de /api/news
```

Duas audiencias separadas, sem redirecionar uma para a outra:
- Home (`/`, `/en`): oferta empresarial. Nao faz pitch de governo (o GOVOS aparece
  so como prova tecnica no portfolio).
- Setor Publico (`/setor-publico`, `/en/setor-publico`): oferta governamental,
  autossuficiente (nav e contato proprios, sem links para a home).

---

## Branches e ambientes

| Branch    | Ambiente Vercel | URL                                | Uso                         |
|-----------|-----------------|------------------------------------|-----------------------------|
| `main`    | Production      | https://urbancodelabs.com.br       | Producao                    |
| `develop` | Preview         | https://developer.urbancodelabs.com.br | Desenvolvimento         |
| `homolog` | Preview         | https://homolog.urbancodelabs.com.br   | Homologacao / QA        |

Os subdominios estao amarrados a branch em Vercel > Settings > Domains
(Preview > Git Branch). Os previews estao protegidos por Vercel Authentication
(so quem esta logado na conta Vercel acessa).

### Fluxo de trabalho

```
develop  ->  homolog  ->  main
(dev)        (QA)         (producao)
```

1. Trabalhe na `develop`, valide em `developer.urbancodelabs.com.br`.
2. Promova para `homolog` (merge) e homologue em `homolog.urbancodelabs.com.br`.
3. Aprovado, merge para `main` -> deploy automatico em producao.

Todo push em qualquer branch gera um deploy na Vercel (Production para `main`,
Preview para as demais).

---

## Variaveis de ambiente (Vercel > Settings > Environment Variables)

Todas devem estar marcadas para **Production E Preview** (senao a homologacao
responde `not_configured`). Guardadas so na Vercel, nunca no codigo.

| Variavel                   | Para que serve                                  |
|----------------------------|-------------------------------------------------|
| `RESEND_API_KEY`           | Chave da Resend (envio de e-mail do contato)    |
| `CONTACT_TO`               | E-mail que recebe os contatos                   |
| `CONTACT_FROM`             | Remetente (ex: contato@urbancodelabs.com.br)    |
| `UPSTASH_REDIS_REST_URL`   | Rate-limit do contato (Upstash Redis, REST)     |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Upstash                                |
| `CRON_SECRET` (opcional)   | Protege /api/cron-news por Bearer               |

Ao trocar o escopo de uma variavel, e preciso **redeploy** da branch afetada
para o novo valor entrar em vigor (env vars entram no build).

---

## Seguranca

- **CSP rigorosa** (em `vercel.json`): `default-src 'none'`, scripts so por hash
  (sem `unsafe-inline`), `connect-src 'self'`, `form-action 'none'`,
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`.
  Ao adicionar/alterar um `<script>` inline, recalcule o hash SHA-256 e atualize
  o `script-src`.
- **Headers**: HSTS preload, X-Content-Type-Options, X-Frame-Options DENY,
  Referrer-Policy, Permissions-Policy restritiva, COOP/CORP.
- **Formulario de contato** (`api/contact.js`):
  - Destino fixo em env var (nao e open-relay).
  - Validacao de tamanho e regex de e-mail (bloqueia injecao de header CRLF).
  - Honeypot (campo `website`) contra bots.
  - Verificacao de Origin/Referer (so aceita envios do proprio dominio).
  - Rate-limit via Upstash: 5 envios por IP/hora + teto global de 80/dia
    (protege a cota da Resend). Fail-open: se o Upstash cair, libera o envio.
- **Feed de noticias**: conteudo externo passa por strip de tags no servidor e
  `esc()` + `safeUrl()` no cliente (so http/https). Render sem `innerHTML`.
- Segredos nunca vao para o repo (ver `.gitignore`). Chamadas a servicos externos
  (Resend, Upstash) sao feitas server-side pelas Edge Functions, mantendo a CSP
  do cliente fechada.

---

## Formulario de contato: estados

O JS (`script.js`) mostra mensagens de status inline (acessiveis, dark/light):

| Situacao                          | Mensagem                                            |
|-----------------------------------|-----------------------------------------------------|
| Sucesso                           | "Recebemos sua mensagem. Retornaremos em breve."    |
| Muitas tentativas (HTTP 429)      | Aviso + link para WhatsApp                           |
| Servidor de e-mail fora (502/503) | "Servidor indisponivel, tente mais tarde" + WhatsApp |
| Rede caida                        | Igual ao anterior                                    |
| Campos obrigatorios vazios        | Aviso inline (sem `alert()`)                         |

O WhatsApp e oferecido como link clicavel, nunca aberto automaticamente. Nunca
mostra "enviada" quando o envio falhou.

---

## i18n

Idioma vem de `document.documentElement.lang`. As strings dinamicas ficam no
objeto `UCL_T` (pt/en) no topo de `script.js`. A troca de idioma e por link
(`.lang-switch`) entre as versoes equivalentes.

---

## Notas operacionais

- **Plano Vercel**: Hobby (gratis) e, por ToS, para uso nao comercial. Para uso
  comercial, avaliar Vercel Pro ou Cloudflare Pages (free comercial).
- **Cron**: `vercel.json` roda `/api/cron-news` diariamente (revalida o feed).
- **Cache**: HTML `no-store`; `style.css`/`script.js` com `must-revalidate` e
  versionados por querystring (`?v=`); assets com cache longo.
- Previews e producao compartilham o mesmo Upstash e Resend. Testar o formulario
  no preview envia e-mail real e consome o teto de 80/dia. Para isolar 100%,
  criar um segundo banco Upstash gratis e apontar so o escopo Preview para ele.
