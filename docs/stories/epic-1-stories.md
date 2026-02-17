# Epic 1: Fundação & Auth — Stories

**Autor:** @sm (Sam)
**PRD Ref:** Epic 1 Shard
**Architecture Ref:** FormFlow Architecture v1.0.0

---

## Story 1.1: Setup do Projeto + Schema do Banco

**ID:** FF-001
**Prioridade:** P0
**Estimativa:** M (Medium)
**Depende de:** Nenhuma

### Descrição
Criar o projeto Next.js com todo o tooling configurado, instalar dependências, configurar Prisma com SQLite, e criar o schema completo do banco de dados com todas as tabelas necessárias para a aplicação.

### Tarefas Técnicas
1. Criar projeto Next.js 15 com TypeScript, App Router, Tailwind CSS
2. Instalar dependências: prisma, @prisma/client, next-auth, bcryptjs, zod, zustand, framer-motion, lucide-react, @dnd-kit/core, @dnd-kit/sortable, recharts
3. Configurar `.env` com DATABASE_URL e NEXTAUTH_SECRET
4. Criar schema Prisma completo (User, Form, Field, Response, Tag, ResponseTag, TagRule, Webhook, WebhookLog, SheetsConfig)
5. Rodar migration inicial
6. Criar `src/lib/prisma.ts` (singleton)
7. Criar `src/types/index.ts` com tipos TypeScript globais
8. Configurar path aliases no tsconfig (`@/`)
9. Configurar Tailwind com tema escuro customizado

### Acceptance Criteria
- [x] `npm run dev` roda sem erros
- [x] Prisma Studio mostra todas as tabelas criadas
- [x] Tipos TypeScript exportados e acessíveis via `@/types`
- [x] Tailwind com tema configurado (migrado para tema claro Typeform-inspired)
- [x] Todas as dependências instaladas e versionadas

### Arquivos a Criar/Modificar
- `formflow/package.json` (novo)
- `formflow/prisma/schema.prisma` (novo)
- `formflow/.env` (novo)
- `formflow/src/lib/prisma.ts` (novo)
- `formflow/src/types/index.ts` (novo)
- `formflow/tailwind.config.ts` (modificar)
- `formflow/tsconfig.json` (verificar aliases)

---

## Story 1.2: Sistema de Autenticação

**ID:** FF-002
**Prioridade:** P0
**Estimativa:** M (Medium)
**Depende de:** FF-001

### Descrição
Implementar autenticação completa com NextAuth.js usando Credentials provider, registro de usuário, login, logout, proteção de rotas com middleware, e sessão persistente via JWT.

### Tarefas Técnicas
1. Criar `src/lib/auth.ts` com NextAuth config (Credentials provider, JWT strategy)
2. Criar `src/app/api/auth/[...nextauth]/route.ts`
3. Criar `src/app/api/register/route.ts` (POST — criar usuário com bcrypt)
4. Criar middleware.ts para proteção de rotas (redirect /login se não autenticado)
5. Criar `src/app/(auth)/login/page.tsx` — form de login
6. Criar `src/app/(auth)/register/page.tsx` — form de registro
7. Criar `src/app/(auth)/layout.tsx` — layout limpo para auth pages
8. Criar `src/app/providers.tsx` — SessionProvider wrapper
9. Criar componentes UI base: Button, Input, Card

### Acceptance Criteria
- [x] Registrar novo usuário com email/senha
- [x] Login com credenciais válidas redireciona para dashboard
- [x] Login com credenciais inválidas mostra erro
- [x] Acessar rota protegida sem sessão redireciona para /login
- [x] Logout limpa a sessão e redireciona para /login
- [x] Senhas armazenadas com bcrypt (hash)
- [x] Sessão persiste após refresh da página

