# FormFlow — Changelog

**Projeto:** FormFlow (Typeform Clone Self-Hosted)
**Método:** Synkra AIOS v4.2
**Início:** 2026-02-17
**Última Atualização:** 2026-02-17

---

## Convenções

- Cada entrada inclui: data, agente responsável, tipo (feat/fix/refactor/chore), descrição
- Referência a PRD/Stories quando aplicável
- Arquivos criados/modificados listados
- Decisões de design documentadas

---

## [Unreleased]

### 2026-02-17 — Sessão Inicial Completa

#### 🏗️ Epic 1: Fundação & Auth (CONCLUÍDO)
**Stories:** FF-001, FF-002, FF-003, FF-004
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | Setup projeto Next.js 15 + TypeScript + Tailwind CSS 4 + App Router | FF-001 |
| feat | Schema Prisma completo (User, Form, Field, Response, Tag, ResponseTag, TagRule, Webhook, WebhookLog, SheetsConfig) | FF-001 |
| feat | Singleton Prisma (`src/lib/prisma.ts`) | FF-001 |
| feat | Tipos TypeScript globais (`src/types/index.ts`) | FF-001 |
| feat | Auth com NextAuth.js v4 (Credentials + JWT) | FF-002 |
| feat | API de registro (`/api/register`) com bcrypt | FF-002 |
| feat | Middleware para proteção de rotas | FF-002 |
| feat | Páginas de Login e Registro | FF-002 |
| feat | SessionProvider wrapper | FF-002 |
| feat | Componentes UI base: Button, Input, Card, Modal | FF-002 |
| feat | Layout Dashboard com Sidebar + Topbar | FF-003 |
| feat | Sidebar responsiva (collapse mobile) | FF-003 |
| feat | CRUD de Formulários (criar, editar, duplicar, deletar) | FF-004 |
| feat | Dashboard com métricas e listagem | FF-004 |
| feat | FormCard com ações e status badge | FF-004 |
| feat | CreateFormModal | FF-004 |
| feat | Filtro por status e busca por título | FF-004 |

**Arquivos criados:**
- `formflow/package.json`, `prisma/schema.prisma`, `.env`
- `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/utils.ts`
- `src/types/index.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/register/route.ts`
- `src/app/api/forms/route.ts`, `src/app/api/forms/[id]/route.ts`
- `src/app/api/forms/[id]/duplicate/route.ts`
- `src/app/(auth)/layout.tsx`, `login/page.tsx`, `register/page.tsx`
- `src/app/(dashboard)/layout.tsx`, `page.tsx`
- `src/app/(dashboard)/forms/page.tsx`
- `src/components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx`
- `src/components/shared/Sidebar.tsx`, `Topbar.tsx`
- `src/components/forms/FormCard.tsx`, `CreateFormModal.tsx`
- `src/app/providers.tsx`, `middleware.ts`

---

#### 🧱 Epic 2: Form Builder (CONCLUÍDO)
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | Editor visual com drag-and-drop (@dnd-kit) | FR-002 |
| feat | FieldPalette — painel com tipos de campo categorizados | FR-002.2 |
| feat | BuilderCanvas — área de preview com DnD | FR-002.1 |
| feat | SortableFieldItem — campo arrastável com preview | FR-002.1 |
| feat | FieldEditor — edição de propriedades do campo selecionado | FR-002.3 |
| feat | Auto-save com debounce 3s | FR-002.9 |
| feat | Todos os tipos de campo implementados (17 tipos) | FR-003 |
| feat | Zustand store para builder (builder-store.ts) | FR-002 |
| feat | API de fields (CRUD + bulk update) | FR-002 |

**Arquivos criados:**
- `src/stores/builder-store.ts`
- `src/components/builder/FieldPalette.tsx`
- `src/components/builder/BuilderCanvas.tsx`
- `src/components/builder/SortableFieldItem.tsx`
- `src/components/builder/FieldEditor.tsx`
- `src/app/(dashboard)/forms/[id]/edit/page.tsx`
- `src/app/api/fields/route.ts`

---

#### 🎨 Epic 3: Experiência do Respondente (CONCLUÍDO)
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | FormRenderer — renderizador Typeform-style (uma pergunta por tela) | FR-004 |
| feat | QuestionScreen — componente individual por tipo de campo | FR-004 |
| feat | Transições com Framer Motion (slide/fade) | FR-004.8 |
| feat | Navegação teclado (Enter/Shift+Enter) e atalhos (A/B/C) | FR-004.2, FR-004.9 |
| feat | Barra de progresso visual | FR-004.3 |
| feat | URL pública por slug (`/f/[slug]`) | FR-004.6 |
| feat | API de submissão de respostas | FR-004 |

**Arquivos criados:**
- `src/components/renderer/FormRenderer.tsx`
- `src/components/renderer/QuestionScreen.tsx`
- `src/app/f/[slug]/page.tsx`
- `src/app/api/responses/route.ts`

---

