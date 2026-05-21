# Fluig Plugin v2.0.5 — Claude Code / Codex / Gemini

Plugin para desenvolvimento na plataforma **TOTVS Fluig** com ciclo completo guiado por skills e execução via Agent Teams.

> **Instalação rápida (todos os CLIs):**
> ```bash
> npx github:tbc-servicos/dataagile-agent-kit
> ```
> Guia completo: [INSTALL.md](../INSTALL.md)

## O que o plugin entrega

- **Agent Teams com feedback bidirecional:** teammates se comunicam entre si para resolver problemas sem redespacho
- **Worktree isolation:** implementador trabalha em cópia isolada do repositório
- **Fluxo guiado completo:** do brainstorm ao deploy em produção, cada skill conduz o dev para a próxima etapa
- **TDD integrado:** testes unitários (Jasmine/Karma) e E2E (Playwright) como parte do ciclo
- **Deploy antes do QA:** artefatos são deployados no servidor antes dos testes de integração e E2E
- **Base de conhecimento MCP:** consulta automática de padrões, APIs e referências Fluig
- **Estratégia anti-compactação:** 4 camadas para preservar contexto em sessões longas

## Instalação (Claude Code)

### Opção 1: `--plugin-dir` (desenvolvimento local)
```bash
claude --plugin-dir /path/to/fluig-plugin
```

### Opção 2: Marketplace público (GitHub)
```bash
# Adicionar marketplace
/plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git

# Instalar o plugin
/plugin install fluig@claude-skills-dataagile
```

### Codex CLI / Gemini CLI

```bash
npx github:tbc-servicos/dataagile-agent-kit
```

O instalador detecta o CLI instalado, pede a API key e configura tudo automaticamente. Ver [INSTALL.md](../INSTALL.md) para todos os detalhes.

### Habilitar Agent Teams (recomendado)

```bash
# macOS/Linux
echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1' >> ~/.zshrc
echo 'export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50' >> ~/.zshrc
source ~/.zshrc
```

- Requer Claude Code **v2.1.32+**
- Agent Teams habilita comunicação bidirecional entre teammates
- `AUTOCOMPACT_PCT_OVERRIDE=50` reduz perda de contexto em compactações

## Arquitetura v2.0.5

### Agent Teams + Worktree Isolation

```
/fluig:implement
  │
  ├─ TeamCreate("fluig-impl-team")
  │
  ├─ fluig-implementer (haiku, worktree isolado)
  │   ├── Recebe task → consulta MCP → implementa TDD → testa
  │   ├── Reporta DONE/BLOCKED/NEEDS_CONTEXT
  │   └── Recebe feedback dos reviewers → corrige → re-reporta
  │
  ├─ fluig-spec-reviewer (sonnet)
  │   ├── Lê código real vs design doc
  │   ├── ✅ CONFORME ou ❌ NÃO CONFORME
  │   └── Feedback direto ao implementador se divergência simples
  │
  ├─ fluig-reviewer (sonnet)
  │   ├── Checklist Fluig completo (nomenclatura, erros, segurança)
  │   ├── Aprovado para deploy: SIM/NÃO
  │   └── Feedback direto ao implementador para CRÍTICOs
  │
  └─ Merge worktree → encerramento
```

### Estratégia Anti-Compactação (4 camadas)

| Camada | Tipo | Conteúdo | Tokens |
|--------|------|----------|--------|
| 1 | Sempre presente | CLAUDE.md, skills preloaded, hooks | ~2K fixos |
| 2 | Sob demanda | MCP queries, RAG docs | 0 até chamada |
| 3 | Compactável | Código da task, feedback, raciocínio | Gerenciado |
| 4 | Persistente | Memory files, git commits, Beads | Fora do contexto |

## Ciclo de Desenvolvimento

```
/fluig:brainstorm  →  entrevista + design aprovado + spec em disco
        ↓
/fluig:plan        →  plano de implementação com tasks TDD
        ↓
/fluig:implement   →  Agent Team (haiku dev + sonnet review, worktree)
        ↓
/fluig:deploy      →  deploy no servidor Fluig de teste
        ↓
/fluig:qa          →  testes E2E (Playwright) + análise de QA
        ↓
/fluig:verify      →  checklist + deploy em produção
```

Cada skill termina com **"Próximo passo:"** guiando o dev para a etapa seguinte.

## Skills Disponíveis

### Fluxo principal (sequencial)

