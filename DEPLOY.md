# Deploy — Roleta Irmãos Berti (Netlify + Supabase)

Arquitetura: site estático/SSR (TanStack Start) hospedado no **Netlify**, com banco
de dados central no **Supabase**. O sorteio e o "1 participação por @" acontecem
dentro do banco (função `spin_roleta`), então **não dá para burlar** pelo navegador.

Enquanto o Supabase não estiver configurado, o app roda em **modo local** (grava
num arquivo `.data/participants.json`) só para você testar no `npm run dev`.

---

## 1) Criar o banco no Supabase

1. Crie uma conta em https://supabase.com e clique em **New project**.
2. Dê um nome, defina a senha do banco e crie. Aguarde ~2 min provisionar.
3. No menu lateral: **SQL Editor → New query**.
4. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql) deste projeto, copie
   **todo** o conteúdo, cole no editor e clique em **Run**.
   - Isso cria a tabela `participants`, a regra `UNIQUE` (1x por @) e a função de
     sorteio `spin_roleta`.

### Painel pronto para os admins (item "os dois")
- Para consultar/exportar os registros, use **Table Editor → participants** no
  próprio Supabase. Lá dá para filtrar, ordenar e exportar CSV.
- Os admins acessam com login do Supabase (seguro). Convide outros admins em
  **Project Settings → Team**.

## 2) Pegar as chaves do Supabase

Em **Project Settings → API**, copie:
- **Project URL** → vira `VITE_SUPABASE_URL`
- **anon public** (em Project API keys) → vira `VITE_SUPABASE_ANON_KEY`
  - Pode ficar no front: ela só permite chamar a função de sorteio e **ler** a
    lista pública. Não permite inserir/editar nada direto.

## 3) Publicar no Netlify

1. Suba este projeto para um repositório (GitHub/GitLab) **ou** use o Netlify CLI.
2. No Netlify: **Add new site → Import from Git** e selecione o repositório.
3. O build já está configurado em [`netlify.toml`](netlify.toml):
   - Build command: `npm run build`
   - Publish: `dist`
4. Em **Site settings → Environment variables**, cadastre as 3 variáveis:

   | Nome | Valor |
   |------|-------|
   | `VITE_SUPABASE_URL` | sua Project URL |
   | `VITE_SUPABASE_ANON_KEY` | sua chave anon public |
   | `VITE_ADMIN_PASSWORD` | a senha que você quiser para a página `/admin` |

5. Clique em **Deploy**. Pronto — você terá um link público.

> Toda vez que mudar uma variável de ambiente, rode um **redeploy** para ela valer.

## 4) Página de administração no site

- Acesse `https://SEU-SITE.netlify.app/admin`
- Digite a senha definida em `VITE_ADMIN_PASSWORD`.
- Lista todos os participantes (Nome, @TikTok, Prêmio, Data/Hora) e exporta CSV.

> Observação de segurança: os dados de participante (nome, @, prêmio) já aparecem
> publicamente na home ("Quem já girou"), então não são sigilosos. A senha do
> `/admin` é uma barreira simples. Para um controle de acesso forte, use o painel
> do Supabase (item 1), que tem login próprio.

---

## Rodar localmente

```bash
npm install
npm run dev      # abre em http://localhost:8080
```

- Sem variáveis Supabase → modo local (arquivo `.data/participants.json`).
- Com um `.env` preenchido (veja [`.env.example`](.env.example)) → usa o Supabase real.

## Distribuição dos prêmios (10 fatias)
100 (4x) · 200 (3x) · 500 (2x) · 1000 (1x). Definida em
[`src/lib/diamonds.ts`](src/lib/diamonds.ts) e em `spin_roleta` no banco — mantenha
as duas iguais se for alterar.

## WhatsApp
Ao ganhar, o botão abre o WhatsApp da agência (`+55 15 93618-2659`) com nome, @,
prêmio e data já preenchidos. Para trocar o número, edite `AGENCY_WHATSAPP` em
[`src/routes/index.tsx`](src/routes/index.tsx).
