# FormFlow — Product Requirements Document (PRD)

**Versão:** 1.0.0
**Status:** Draft
**Data:** 2026-02-17
**Autor:** @pm (Morgan)
**Método:** AIOS Elicitation-Driven

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-02-17 | 1.0.0 | PRD inicial baseado em elicitation | @pm Morgan |

---

## 1. Goals & Background Context

### 1.1 Goals

- Criar uma alternativa própria ao Typeform, eliminando custos de assinatura
- Plataforma de formulários dinâmicos com experiência "uma pergunta por tela" e transições suaves
- Permitir importação completa de dados existentes do Typeform (respostas, formulários, lógica, temas)
- Oferecer integrações nativas com Calendly, Google Sheets e Webhooks
- Sistema de tags automáticas para categorização inteligente de respostas
- Formulários altamente estilizáveis com identidade visual customizável

### 1.2 Background Context

O Typeform é referência em formulários interativos com sua UX de uma pergunta por tela, mas seus planos são caros para uso individual/empresarial recorrente. O FormFlow resolve isso sendo uma plataforma self-hosted que replica a experiência completa do Typeform, com o diferencial de integrações nativas (Calendly inline, Google Sheets sync, webhooks universais) e tags automáticas baseadas em regras para classificação de respostas.

O público-alvo são empresas e times que coletam dados de clientes, onde formulários bonitos e inteligentes impactam diretamente a taxa de conversão e a qualidade dos dados coletados.

### 1.3 Non-Goals (Fora do Escopo)

- **NÃO** será multi-tenant/SaaS (é single-user/self-hosted)
- **NÃO** terá sistema de pagamentos dentro dos formulários (v1)
- **NÃO** terá colaboração em tempo real entre múltiplos editores
- **NÃO** terá app mobile nativo (responsivo web apenas)
- **NÃO** terá AI para gerar formulários automaticamente (v1)

---

## 2. User Stories

### US-001: Criador de Formulários
**Como** proprietário da plataforma,
**Eu quero** criar formulários dinâmicos com uma experiência drag-and-drop,
**Para que** eu consiga montar formulários profissionais rapidamente.
**Prioridade:** P0

### US-002: Respondente de Formulário
**Como** respondente (pessoa que recebe o form),
**Eu quero** responder formulários bonitos com uma pergunta por tela e transições suaves,
**Para que** a experiência seja agradável e eu complete o formulário.
**Prioridade:** P0

### US-003: Analista de Respostas
**Como** proprietário da plataforma,
**Eu quero** visualizar, filtrar e tagear automaticamente as respostas,
**Para que** eu consiga analisar os dados coletados de forma eficiente.
**Prioridade:** P0

### US-004: Integrador
**Como** proprietário da plataforma,
**Eu quero** que respostas sincronizem automaticamente com Google Sheets e disparem webhooks,
**Para que** meus workflows externos sejam alimentados automaticamente.
**Prioridade:** P1

### US-005: Migrador do Typeform
**Como** ex-usuário do Typeform,
**Eu quero** importar todos os meus formulários e respostas existentes,
**Para que** eu não perca nenhum dado na migração.
**Prioridade:** P1

---

## 3. Functional Requirements

### FR-001: Autenticação (P0)
- **FR-001.1:** Login com email/senha
- **FR-001.2:** Sessão persistente via JWT
- **FR-001.3:** Tela de login com proteção de rotas
- **FR-001.4:** Logout funcional

### FR-002: Form Builder — Editor Visual (P0)
- **FR-002.1:** Interface drag-and-drop para ordenar perguntas
- **FR-002.2:** Painel lateral com tipos de campo disponíveis
- **FR-002.3:** Edição inline de cada pergunta (título, descrição, placeholder, obrigatoriedade)
- **FR-002.4:** Preview em tempo real do formulário
- **FR-002.5:** Duplicar/deletar perguntas
- **FR-002.6:** Configuração de lógica condicional (se resposta X → pular para Y)
- **FR-002.7:** Tela de boas-vindas (Welcome Screen) customizável
- **FR-002.8:** Tela de agradecimento (Thank You Screen) customizável
- **FR-002.9:** Salvar rascunho automaticamente