#### 📊 Epic 4: Gestão de Respostas (CONCLUÍDO)
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | Página de respostas com tabela detalhada | FR-006.1 |
| feat | Visualização individual em slide-in panel | FR-006.2 |
| feat | Filtros por tag | FR-006.3 |
| feat | Busca por conteúdo de respostas | FR-006.3 |
| feat | Exportação CSV | FR-006.4 |
| feat | Delete individual e em lote | FR-006.5 |
| feat | Stats cards (total, hoje, completas, taxa, tempo médio) | FR-006.6 |
| feat | Gráficos com Recharts (linha, pizza, barra) | FR-006.7 |
| feat | Seleção múltipla com checkbox | FR-006.5 |

**Arquivos criados:**
- `src/app/(dashboard)/forms/[id]/responses/page.tsx`
- `src/components/responses/ResponseCharts.tsx`

---

#### 🏷️ Epic 5: Tags Automáticas (CONCLUÍDO)
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | CRUD API de tags (`/api/tags`, `/api/tags/[id]`) | FR-007.6 |
| feat | CRUD API de regras (`/api/tags/rules`) | FR-007.1 |
| feat | UI de gerenciamento de tags (cores, nomes) | FR-007.6 |
| feat | UI de criação de regras automáticas | FR-007.1 |
| feat | Visualização de tags nas respostas | FR-007.5 |
| feat | Filtro por tag na página de respostas | FR-007.5 |

**Arquivos criados:**
- `src/app/api/tags/route.ts`
- `src/app/api/tags/[id]/route.ts`
- `src/app/api/tags/rules/route.ts`

---

#### 🎨 Epic 6: Estilização de Formulários (CONCLUÍDO)
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | DesignEditor — painel de edição de tema | FR-005 |
| feat | Temas pré-definidos (Midnight, Ocean, Forest, Sunset, etc.) | FR-005.1 |
| feat | Color pickers para todas as cores | FR-005.2 |
| feat | Seletor de fontes | FR-005.4 |
| feat | Seletor de tamanho e arredondamento | FR-005 |
| feat | Background image URL | FR-005.3 |
| feat | Preview em tempo real no builder | FR-005.6 |
| feat | Persistência de tema no banco (campo `theme` no Form) | FR-005 |

**Arquivos criados:**
- `src/components/builder/DesignEditor.tsx`
- Constantes `THEME_PRESETS`, `FONT_OPTIONS`, `DEFAULT_THEME` em `src/types/index.ts`

---

#### 🔗 Epic 7: Integrações (PARCIAL)
**Agente:** @dev (Dex)

| Tipo | Descrição | Ref |
|------|-----------|-----|
| feat | Webhooks — config URL e headers por formulário | FR-010 |
| feat | API de integrações (`/api/integrations`) | FR-010 |
| feat | Tipo de campo Calendly (embed URL) | FR-009 |
| pending | Google Sheets OAuth + sync | FR-008 |

**Arquivos criados:**
- `src/app/api/integrations/route.ts`

---

#### 🎯 UI/UX Overhaul — Typeform-Inspired (CONCLUÍDO)
**Agente:** @dev (Dex)
**Motivação:** Solicitação do usuário para que UI e funcionalidades fiquem exatamente como o Typeform

| Tipo | Descrição |
|------|-----------|
| refactor | Migração de tema escuro para tema claro (Typeform-inspired) |
| refactor | Redesign completo do `globals.css` com nova paleta de cores |
| refactor | Redesign Sidebar — navegação limpa, sem elementos decorativos |
| refactor | Redesign Topbar — dropdown minimalista |
| refactor | Redesign Dashboard — workspace view com search/sort/toggle list-grid |
| refactor | Redesign FormsPage — filtros por status, view toggle |
| refactor | Redesign FormCard — suporte list/grid mode |
| refactor | Redesign Editor — tabs Content/Design/Share/Results, breadcrumbs |
| refactor | Redesign FieldPalette — modal de adicionar campo com categorias |
| refactor | Redesign BuilderCanvas — preview com tema aplicado |
| refactor | Redesign SortableFieldItem — visual Typeform com tema dinâmico |
| refactor | Redesign FieldEditor — propriedades com toggle customizado |
| refactor | Redesign ResponsesPage — tabs Resumo/Respostas, stats cards |
| refactor | Redesign SettingsPage — cards organizados por seção |
| refactor | Redesign FormSettings — Share/Welcome/ThankYou/Tags/Rules/Webhook |
| refactor | Redesign Auth pages — tema claro, centralizado |
| refactor | UI components atualizados: Button, Card, Input, Modal |

**Decisões de design:**
- Paleta: background `#ffffff`, foreground `#191919`, accent `#b16cff`
- Fonte: Inter (system-ui fallback)
- Scrollbar thin e sutil
- Animações: fadeIn, slideIn, scaleIn com 0.2-0.25s ease-out
- Sem sombras pesadas, borders sutis (`#e1e1e1`)

---

#### 🧹 Limpeza — Remoção de Elementos Decorativos (CONCLUÍDO)
**Agente:** @dev (Dex)
**Motivação:** Solicitação do usuário para remover botões visíveis sem funcionalidade

