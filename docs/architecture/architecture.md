# FormFlow — Documento de Arquitetura

**Versão:** 1.0.0
**Data:** 2026-02-17
**Autor:** @architect (Aria)
**PRD Ref:** FormFlow PRD v1.0.0

---

## 1. Tech Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Framework** | Next.js 15 (App Router) | SSR, API Routes, performance, DX excelente |
| **Linguagem** | TypeScript (strict) | Type safety em todo o projeto |
| **Estilização** | Tailwind CSS 4 | Utility-first, responsivo, rápido |
| **Animações** | Framer Motion | Transições Typeform-style suaves |
| **Drag & Drop** | @dnd-kit/core + sortable | DnD acessível, performante, React-friendly |
| **Estado** | Zustand | Estado complexo do form builder sem boilerplate |
| **Banco de Dados** | PostgreSQL via Prisma | Robusto, JSON fields para config de campos |
| **Auth** | NextAuth.js v4 (Credentials) | Sessão JWT, proteção de rotas |
| **Validação** | Zod | Schema validation end-to-end |
| **Ícones** | Lucide React | Ícones modernos, tree-shakeable |
| **Charts** | Recharts | Gráficos de respostas leves |
| **File Upload** | Upload local + presigned S3 (futuro) | Simples para v1, escalável |
| **Webhook** | Fetch nativo + retry queue | Simples, sem dependência |
| **Google Sheets** | googleapis SDK | API oficial do Google |
| **Calendly** | Embed via iframe | Widget oficial do Calendly |

> **Nota:** Para o MVP usaremos SQLite via Prisma (zero config), migrando para PostgreSQL quando necessário.

---