### Arquivos a Criar
- `formflow/src/lib/auth.ts`
- `formflow/src/app/api/auth/[...nextauth]/route.ts`
- `formflow/src/app/api/register/route.ts`
- `formflow/middleware.ts`
- `formflow/src/app/(auth)/layout.tsx`
- `formflow/src/app/(auth)/login/page.tsx`
- `formflow/src/app/(auth)/register/page.tsx`
- `formflow/src/app/providers.tsx`
- `formflow/src/components/ui/Button.tsx`
- `formflow/src/components/ui/Input.tsx`
- `formflow/src/components/ui/Card.tsx`

---

## Story 1.3: Layout Base + Navegação

**ID:** FF-003
**Prioridade:** P0
**Estimativa:** S (Small)
**Depende de:** FF-002

### Descrição
Criar o layout principal da área autenticada com sidebar de navegação, topbar com info do usuário, e content area. Design escuro profissional.

### Tarefas Técnicas
1. Criar `src/app/(dashboard)/layout.tsx` — layout com sidebar + topbar + content
2. Criar `src/components/shared/Sidebar.tsx` — navegação principal
3. Criar `src/components/shared/Topbar.tsx` — user info + logout
4. Configurar globals.css com tema escuro (bg-slate-950)
5. Implementar sidebar responsiva (collapse em mobile)

### Acceptance Criteria
- [x] Layout com sidebar fixa à esquerda, topbar no topo, content area
- [x] Sidebar com links: Dashboard, Formulários, Configurações
- [x] Topbar mostra nome do usuário e botão de logout
- [x] Sidebar collapsa em mobile (hamburger menu)
- [x] Navegação entre páginas funciona sem reload

### Arquivos a Criar
- `formflow/src/app/(dashboard)/layout.tsx`
- `formflow/src/components/shared/Sidebar.tsx`
- `formflow/src/components/shared/Topbar.tsx`
- `formflow/src/app/globals.css` (modificar)

---

## Story 1.4: CRUD de Formulários + Dashboard

**ID:** FF-004
**Prioridade:** P0
**Estimativa:** M (Medium)
**Depende de:** FF-003

### Descrição
Implementar a dashboard principal com listagem de formulários, e CRUD completo (criar, editar título, duplicar, arquivar, deletar). Inclui API routes, página de listagem com busca/filtros, e métricas rápidas.

### Tarefas Técnicas
1. Criar API routes:
   - `GET /api/forms` — listar formulários do usuário
   - `POST /api/forms` — criar formulário
   - `PATCH /api/forms/[id]` — atualizar formulário
   - `DELETE /api/forms/[id]` — deletar formulário
   - `POST /api/forms/[id]/duplicate` — duplicar formulário
2. Criar `src/app/(dashboard)/page.tsx` — dashboard com métricas e forms recentes
3. Criar `src/app/(dashboard)/forms/page.tsx` — lista de formulários
4. Componente FormCard — card de cada formulário com ações
5. Modal/dialog para criar novo formulário
6. Busca e filtro por status
7. Métricas: total forms, total respostas, forms publicados

### Acceptance Criteria
- [x] Dashboard mostra métricas (total forms, respostas, publicados)
- [x] Lista de formulários com cards visuais
- [x] Criar formulário (pede título, gera slug automático)
- [x] Duplicar formulário (cria cópia com "(Cópia)" no título)
- [x] Deletar formulário com confirmação
- [x] Filtrar por status (Draft, Published, Closed)
- [x] Busca por título
- [x] Status badge colorido em cada card
- [x] Ao clicar no form, navega para editor

### Arquivos a Criar
- `formflow/src/app/api/forms/route.ts`
- `formflow/src/app/api/forms/[id]/route.ts`
- `formflow/src/app/api/forms/[id]/duplicate/route.ts`
- `formflow/src/app/(dashboard)/page.tsx`
- `formflow/src/app/(dashboard)/forms/page.tsx`
- `formflow/src/components/forms/FormCard.tsx`
- `formflow/src/components/forms/CreateFormModal.tsx`
- `formflow/src/lib/validators.ts`

---

*Stories geradas pelo @sm Sam — Synkra AIOS v4.2*
*— Sam, quebrando o épico em pedaços digeríveis 📋*
