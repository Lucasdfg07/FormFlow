# Epic 1: Fundação & Auth

> **PRD Ref:** FormFlow PRD v1.0.0
> **Prioridade:** P0 (Must Have — MVP)
> **Requisitos:** FR-001, FR-012, NFR-001, NFR-003, NFR-005

---

## Escopo do Épico

Setup completo do projeto, sistema de autenticação, banco de dados com todos os modelos core, layout base da aplicação, e gestão de múltiplos formulários (CRUD).

## Requisitos Cobertos

### FR-001: Autenticação
- FR-001.1: Login com email/senha
- FR-001.2: Sessão persistente via JWT
- FR-001.3: Tela de login com proteção de rotas
- FR-001.4: Logout funcional

### FR-012: Múltiplos Formulários
- FR-012.1: Dashboard com lista de todos os formulários
- FR-012.2: Criar, duplicar, arquivar, deletar formulários
- FR-012.3: Status por formulário: Rascunho, Publicado, Fechado
- FR-012.4: Métricas rápidas por formulário
- FR-012.5: Busca/filtro de formulários

## Acceptance Criteria (Épico)

- [ ] Projeto criado com Next.js, TypeScript, Tailwind, Prisma
- [ ] Banco de dados com schema completo (User, Form, Field, Response, etc.)
- [ ] Login/logout funcionando com sessão persistente
- [ ] Rotas protegidas (redirect para login se não autenticado)
- [ ] Dashboard listando formulários com busca e filtros
- [ ] CRUD completo de formulários (criar, editar nome, duplicar, deletar)
- [ ] Status de formulário (Draft, Published, Closed)
- [ ] Layout base: sidebar + topbar + content area

## Stories Estimadas

- Story 1.1: Setup do projeto + schema do banco
- Story 1.2: Sistema de autenticação
- Story 1.3: Layout base + navegação
- Story 1.4: CRUD de formulários + dashboard
