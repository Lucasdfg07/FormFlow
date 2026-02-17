# FormFlow — Estado Atual do Projeto

> **Última atualização:** 2026-02-17
> **Atualizado por:** @dev (Dex)
> **Versão:** 1.0.0-dev

---

## 📍 Visão Geral Rápida

| Item | Status |
|------|--------|
| **Fase atual** | Desenvolvimento (Pós-MVP) |
| **Build** | ✅ Funcional |
| **Dev server** | ✅ `npm run dev` roda sem erros |
| **Tema** | Light (Typeform-inspired) |
| **DB** | SQLite via Prisma |
| **Auth** | NextAuth.js v4 (JWT) |
| **Deploy** | ❌ Não configurado ainda |

---

## 📊 Status dos Epics

| Epic | Nome | Status | Progresso | Notas |
|------|------|--------|-----------|-------|
| 1 | Fundação & Auth | ✅ Concluído | 100% | Setup, auth, layout, CRUD forms |
| 2 | Form Builder | ✅ Concluído | 95% | DnD editor, 17 tipos de campo. Falta: lógica condicional (FR-002.6) |
| 3 | Experiência Respondente | ✅ Concluído | 100% | Typeform-style renderer, Framer Motion |
| 4 | Gestão de Respostas | ✅ Concluído | 100% | Tabela, gráficos, filtros, export, delete |
| 5 | Tags Automáticas | ✅ Concluído | 100% | CRUD tags/rules, filtro, UI completa |
| 6 | Estilização | ✅ Concluído | 100% | DesignEditor, temas, preview real-time |
| 7 | Integrações | 🔶 Parcial | 40% | Webhooks OK, Calendly tipo OK. Falta: Google Sheets, retry webhook |
| 8 | Importação Typeform | ⏳ Não iniciado | 0% | CSV import, API import |

---

## 🏗️ O que está implementado

### Funcionalidades Core
- ✅ Autenticação (login/registro/logout/middleware)
- ✅ CRUD de formulários (criar, editar, duplicar, deletar)
- ✅ Form Builder drag-and-drop com 17 tipos de campo
- ✅ Auto-save (debounce 3s)
- ✅ Renderizador Typeform-style (uma pergunta por tela)
- ✅ Transições animadas (Framer Motion)
- ✅ Navegação por teclado (Enter/Shift+Enter/A/B/C)
- ✅ URL pública por slug (`/f/[slug]`)
- ✅ Dashboard com métricas e listagem
- ✅ Gestão de respostas (tabela, filtros, busca, export CSV, delete)
- ✅ Gráficos de respostas (Recharts)
- ✅ Tags automáticas (CRUD + regras + filtro)
- ✅ Design Editor (cores, fontes, temas, preview)
- ✅ Webhooks (config URL + headers)
- ✅ Validações de campos (email, phone, URL, CPF, CNPJ, min/max length)
- ✅ Validação dupla: frontend + server-side (API 422)
- ✅ Máscara automática de telefone BR
- ✅ Mensagens de erro customizáveis no builder

### UI/UX
- ✅ Tema claro Typeform-inspired
- ✅ Sidebar limpa (Dashboard, Formulários, Configurações)
- ✅ Topbar minimalista (avatar + dropdown com logout)
- ✅ View toggle lista/grid nos formulários
- ✅ Busca e filtros em todas as listagens
- ✅ Slide-in panel para detalhes de resposta
- ✅ Tabs no editor (Content, Design, Share, Results)
- ✅ Todos os botões têm funcionalidade real (sem decorativos)

---

## ❌ O que NÃO está implementado

### Funcionalidades Pendentes
- ⏳ **Lógica condicional** (FR-002.6): Se resposta X → pular para Y
- ⏳ **Google Sheets integration** (FR-008): OAuth + sync
- ⏳ **Webhook retry** (FR-010.4/5): Auto-retry + logs
- ⏳ **Importação Typeform** (FR-011): CSV e API
- ⏳ **Upload de arquivo** (FR-003.13): No campo de tipo upload
- ⏳ **Assinatura** (FR-003.15): Campo de desenho
- ⏳ **Grupo de perguntas** (FR-003.17): Question Group

### Infraestrutura Pendente
- ⏳ Testes automatizados
- ⏳ Docker para deploy
- ⏳ Rate limiting nas APIs públicas
- ⏳ CSRF protection

