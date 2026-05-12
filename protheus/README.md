# Protheus Plugin — Claude Code

Plugin Claude Code para desenvolvimento **Protheus** (ADVPL/TLPP).

Ciclo completo: brainstorm → plan → implement (Agent Team haiku/sonnet, worktree) → deploy (TDS-CLI) → qa (TIR E2E) → verify.

Conecta automaticamente ao **MCP Server remoto** com a Knowledge Base ADVPL/TLPP da DataAgile.

## Instalação

### Pré-requisitos

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) **v2.1.32+** instalado
- Node.js 18+
- **Uma** das credenciais abaixo (basta uma):
  - **API key do portal** (`dataagile_*`) — usuários externos pagos. Gere em [knowledge.dataagile.com.br](https://knowledge.dataagile.com.br) após assinar um plano (`starter` ou `pro`).
  - **Email cadastrado** — usuários internos, com email registrado no auth-server.

### Passo 1 — Registrar o marketplace e instalar

```bash
claude plugin marketplace add https://github.com/tbc-servicos/dataagile-agent-kit.git
claude plugin install protheus@claude-skills-dataagile
```

### Passo 2 — Configurar a credencial

Escolha **A** ou **B** conforme o seu perfil. Se ambas estiverem configuradas, a API key tem precedência.

#### A) API key do portal (usuários externos — padrão recomendado)

A API key autentica direto contra o portal de assinaturas. Email/tier/orgId são resolvidos pelo servidor — você **não** precisa configurar email.

**macOS / Linux (arquivo de configuração):**
```bash
mkdir -p ~/.config/dataagile
echo '{ "api_key": "dataagile_SUA_CHAVE_AQUI" }' > ~/.config/dataagile/dev-config.json
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.config\dataagile" | Out-Null
'{ "api_key": "dataagile_SUA_CHAVE_AQUI" }' | Set-Content "$env:USERPROFILE\.config\dataagile\dev-config.json"
```

**Alternativa — variável de ambiente (qualquer SO):**
```bash
export DATAAGILE_API_KEY=dataagile_SUA_CHAVE_AQUI       # macOS/Linux — adicione ao ~/.zshrc ou ~/.bashrc
```
```powershell
[Environment]::SetEnvironmentVariable("DATAAGILE_API_KEY", "dataagile_SUA_CHAVE_AQUI", "User")
```

> Gere ou rotacione a key em [knowledge.dataagile.com.br](https://knowledge.dataagile.com.br). Nunca compartilhe a chave.

#### B) Email cadastrado (uso interno — legado)

Usado apenas por usuários internos, cujos emails estão pré-registrados no auth-server. Para externos, use a opção A.

**macOS (zsh):**
```bash
echo 'export DATAAGILE_USER_EMAIL=seu.nome@empresa.com.br' >> ~/.zshrc
source ~/.zshrc
```

**Linux (bash):**
```bash
echo 'export DATAAGILE_USER_EMAIL=seu.nome@empresa.com.br' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("DATAAGILE_USER_EMAIL", "seu.nome@empresa.com.br", "User")
```
> Reinicie o terminal depois de configurar.

**Alternativa — arquivo de configuração:**
```bash
# macOS/Linux
mkdir -p ~/.config/dataagile
echo '{ "email": "seu.nome@empresa.com.br" }' > ~/.config/dataagile/dev-config.json
```
```powershell
# Windows
mkdir -Force "$env:USERPROFILE\.config\dataagile"
'{ "email": "seu.nome@empresa.com.br" }' | Out-File "$env:USERPROFILE\.config\dataagile\dev-config.json" -Encoding utf8
```

> O email precisa estar cadastrado no auth-server interno. Para usuários externos sem cadastro interno, use a opção A (API key do portal).

### Passo 3 — Habilitar Agent Teams (recomendado)

```bash
# macOS/Linux
echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1' >> ~/.zshrc
echo 'export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50' >> ~/.zshrc
source ~/.zshrc
```

```bash
# Linux
echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1' >> ~/.bashrc
echo 'export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50' >> ~/.bashrc
source ~/.bashrc
```

Agent Teams habilita **comunicação bidirecional** entre teammates e **worktree isolation**.
O `AUTOCOMPACT_PCT_OVERRIDE=50` reduz perda de contexto em compactações.

### Passo 4 — Verificar

Abra o Claude Code e rode `/mcp`. O MCP conecta automaticamente (dependências são instaladas na primeira execução).

```
Claude Code CLI
  └─ start.sh (npm install se necessário)
       └─ connect-remote.js (proxy stdio ↔ Streamable HTTP)
            └─ https://mcp.totvstbc.com.br/mcp
```

Para verificar se conectou, as ferramentas do knowledge base aparecerão disponíveis no Claude Code. O número de tools depende do tier do usuário — **4** para tier `trial`/`standard` (externos), **9** para tier `internal`. Veja [MCP — Ferramentas da Knowledge Base](#mcp--ferramentas-da-knowledge-base) para o catálogo completo.

## Uso no Claude Desktop

O MCP também funciona no **Claude Desktop** (app). Adicione ao arquivo de configuração:

| SO | Caminho |
|----|---------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

**Externo (API key — recomendado):**
```json
{
  "mcpServers": {
    "tbc-knowledge": {
      "command": "node",
      "args": ["<HOME>/.claude/plugins/marketplaces/claude-skills-dataagile/protheus/dist/tbc-mcp-proxy.mjs"],
      "env": {
        "DATAAGILE_API_KEY": "dataagile_SUA_CHAVE_AQUI"
      }
    }
  }
}
```

**Interno (email):**
```json
{
  "mcpServers": {
    "tbc-knowledge": {
      "command": "bash",
      "env": {
        "DATAAGILE_USER_EMAIL": "seu.nome@empresa.com.br"
      }
    }
  }
}
```

Reinicie o Claude Desktop depois de salvar.

> **Atenção — conflito com o plugin:** Se você usa o plugin `protheus@claude-skills-dataagile` no Claude Code, **não adicione** o MCP manualmente nem pelo `claude_desktop_config.json` nem pelas Integrations do claude.ai. O plugin já registra o MCP automaticamente. Ter os dois ativos duplica cada chamada MCP, causando lentidão e respostas redundantes.

## Arquitetura v2.0.8

### Agent Teams + Worktree Isolation

```
/protheus:implement
  │
  ├─ TeamCreate("protheus-impl-team")
  │
  ├─ protheus-implementer (haiku, worktree isolado)
  │   ├── Recebe task → consulta MCP → implementa → lint
  │   ├── Reporta DONE/BLOCKED/NEEDS_CONTEXT
  │   └── Recebe feedback dos reviewers → corrige → re-reporta
  │
  ├─ protheus-spec-reviewer (sonnet)
  │   ├── Lê código real vs design doc
  │   ├── ✅ SPEC OK ou ❌ SPEC FALHA
  │   └── Feedback direto ao implementador se divergência simples
  │
  ├─ protheus-reviewer (sonnet)
  │   ├── Checklist ADVPL/TLPP completo
  │   ├── Aprovado para compilação: SIM/NÃO
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
/protheus:init-project  → explora projeto, entrevista, gera CLAUDE.md
/protheus:brainstorm    → MIT044 (opcional) + perguntas + design aprovado
/protheus:plan          → decompõe design em tasks ADVPL-tipadas
/protheus:implement     → Agent Team (worktree + feedback bidirecional):
   ├── protheus-implementer (haiku)      → implementa cada artefato via TDD
   ├── protheus-spec-reviewer (sonnet)   → verifica conformidade com spec
   ├── protheus-reviewer (sonnet)        → qualidade de código ADVPL/TLPP
   └── lint gate (advpls appre)          → validação local antes de deploy
/protheus:deploy        → lint + compilação AppServer + patch .ptm
/protheus:qa            → testes TIR E2E + análise de qualidade
/protheus:verify        → checklist Protheus (MIT043, Code Analysis) + produção
```

## Regra de Modelos (OBRIGATÓRIA)

| Papel | Modelo | Regra |
|-------|--------|-------|
| Dev (implementer) | **haiku** | Implementação mecânica, scaffolding, TDD |
| Review e QA | **sonnet** | Análise qualitativa, padrões, riscos |
| Opus | **NUNCA automático** | Só quando o dev solicitar explicitamente |

## Skills Disponíveis (17)

### Ciclo Principal

| Comando | Descrição |
|---------|-----------|
| `/protheus:init-project` | Explora projeto, entrevista e gera `CLAUDE.md` |
| `/protheus:brainstorm` | Planeja implementação — MIT044, perguntas, design aprovado |
| `/protheus:plan` | Decompõe design em tasks ADVPL-tipadas |
| `/protheus:implement` | Agent Team: impl → spec-review → code-review → lint |
| `/protheus:deploy` | Lint + compilação AppServer + patch .ptm |
| `/protheus:qa` | Testes TIR E2E + análise de qualidade |
| `/protheus:verify` | Checklist Protheus + gate final para produção |

### Atalhos e Utilitários

| Comando | Descrição |
|---------|-----------|
| `/protheus:writer` | Geração de código ADVPL/TLPP com padrões ADVPL |
| `/protheus:specialist` | Especialista ADVPL: consulta a Knowledge Base + TDN |
| `/protheus:patterns` | Referência de padrões: nomenclatura, húngara, MVC, PE |
| `/protheus:sql` | SQL embarcado: BeginSQL, macros, TCSqlExec |
| `/protheus:reviewer` | Revisão de código com relatório CRÍTICO/AVISO/SUGESTÃO |
| `/protheus:compile` | Lint local (`advpls appre`) + compilação no AppServer |
| `/protheus:test` | Geração de testes E2E com TIR 2.x |
| `/protheus:migrate` | Migração ADVPL procedural → TLPP orientado a objetos |
| `/protheus:diagnose` | Diagnóstico e resolução de erros ADVPL/TLPP |

## Teammates

| Teammate | Modelo | Papel | Isolamento |
|----------|--------|-------|------------|
| `protheus-implementer` | haiku | Implementa tasks do plano via TDD | worktree |
| `protheus-spec-reviewer` | sonnet | Verifica conformidade com spec | — |
| `protheus-reviewer` | sonnet | Qualidade de código ADVPL/TLPP | — |
| `protheus-deployer` | haiku | Compila via `advpls cli` + gera patch .ptm | — |
| `advpl-expert` | sonnet | Análise especializada standalone | — |

## MCP — Ferramentas da Knowledge Base

O MCP remoto bifurca por **tier** do usuário, resolvido server-side a partir da credencial:

- **API key do portal** (`dataagile_*`): tier vem do plano da assinatura (`starter` → `trial`, `pro` → `standard`).
- **Email cadastrado** (`DATAAGILE_USER_EMAIL`): tier vem do registro no auth-server (`internal` para usuários internos, `trial`/`standard` para externos pré-cadastrados).

### Tier `trial` / `standard` (external — 6 tools)

Acesso a referência pública ADVPL/TLPP filtrada por organização (row-level via `org_id`) **e** busca vetorial sobre uma base de conhecimento técnico ADVPL/TLPP curada.

| Tool | Descrição |
|------|-----------|
| `searchFunction` | Busca funções ADVPL/TLPP por nome, módulo, tipo |
| `findEndpoint` | Encontra endpoints REST por path, método |
| `findSmartView` | Busca SmartView por keyword ou equipe |
| `listModules` | Lista módulos com contagem de funções |
| `ragSearchKnowledge` | Busca vetorial (embedding 1536-dim) sobre uma base de conhecimento técnico ADVPL/TLPP |
| `ragSearchDocs` | Busca vetorial sobre documentação técnica Protheus (TDN), retorna `title`+`source_url`+`product_id` |

> Campos `source`, `implementation`, `code` são removidos das respostas para tier external. A base RAG é uma curadoria técnica sem PII.

### Tier `internal` (9 tools)

Inclui as 4 do external + 5 internas adicionais:

| Tool | Descrição |
|------|-----------|
| `findExecAuto` | Localiza chamadas ExecAuto por rotina ou tabela |
| `findMvcPattern` | Busca padrões MVC por model_id ou tabela |
| `searchByTable` | Cross-search por alias de tabela |
| `searchKnowledge` | Busca padrões, templates e convenções |
| `searchDocuments` | Busca nos documentos PDF de treinamento |

## Deploy via TDS-CLI

O teammate `protheus-deployer` usa `advpls cli` com script INI:

```ini
[authentication]
action=authentication
server=...

[compile]
action=compile
program=/caminho/absoluto/FONTE.prw
recompile=T
includes=/totvs/include/

[patchGen]
action=patchGen
fileResource=FONTE.prw
patchType=PTM
saveLocal=/patches/
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| "Nenhuma credencial configurada" | Configure **uma** das opções: `DATAAGILE_API_KEY` (externos) **ou** `DATAAGILE_USER_EMAIL` (internos). Veja [Passo 2](#passo-2--configurar-a-credencial). |
| "Acesso negado" / 401 (externo) | API key inválida ou inativa — gere/rotacione em [knowledge.dataagile.com.br](https://knowledge.dataagile.com.br) |
| "Acesso negado" / 401 (interno) | Email não cadastrado no auth-server — solicite ao administrador |
| Trial expirado / 402 | Renove a assinatura em [mcp.totvstbc.com.br/payment](https://mcp.totvstbc.com.br/payment) |
| MCP nao conecta | Verifique Node.js 18+ e conexao com internet |
| Dependencias faltando | Delete `node_modules` e reinicie (start.sh reinstala) |
| Claude Desktop nao mostra tools | Reinicie o app apos editar o config |
| Agent Teams nao funciona | Verifique `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` e Claude Code v2.1.32+ |

## Estrutura do Plugin

```
protheus/
├── .mcp.json                      # config do MCP (aponta para start.sh)
├── CLAUDE.md                      # convenções + regra de modelos + Agent Teams
├── skills/                        # 17 skills especializadas
│   ├── init-project/              # setup do projeto
│   ├── brainstorm/                # design aprovado
│   ├── plan/                      # plano de implementação
│   ├── implement/                 # orquestração Agent Team
│   │   ├── SKILL.md
│   │   ├── implementer-prompt.md
│   │   ├── spec-reviewer-prompt.md
│   │   └── code-reviewer-prompt.md
│   ├── deploy/                    # lint + compilação + patch
│   ├── qa/                        # TIR E2E + qualidade
│   ├── verify/                    # gate final produção
│   ├── writer/                    # geração direta
│   ├── specialist/                # análise especializada
│   ├── patterns/                  # referência de padrões
│   ├── sql/                       # SQL embarcado
│   ├── reviewer/                  # revisão de código
│   ├── compile/                   # lint + compilação
│   ├── test/                      # TIR E2E
│   ├── migrate/                   # ADVPL → TLPP
│   └── diagnose/                  # diagnóstico de erros
├── agents/                        # 5 teammates (Agent Teams)
│   ├── protheus-implementer.md    # haiku — implementa tasks (worktree)
│   ├── protheus-spec-reviewer.md  # sonnet — verifica spec
│   ├── protheus-reviewer.md       # sonnet — qualidade código
│   ├── protheus-deployer.md       # haiku — compila + patch
│   └── advpl-expert.md            # sonnet — análise standalone
├── hooks/
│   ├── hooks.json                 # PostToolUse on Write|Edit
│   ├── advpl-encoding.sh          # auto-converts UTF-8 → CP-1252
│   ├── advpl-lint.sh              # runs advpls appre
│   └── pre-commit-encoding.sh     # git pre-commit hook
    ├── start.sh                   # bootstrap (npm install + exec)
    ├── connect-remote.js          # proxy stdio ↔ Streamable HTTP
    └── package.json               # dependencias (@modelcontextprotocol/sdk)
```

## Atualização

```bash
claude plugin update protheus@claude-skills-dataagile
```