## 2. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Auth    │ │ Dashboard│ │   Form Builder    │ │
│  │  Pages   │ │  + CRUD  │ │  (DnD + Preview)  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────────────┐ ┌──────────────────────┐   │
│  │ Response Viewer  │ │  Form Renderer       │   │
│  │ (Dashboard)      │ │  (Typeform-style)    │   │
│  └──────────────────┘ └──────────────────────┘   │
├─────────────────────────────────────────────────┤
│                   API LAYER                      │
│  /api/auth/*    /api/forms/*   /api/responses/*  │
│  /api/tags/*    /api/integrations/*   /api/import │
├─────────────────────────────────────────────────┤
│                   SERVICES                       │
│  FormEngine │ TagEngine │ WebhookService │ Sheets │
├─────────────────────────────────────────────────┤
│                   DATABASE                       │
│  User │ Form │ Field │ Response │ Tag │ Webhook  │
└─────────────────────────────────────────────────┘
```

---

## 3. Estrutura do Projeto

```
formflow/
├── prisma/
│   ├── schema.prisma           # Schema do banco de dados
│   └── migrations/
├── public/
│   └── uploads/                # Uploads de arquivos (v1 local)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Route group: login/register
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/        # Route group: área autenticada
│   │   │   ├── layout.tsx      # Layout com sidebar
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   ├── forms/
│   │   │   │   ├── page.tsx    # Lista de formulários
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx    # Form builder
│   │   │   │       ├── responses/page.tsx # Respostas
│   │   │   │       └── settings/page.tsx  # Config do form
│   │   │   └── settings/
│   │   │       └── page.tsx    # Config da conta
│   │   ├── f/[slug]/           # Formulário público (respondente)
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── forms/          # CRUD de formulários
│   │   │   ├── fields/         # CRUD de campos
│   │   │   ├── responses/      # Submissão + listagem
│   │   │   ├── tags/           # CRUD de tags + regras
│   │   │   ├── integrations/   # Sheets, Calendly, Webhooks
│   │   │   └── import/         # Import do Typeform
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Componentes base (Button, Input, etc.)
│   │   ├── builder/            # Componentes do form builder
│   │   │   ├── BuilderCanvas.tsx
│   │   │   ├── FieldPalette.tsx
│   │   │   ├── FieldEditor.tsx
│   │   │   ├── LogicEditor.tsx
│   │   │   └── fields/         # Cada tipo de campo no builder
│   │   ├── renderer/           # Componentes do formulário público
│   │   │   ├── FormRenderer.tsx
│   │   │   ├── QuestionScreen.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── fields/         # Cada tipo de campo no renderer
│   │   ├── responses/          # Componentes de respostas
│   │   └── shared/             # Navbar, Sidebar, etc.
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── form-engine.ts      # Motor de formulário (lógica, validação)
│   │   ├── tag-engine.ts       # Motor de tags automáticas
│   │   ├── webhook-service.ts  # Disparo de webhooks
│   │   ├── sheets-service.ts   # Google Sheets sync
│   │   ├── typeform-import.ts  # Parser de import
│   │   └── validators.ts       # Schemas Zod
│   ├── stores/
│   │   └── builder-store.ts    # Zustand store do form builder
│   └── types/
│       └── index.ts            # Tipos TypeScript globais
├── .env
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Modelo de Dados

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  forms     Form[]
}

model Form {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  title        String
  description  String?
  slug         String        @unique
  status       FormStatus    @default(DRAFT)
  theme        Json?         // cores, fonte, background
  welcomeScreen Json?        // título, descrição, botão
  thankYouScreen Json?       // título, descrição, redirect
  settings     Json?         // rate limit, close date, etc.
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  fields       Field[]
  responses    Response[]
  tagRules     TagRule[]
  webhooks     Webhook[]
  sheetsConfig SheetsConfig?
}

enum FormStatus {
  DRAFT
  PUBLISHED
  CLOSED
}

model Field {
  id           String   @id @default(cuid())
  formId       String
  form         Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  type         String   // short_text, long_text, multiple_choice, etc.
  title        String
  description  String?
  required     Boolean  @default(false)
  order        Int
  properties   Json?    // choices, min, max, placeholder, etc.
  validations  Json?    // rules de validação
  logic        Json?    // lógica condicional (if/then/jump)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Response {
  id          String   @id @default(cuid())
  formId      String
  form        Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  answers     Json     // { fieldId: value }
  metadata    Json?    // IP, user agent, duration, etc.
  completedAt DateTime?
  tags        ResponseTag[]
  createdAt   DateTime @default(now())
}

model Tag {
  id        String       @id @default(cuid())
  name      String
  color     String       @default("#6366f1")
  responses ResponseTag[]
  rules     TagRule[]
}

model ResponseTag {
  id         String   @id @default(cuid())
  responseId String
  response   Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  tagId      String
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@unique([responseId, tagId])
}

model TagRule {
  id        String @id @default(cuid())
  formId    String
  form      Form   @relation(fields: [formId], references: [id], onDelete: Cascade)
  tagId     String
  tag       Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  fieldId   String // qual campo avaliar
  operator  String // equals, contains, gt, lt, empty, not_empty
  value     String // valor para comparar
  active    Boolean @default(true)
}

model Webhook {
  id        String       @id @default(cuid())
  formId    String
  form      Form         @relation(fields: [formId], references: [id], onDelete: Cascade)
  url       String
  headers   Json?        // headers customizados
  active    Boolean      @default(true)
  logs      WebhookLog[]
}

model WebhookLog {
  id         String   @id @default(cuid())
  webhookId  String
  webhook    Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  status     Int      // HTTP status code
  success    Boolean
  payload    Json?
  response   String?
  attempt    Int      @default(1)
  createdAt  DateTime @default(now())
}

model SheetsConfig {
  id            String @id @default(cuid())
  formId        String @unique
  form          Form   @relation(fields: [formId], references: [id], onDelete: Cascade)
  spreadsheetId String
  sheetName     String
  columnMapping Json   // { fieldId: columnLetter }
  accessToken   String
  refreshToken  String
}
```

---

## 5. Decisões de Arquitetura (ADRs)

### ADR-001: Campos como JSON flexível
**Decisão:** Propriedades de campos (`properties`, `validations`, `logic`) armazenados como JSON ao invés de tabelas separadas.
**Rationale:** 17 tipos de campo têm propriedades muito diferentes. JSON permite flexibilidade sem migrations constantes.
**Trade-off:** Sem type safety no banco, compensado com validação Zod na aplicação.

### ADR-002: Zustand para estado do builder
**Decisão:** Usar Zustand ao invés de Context/useReducer para o form builder.
**Rationale:** O builder tem estado complexo (campos, drag-and-drop, undo/redo, preview sync). Zustand é mais performante e tem devtools.

### ADR-003: SQLite para MVP, PostgreSQL ready
**Decisão:** Iniciar com SQLite para zero-config, schema Prisma compatível com PostgreSQL.
**Rationale:** Reduz fricção de setup. Migração é só trocar o provider e DATABASE_URL.

### ADR-004: Formulário público em rota separada
**Decisão:** Formulários públicos em `/f/[slug]` sem layout do dashboard.
**Rationale:** Respondentes não devem ver sidebar, navbar ou qualquer elemento da plataforma. Layout limpo e focado.

---

## 6. Design System

### Paleta de Cores
- **Primary:** Indigo (#6366F1) — ações e brand
- **Secondary:** Slate (#334155) — backgrounds e cards
- **Success:** Emerald (#10B981)
- **Warning:** Amber (#F59E0B)
- **Danger:** Rose (#F43F5E)
- **Background:** Slate-950 (#020617) — tema escuro
- **Surface:** Slate-900 (#0F172A) — cards e painéis

### Tipografia
- **UI:** Inter (Google Fonts)
- **Formulário (default):** Inter
- **Opções do usuário:** Qualquer Google Font

---

*Documento gerado pelo @architect Aria — Synkra AIOS v4.2*
*— Aria, arquitetando o futuro 🏗️*
