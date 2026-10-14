# Studio de Landing Pages

Estúdio interno para criar, editar e publicar landing pages. Só o admin entra no painel. O cliente abre o subdomínio publicado.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Puck (`@puckeditor/core`) como editor visual. O pacote antigo `@measured/puck` foi descontinuado.
- Motion para animações
- PostgreSQL + Prisma
- Auth.js com um único usuário semeado e 2FA opcional
- Imagens em disco no desenvolvimento e Cloudflare R2 quando as variáveis existem
- IA gratuita: Gemini, Groq, OpenRouter e Ollama, com gerador local de arquétipos se a cota acabar

## Setup local

1. Suba o Postgres. A porta 5433 evita conflito com outro Postgres na 5432:

```bash
docker compose up -d
```

2. Copie `.env.example` para `.env` e preencha `AUTH_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo de 10 caracteres).

3. Crie as tabelas, a role pública e as páginas de exemplo:

```bash
npm run db:setup
```

4. Rode o estúdio:

```bash
npm run dev
```

- Painel: http://localhost:3000
- Exemplo de moda: http://atelier-luna.localhost:3000
- Exemplo de advocacia: http://marina-coelho.localhost:3000

## Variáveis

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Postgres do admin (migrations e escrita) |
| `DATABASE_URL_PUBLIC` | Role que só lê páginas publicadas |
| `AUTH_SECRET` | Sessão e criptografia do 2FA |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Único administrador, criado no seed |
| `ROOT_DOMAIN` | Domínio raiz, sem porta (`localhost` ou `seudominio.com.br`) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | O mesmo domínio com porta, para montar links |
| `AI_PROVIDER` / `AI_FALLBACK` | Ordem dos provedores. Padrão: `gemini` e `groq,openrouter` |
| `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | Chaves só no servidor |
| `OLLAMA_BASE_URL` | Opcional, liga o Ollama local |
| `R2_*` | Storage de produção |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Captcha do formulário |
| `RESEND_API_KEY` / `LEAD_EMAIL` | Aviso de lead por e-mail |

Não há cadastro público. Sem as chaves de IA, o briefing ainda gera três propostas pelo gerador de arquétipos.

## DNS e deploy

Na Vercel, adicione o domínio raiz e `*.seudominio.com.br`. O certificado curinga cobre um nível (`cliente.seudominio.com.br`). Aponte o DNS para os nameservers da Vercel, ou delegue o desafio do certificado se o DNS ficar fora.

`ROOT_DOMAIN=seudominio.com.br` e `NEXT_PUBLIC_ROOT_DOMAIN=seudominio.com.br`.

Domínio próprio de um cliente fica na coluna `customDomain`. Cada domínio de terceiro precisa ser adicionado ao projeto da Vercel; o curinga não cobre isso. O proxy já separa esse host e a página `/site/domain/[domain]` resolve o registro.

Publique com o botão do editor. A ação invalida a tag `page:slug` e o sitemap.

## Testes

```bash
npm test
npx playwright install chromium
npm run test:e2e
```