| Comando | Descrição |
|---------|-----------|
| `/fluig:init-project` | Inicializa projeto — entrevista o dev e gera CLAUDE.md com contexto do cliente (URL servidor, prefixos, integração Protheus) |
| `/fluig:brainstorm` | Gate de design — entrevista, mapeia integrações, gera spec aprovada antes de qualquer scaffolding |
| `/fluig:plan` | Plano de implementação com tasks TDD e file mapping, salvo em `docs/fluig/plans/` |
| `/fluig:implement` | Agent Team executando o plano (fluig-implementer em worktree + fluig-spec-reviewer + fluig-reviewer, comunicação bidirecional) |
| `/fluig:deploy` | Deploy de artefatos no servidor Fluig de teste via fluig-deployer + verificação de logs |
| `/fluig:qa` | Testes de integração + E2E Playwright contra servidor deployado |
| `/fluig:verify` | Gate final pré-produção — checklist adaptativo (HML vs servidor único) |

### Scaffolding (acionados pelo /fluig:plan ou /fluig:implement)

| Comando | Descrição |
|---------|-----------|
| `/fluig:widget` | Widget Angular 19 + PO-UI 19.36 — components, pages, services, Jasmine/Karma. Prefixo `wg_` |
| `/fluig:dataset` | Dataset JavaScript com `defineStructure()`, `createDataset()`, try/catch e logging. SQL, REST Protheus, anti-injection |
| `/fluig:form` | Formulário HTML com events/, máscaras CPF/CNPJ/CEP, validações, SweetAlert2 |
| `/fluig:workflow` | Scripts BPM: `afterStateEntry`, `beforeStateEntry`, `afterProcessCreate`, `subProcessCreated` com log e integração dataset |

### Apoio

| Comando | Descrição |
|---------|-----------|
| `/fluig:review` | Atalho: pipeline completo (revisão estática → testes → deploy → qa) — alternativa rápida ao fluxo guiado |
| `/fluig:test` | Gera e executa testes unitários (Jasmine/Karma) + E2E (Playwright) |
| `/fluig:debug` | Debugging sistemático em 4 fases (reproduzir → investigar → hipótese → corrigir) com logs Docker, Playwright traces, Karma |
| `/fluig:api-ref` | Referência rápida das APIs Fluig: `DatasetFactory`, `DatasetBuilder`, `CardAPI`, `WCMAPI`, `fluigc`, `WFMovementDTO`, `getValue/setValue` |
| `/fluig:feedback` | Registra aprendizado quando Claude erra e o dev corrige — alimenta a base de conhecimento Fluig |

## Teammates

| Teammate | Modelo | Papel | Isolamento |
|----------|--------|-------|------------|
| `fluig-implementer` | haiku | Implementa tasks do plano seguindo TDD | worktree |
| `fluig-spec-reviewer` | sonnet | Verifica conformidade com a spec | — |
| `fluig-reviewer` | sonnet | Verifica qualidade de código Fluig | — |
| `fluig-qa` | sonnet | Análise de riscos e edge cases | — |
| `fluig-deployer` | haiku | Deploy via SSH ou REST API Fluig | — |

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo |
|-------|--------|
| Dev (implementer) | **haiku** |
| Review e QA | **sonnet** |
| Opus | **NUNCA automático** — só quando o dev solicitar explicitamente |

O plugin nunca escala para opus por conta própria. Se a task for complexa, sugere ao dev mas a decisão é dele.

## Hooks

Validação automática após edição de arquivos `.js`:
- Detecta ausência de `try/catch`
- Detecta uso de `alert()` nativo (deve ser SweetAlert2)

## Estrutura do Plugin

```
fluig/
├── .claude-plugin/plugin.json
├── CLAUDE.md
├── README.md
├── skills/
│   ├── brainstorm/     # Gate de design
│   ├── plan/           # Plano de implementação
│   ├── implement/      # Orquestração Agent Team
│   │   ├── SKILL.md
│   │   ├── implementer-prompt.md
│   │   ├── spec-reviewer-prompt.md
│   │   └── code-reviewer-prompt.md
│   ├── deploy/         # Deploy servidor teste
│   ├── qa/             # Testes E2E + QA
│   ├── verify/         # Gate deploy produção
│   ├── review/         # Atalho pipeline completo
│   ├── debug/          # Debugging sistemático
│   ├── dataset/        # Scaffolding dataset
│   ├── form/           # Scaffolding formulário
│   ├── widget/         # Scaffolding widget
│   ├── workflow/       # Scaffolding workflow
│   ├── test/           # Testes unit + E2E
│   ├── api-ref/        # Referência APIs
│   ├── init-project/   # Setup projeto cliente
│   └── feedback/       # Registra aprendizado pós-correção
├── agents/             # 5 teammates (Agent Teams)
│   ├── fluig-implementer.md   # Dev (haiku, worktree)
│   ├── fluig-spec-reviewer.md # Spec review (sonnet)
│   ├── fluig-reviewer.md      # Code quality (sonnet)
│   ├── fluig-qa.md            # QA (sonnet)
│   └── fluig-deployer.md      # Deploy (haiku)
├── hooks/
│   └── hooks.json
└── mcp-servers/
    └── tbc-knowledge/
```
