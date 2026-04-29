# Fluig Plugin v2.0.1 — Claude Code

Plugin Claude Code para desenvolvimento na plataforma **TOTVS Fluig** com ciclo completo guiado por skills e execução via Agent Teams.

## O que o plugin entrega

- **Agent Teams com feedback bidirecional:** teammates se comunicam entre si para resolver problemas sem redespacho
- **Worktree isolation:** implementador trabalha em cópia isolada do repositório
- **Fluxo guiado completo:** do brainstorm ao deploy em produção, cada skill conduz o dev para a próxima etapa
- **TDD integrado:** testes unitários (Jasmine/Karma) e E2E (Playwright) como parte do ciclo
- **Deploy antes do QA:** artefatos são deployados no servidor antes dos testes de integração e E2E
- **Base de conhecimento MCP:** consulta automática de padrões, APIs e referências Fluig
- **Estratégia anti-compactação:** 4 camadas para preservar contexto em sessões longas

## Instalação

### Opção 1: `--plugin-dir` (desenvolvimento local)
```bash
claude --plugin-dir /path/to/fluig-plugin
```

### Opção 2: Marketplace público (GitHub)
```bash
# Adicionar marketplace
/plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git

# Instalar o plugin
/plugin install fluig@claude-skills-tbc
```

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

## Arquitetura v2.0.1

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

| Comando | Descrição |
|---------|-----------|
| `/fluig:brainstorm` | Gate de design — entrevista, mapeia integrações, gera spec |
| `/fluig:plan` | Plano de implementação com tasks TDD e file mapping |
| `/fluig:implement` | Agent Team para executar o plano (worktree + bidirecional) |
| `/fluig:deploy` | Deploy no servidor de teste |
| `/fluig:qa` | Testes E2E + análise de qualidade no servidor |
| `/fluig:verify` | Checklist final + deploy em produção |
| `/fluig:review` | Atalho: pipeline completo (review → deploy → qa) |
| `/fluig:debug` | Debugging sistemático (logs Docker, Playwright, Karma) |
| `/fluig:widget` | Scaffolding de widget Angular 19 + PO-UI |
| `/fluig:dataset` | Scaffolding de dataset JavaScript |
| `/fluig:form` | Scaffolding de formulário HTML + events/ |
| `/fluig:workflow` | Scaffolding de script BPM/evento |
| `/fluig:test` | Geração e execução de testes (unit + E2E) |
| `/fluig:api-ref` | Referência das APIs Fluig |
| `/fluig:init-project` | Inicializa projeto — gera CLAUDE.md do cliente |

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
│   └── init-project/   # Setup projeto cliente
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