---

## 🎨 Design System Atual

```
Cores:
  --background: #ffffff
  --foreground: #191919
  --accent: #b16cff
  --success: #2eb67d
  --warning: #f2a900
  --danger: #e5484d
  --border: #e1e1e1
  --muted: #8c8c8c

Fonte: Inter, system-ui, sans-serif
Roundness: 8px (padrão)
Animações: 0.2-0.25s ease-out
```

---

## 📁 Estrutura de Pastas

```
formflow/src/
├── app/
│   ├── (auth)/                    # Login, Register
│   ├── (dashboard)/               # Dashboard, Forms, Settings
│   │   ├── page.tsx               # Dashboard principal
│   │   ├── forms/
│   │   │   ├── page.tsx           # Lista de formulários
│   │   │   └── [id]/
│   │   │       ├── edit/page.tsx  # Editor do formulário
│   │   │       ├── responses/page.tsx  # Respostas
│   │   │       └── settings/page.tsx   # Config do formulário
│   │   └── settings/page.tsx      # Config global
│   ├── api/
│   │   ├── auth/                  # NextAuth
│   │   ├── register/              # Registro
│   │   ├── forms/                 # CRUD forms
│   │   ├── fields/                # CRUD fields
│   │   ├── responses/             # CRUD responses
│   │   ├── tags/                  # CRUD tags + rules
│   │   └── integrations/          # Webhooks
│   └── f/[slug]/                  # Formulário público
├── components/
│   ├── builder/                   # FieldPalette, BuilderCanvas, SortableFieldItem, FieldEditor, DesignEditor
│   ├── forms/                     # FormCard, CreateFormModal
│   ├── renderer/                  # FormRenderer, QuestionScreen
│   ├── responses/                 # ResponseCharts
│   ├── shared/                    # Sidebar, Topbar
│   └── ui/                        # Button, Card, Input, Modal
├── lib/                           # prisma.ts, auth.ts, utils.ts, validators.ts
├── stores/                        # builder-store.ts (Zustand)
└── types/                         # index.ts (tipos, constantes, temas)
```

---

## 🔑 Decisões Técnicas Importantes

| Decisão | Justificativa | Data |
|---------|---------------|------|
| SQLite em vez de PostgreSQL | Self-hosted, deploy simples. Migrável via Prisma | 2026-02-17 |
| Tema claro Typeform-inspired | Solicitação explícita do usuário | 2026-02-17 |
| Zustand para state management | Performance, menos boilerplate | 2026-02-17 |
| CSS variables via @theme inline | Flexibilidade para temas dinâmicos | 2026-02-17 |
| Sem botões decorativos | Princípio: só mostrar o que funciona | 2026-02-17 |
| Auto-save debounce 3s | UX fluida, sem botão "salvar" manual | 2026-02-17 |
| Validação dupla (frontend+backend) | Frontend para UX, backend para segurança | 2026-02-17 |
| Validações automáticas por tipo de campo | email/phone/url sempre validam formato sem config manual | 2026-02-17 |

---

## 📝 Convenções de Código

1. **Imports:** Absolutos com `@/` (nunca `../../`)
2. **Components:** PascalCase, um componente por arquivo
3. **APIs:** RESTful em `src/app/api/`, métodos GET/POST/PATCH/DELETE
4. **CSS:** Tailwind classes, CSS variables para temas
5. **State:** Zustand stores em `src/stores/`
6. **Types:** Tipos globais em `src/types/index.ts`
7. **Idioma UI:** Português (BR)
8. **Idioma código:** Inglês (variáveis, funções)

---

## 🔗 Documentação Relacionada

| Documento | Caminho |
|-----------|---------|
| PRD | `docs/prd/prd.md` |
| Architecture | `docs/architecture/architecture.md` |
| Stories Epic 1 | `docs/stories/epic-1-stories.md` |
| Changelog | `docs/changelog/CHANGELOG.md` |
| Session Logs | `docs/changelog/sessions/` |
| AIOS Constitution | `.aios-core/constitution.md` |
| Cursor Rules | `.cursor/rules/aios-rules.mdc` |

---

*Estado atualizado pelo @dev — Synkra AIOS v4.2*
*Próxima revisão: ao iniciar nova sessão de desenvolvimento*