| Tipo | Descrição | Arquivo |
|------|-----------|---------|
| fix | Remoção de "AI Insights" (eram cálculos frontend, não IA real) | responses/page.tsx |
| fix | Remoção da busca fake do Sidebar | Sidebar.tsx |
| fix | Remoção da seção "Workspaces" (botão +, Meu workspace) | Sidebar.tsx |
| fix | Remoção do ícone de notificação (sino) do Topbar | Topbar.tsx |
| fix | Remoção dos botões "Perfil" e "Configurações" do dropdown Topbar | Topbar.tsx |
| fix | Remoção de "Enviar por email", "Incorporar", "QR Code" do Share | settings/page.tsx |
| fix | Substituição de `<button>` por `<span>` na preview welcome screen | settings/page.tsx |
| fix | Remoção de GripVertical decorativo no FieldPalette | FieldPalette.tsx |
| fix | Substituição de tab-button fake por `<span>` no modal de campos | FieldPalette.tsx |

---

#### ✅ Validações de Campos (CONCLUÍDO)
**Agente:** @dev (Dex)
**Motivação:** Solicitação do usuário para validações de email, telefone, URL e outros formatos em campos específicos

| Tipo | Descrição | Arquivo |
|------|-----------|---------|
| feat | Engine de validações compartilhada (frontend + backend) | `src/lib/validators.ts` |
| feat | Validação automática de email (regex) | validators.ts |
| feat | Validação automática de telefone (regex + máscara BR) | validators.ts |
| feat | Validação automática de URL (regex) | validators.ts |
| feat | Validação de CPF e CNPJ (regex) | validators.ts |
| feat | Validação de min/max caracteres para textos | validators.ts |
| feat | Formato especial configurável em short_text/long_text (email, phone, url, cpf, cnpj) | validators.ts |
| feat | Seção "Validações" no FieldEditor do builder | FieldEditor.tsx |
| feat | Erro visual em tempo real no QuestionScreen (borda vermelha + mensagem) | QuestionScreen.tsx |
| feat | Validação no FormRenderer antes de avançar/enviar | FormRenderer.tsx |
| feat | Validação server-side na API de respostas (422 com detalhes por campo) | `api/responses/route.ts` |
| feat | Máscara de telefone automática no formulário público | QuestionScreen.tsx |
| feat | Contador de caracteres quando maxLength definido | QuestionScreen.tsx |
| feat | Mensagens de erro customizáveis por campo no builder | FieldEditor.tsx |

**Decisões técnicas:**
- Validações automáticas por tipo: `email`, `phone`, `url` sempre validam formato
- Campos `short_text`/`long_text` podem ter formato especial (email, phone, url, cpf, cnpj) configurável
- Validação dupla: frontend (UX) + backend (segurança)
- API retorna 422 com array `validationErrors` contendo `fieldId`, `field` (título) e `error`
- Erro limpa automaticamente quando o usuário digita

---

#### 🐛 Bug Fixes

| Tipo | Descrição | Causa Raiz |
|------|-----------|------------|
| fix | Campos do form builder não apareciam ao criar formulário | z-index: FieldPalette ficava atrás do Sidebar (`z-50`). Fix: `z-[60]` no editor |
| fix | Menu de opções do FormCard ficava oculto/cortado | `overflow-hidden` no container pai cortava o dropdown. Fix: removido `overflow-hidden`, adicionado `first:rounded-t-xl last:rounded-b-xl` nos itens |

---

## Padrões e Convenções do Projeto

### Stack Técnica
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript (strict)
- **CSS:** Tailwind CSS 4 (CSS variables via `@theme inline`)
- **State:** Zustand (builder-store)
- **DB:** SQLite via Prisma ORM
- **Auth:** NextAuth.js v4 (JWT)
- **Animações:** Framer Motion
- **DnD:** @dnd-kit/core + sortable
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Validação:** Zod

### Estrutura de Pastas
```
formflow/src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Dashboard, Forms, Settings
│   ├── api/             # API Routes
│   └── f/[slug]/        # Formulário público
├── components/
│   ├── builder/         # Editor visual
│   ├── forms/           # FormCard, CreateFormModal
│   ├── renderer/        # Typeform-style renderer
│   ├── responses/       # Gráficos de respostas
│   ├── shared/          # Sidebar, Topbar
│   └── ui/              # Button, Card, Input, Modal
├── lib/                 # prisma, auth, utils
├── stores/              # Zustand stores
└── types/               # Tipos globais, constantes
```

### Design System
- **Tema:** Light (Typeform-inspired)
- **Primary:** `#191919` (preto suave)
- **Accent:** `#b16cff` (roxo)
- **Success:** `#2eb67d`, Warning: `#f2a900`, Danger: `#e5484d`
- **Border:** `#e1e1e1`
- **Font:** Inter, system-ui

### Princípios Seguidos
1. Apenas botões/elementos com funcionalidade real no UI
2. Auto-save no editor (debounce 3s)
3. Imports absolutos com `@/`
4. APIs RESTful em `/api/`
5. Componentes reutilizáveis em `/components/ui/`

---

*Changelog mantido pela equipe AIOS — FormFlow v1.0*