### FR-003: Tipos de Campo (P0)
- **FR-003.1:** Texto curto (Short Text)
- **FR-003.2:** Texto longo (Long Text)
- **FR-003.3:** Múltipla escolha (Multiple Choice) — single select
- **FR-003.4:** Checkbox (Multiple Choice) — multi select
- **FR-003.5:** Dropdown / Select
- **FR-003.6:** Escala / Rating (estrelas, 1-10)
- **FR-003.7:** NPS (Net Promoter Score, 0-10)
- **FR-003.8:** Sim / Não (Yes/No)
- **FR-003.9:** Data (Date Picker)
- **FR-003.10:** Email (com validação)
- **FR-003.11:** Telefone (com máscara)
- **FR-003.12:** URL (com validação)
- **FR-003.13:** Upload de arquivo (imagem, PDF, doc)
- **FR-003.14:** Matriz / Tabela (linhas x colunas)
- **FR-003.15:** Assinatura (campo de desenho)
- **FR-003.16:** Statement (texto informativo, sem input)
- **FR-003.17:** Grupo de perguntas (Question Group)

### FR-004: Experiência do Respondente — Typeform-Style (P0)
- **FR-004.1:** Uma pergunta por tela com transição suave (slide/fade)
- **FR-004.2:** Navegação por teclado (Enter = próxima, Shift+Enter = anterior)
- **FR-004.3:** Barra de progresso visual
- **FR-004.4:** Validação em tempo real com feedback visual
- **FR-004.5:** Responsivo para mobile e desktop
- **FR-004.6:** URL pública compartilhável para cada formulário
- **FR-004.7:** Suporte a lógica condicional (saltos de perguntas)
- **FR-004.8:** Animações de transição entre perguntas (Framer Motion)
- **FR-004.9:** Atalhos de teclado (A/B/C para múltipla escolha)

### FR-005: Estilização de Formulários (P1)
- **FR-005.1:** Temas pré-definidos (Light, Dark, Colorful, Minimal)
- **FR-005.2:** Customização de cores (fundo, texto, botões, acentos)
- **FR-005.3:** Upload de logo/imagem de fundo
- **FR-005.4:** Customização de fontes (Google Fonts)
- **FR-005.5:** CSS customizado (modo avançado)
- **FR-005.6:** Preview do tema em tempo real no builder

### FR-006: Gestão de Respostas (P0)
- **FR-006.1:** Dashboard com lista de respostas por formulário
- **FR-006.2:** Visualização individual de cada resposta completa
- **FR-006.3:** Filtros por data, status, tags
- **FR-006.4:** Exportação para CSV/Excel
- **FR-006.5:** Deletar respostas individuais ou em lote
- **FR-006.6:** Contadores e estatísticas resumidas (total, hoje, taxa de conclusão)
- **FR-006.7:** Gráficos básicos de distribuição por campo

### FR-007: Tags Automáticas (P1)
- **FR-007.1:** Criar regras de tag: "Se campo X [operador] [valor] → aplicar tag Y"
- **FR-007.2:** Operadores: igual, contém, maior que, menor que, está vazio, não está vazio
- **FR-007.3:** Múltiplas regras por formulário
- **FR-007.4:** Tags aplicadas automaticamente quando resposta é recebida
- **FR-007.5:** Visualização de tags nas respostas e filtros por tag
- **FR-007.6:** Gerenciar tags (criar, editar cor, deletar)

### FR-008: Integração — Google Sheets (P1)
- **FR-008.1:** Conectar conta Google via OAuth
- **FR-008.2:** Selecionar/criar planilha destino por formulário
- **FR-008.3:** Cada nova resposta insere automaticamente nova linha
- **FR-008.4:** Mapeamento de campos do form → colunas da planilha
- **FR-008.5:** Sync manual (re-enviar todas as respostas)

### FR-009: Integração — Calendly (P1)
- **FR-009.1:** Configurar link do Calendly por formulário
- **FR-009.2:** Tipo de campo especial "Calendly Embed" que mostra widget de agendamento inline
- **FR-009.3:** Resposta armazena o link do evento agendado
- **FR-009.4:** Fallback para link direto se embed não carregar

### FR-010: Integração — Webhooks (P1)
- **FR-010.1:** Configurar URL de webhook por formulário
- **FR-010.2:** Enviar payload JSON com dados da resposta quando submetida
- **FR-010.3:** Headers customizáveis (auth tokens, content-type)
- **FR-010.4:** Log de envios (sucesso/falha, timestamp, status code)
- **FR-010.5:** Retry automático em caso de falha (até 3 tentativas)
- **FR-010.6:** Compatibilidade com Zapier/Make/n8n

### FR-011: Importação do Typeform (P2)
- **FR-011.1:** Importar respostas via CSV exportado do Typeform
- **FR-011.2:** Importar estrutura de formulário via API do Typeform (token)
- **FR-011.3:** Mapear tipos de campo do Typeform → FormFlow
- **FR-011.4:** Importar lógica condicional quando possível
- **FR-011.5:** Importar tema/cores do formulário original
- **FR-011.6:** Relatório pós-importação (o que foi importado, o que falhou)

### FR-012: Múltiplos Formulários (P0)
- **FR-012.1:** Dashboard com lista de todos os formulários
- **FR-012.2:** Criar, duplicar, arquivar, deletar formulários
- **FR-012.3:** Status por formulário: Rascunho, Publicado, Fechado
- **FR-012.4:** Métricas rápidas por formulário (respostas, taxa de conclusão)
- **FR-012.5:** Busca/filtro de formulários

---

## 4. Non-Functional Requirements

### NFR-001: Performance
- Transições entre perguntas em < 100ms
- Carregamento do formulário público em < 2s
- Dashboard com até 10.000 respostas sem degradar
- Form builder responsivo mesmo com 50+ perguntas

### NFR-002: UX/UI
- Design system consistente (tema escuro profissional como padrão)
- Experiência de resposta idêntica ao Typeform (uma pergunta por tela)
- Form builder intuitivo sem curva de aprendizado
- Totalmente responsivo (mobile-first para respondentes)

### NFR-003: Segurança
- Senhas hasheadas (bcrypt)
- CSRF protection
- Rate limiting nas APIs públicas de submissão
- Sanitização de inputs (XSS prevention)
- Upload com validação de tipo e tamanho

### NFR-004: Confiabilidade
- Respostas nunca podem ser perdidas (save em cada etapa)
- Webhooks com retry automático
- Auto-save no form builder

### NFR-005: Manutenibilidade
- Código TypeScript com tipagem estrita
- Arquitetura modular (cada tipo de campo é um componente isolado)
- Testes para lógica crítica (engine de formulário, tags, integrações)

---

## 5. Épicos

### Epic 1: Fundação & Auth (P0)
Setup do projeto, sistema de autenticação, layout base, banco de dados, modelos core.
**Stories estimadas:** 3-4

### Epic 2: Form Builder (P0)
Editor visual drag-and-drop, todos os tipos de campo, preview, lógica condicional, auto-save.
**Stories estimadas:** 5-7

### Epic 3: Experiência do Respondente (P0)
Renderizador Typeform-style, uma pergunta por tela, transições, validação, URL pública.
**Stories estimadas:** 4-5

### Epic 4: Gestão de Respostas (P0)
Dashboard de respostas, visualização, filtros, exportação, estatísticas, gráficos.
**Stories estimadas:** 3-4

### Epic 5: Tags Automáticas (P1)
Motor de regras, CRUD de tags, aplicação automática, filtros por tag.
**Stories estimadas:** 2-3

### Epic 6: Estilização de Formulários (P1)
Temas, cores, fontes, backgrounds, CSS custom, preview de tema.
**Stories estimadas:** 2-3

### Epic 7: Integrações (P1)
Google Sheets sync, Calendly embed, Webhooks com retry e logs.
**Stories estimadas:** 4-5

### Epic 8: Importação do Typeform (P2)
Import CSV, import via API, mapeamento de campos, relatório.
**Stories estimadas:** 2-3

---

## 6. Priorização (MoSCoW)

### Must Have (MVP)
- Auth (Epic 1)
- Form Builder com todos os campos (Epic 2)
- Experiência Typeform-style (Epic 3)
- Gestão de respostas básica (Epic 4)
- Múltiplos formulários (parte do Epic 1-2)

### Should Have
- Tags automáticas (Epic 5)
- Estilização (Epic 6)
- Webhooks (parte do Epic 7)

### Could Have
- Google Sheets (parte do Epic 7)
- Calendly (parte do Epic 7)

### Won't Have (v1)
- Importação do Typeform via API (Epic 8 — parcial, CSV sim)
- Pagamentos inline
- Multi-user/SaaS
- AI-generated forms

---

## 7. Success Metrics

| Métrica | Target |
|---------|--------|
| Formulários criados | Conseguir criar qualquer tipo de formulário |
| Experiência do respondente | Indistinguível do Typeform real |
| Respostas processadas | Suportar 10k+ respostas por formulário |
| Integrações funcionando | Sheets + Webhook + Calendly ativos |
| Importação Typeform | CSV importado com 100% de fidelidade |

---

## 8. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Complexidade do form builder | Alto | Alta | Usar biblioteca dnd-kit, implementar incrementalmente |
| Lógica condicional complexa | Médio | Média | Motor de regras isolado, testável |
| Integração Google OAuth | Médio | Baixa | Seguir docs oficiais, fallback manual |
| Performance com muitas respostas | Médio | Média | Paginação, queries otimizadas, indexes |
| Importação Typeform muda formato | Baixo | Baixa | Versionar parser, fallback CSV |

---

*PRD gerado pelo @pm Morgan — Synkra AIOS v4.2*
*— Morgan, planejando o futuro 📊*
