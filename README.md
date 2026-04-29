# claude_skills — Marketplace Público TBC

Plugins Claude Code para desenvolvimento TOTVS — distribuídos como marketplace público no GitHub. Conteúdo proprietário (knowledge base ADVPL/Fluig, fontes padrão TOTVS) é gateado pelo `auth_server_skills` remoto via MCP. O repo público contém apenas o "shell" do plugin (skills, hooks, dist).

## Versões

| Plugin | Versão | Descrição |
|--------|--------|-----------|
| protheus | 2.0.4 | ADVPL/TLPP — brainstorm, geração, review, compilação, testes E2E |
| fluig | 2.0.4 | Angular 19 + PO-UI — widget, dataset, form, workflow, testes |
| mit-docs | 1.0.0 | Documentação MIT044 (Especificação) e MIT010 (Validação) |
| TAE | 1.0.0 | TOTVS Assinatura Eletrônica |
| jira-api | 1.0.0 | Jira Cloud REST API v3 |
| keepass | 1.0.0 | Gerenciador de senhas KeePass |
| playwright | 1.0.0 | Testes E2E via Playwright |

---

## Instalação Rápida (analistas e devs)

**Pré-requisito:** Claude Code instalado (`npm install -g @anthropic-ai/claude-code`)

Abra o Claude Code e cole:

```
! bash <(curl -sS https://mcp.totvstbc.com.br/setup/setup-tbc.sh)
```

O script configura tudo automaticamente:
- Plugins TBC (clone/atualização do marketplace via HTTPS público)
- Email para o MCP (autenticação na base de conhecimento)
- Rodapé com versões dos plugins

Depois **reinicie o Claude Code**.

### Atualização

Os plugins se atualizam automaticamente ao iniciar cada sessão (hook SessionStart). Para forçar manualmente:

```
! bash "$HOME/.claude/plugins/marketplaces/claude-skills-tbc/scripts/check-plugins.sh"
```

### Validação (health check)

```
! bash "$HOME/.claude/plugins/marketplaces/claude-skills-tbc/scripts/check-plugins.sh"
```

Mostra: SO, Claude Code, SSH, plugins instalados, hooks, statusline.

---

## Plugins Disponíveis

| Plugin | Versão | Domínio | Skills |
|--------|--------|---------|--------|
| `fluig` | 1.4.0 | TOTVS Fluig — ciclo completo: design, scaffolding, testes, deploy | 10 skills + 3 agents |
| `protheus` | 1.6.0 | TOTVS Protheus — ADVPL/TLPP, compilação via TDS-CLI, testes E2E Playwright, MCP Knowledge Base | 13 skills + 3 agents + MCP |
| `mit-docs` | 1.0.0 | Documentação de projeto TOTVS — MIT044 (Especificação) e MIT010 (Termo de Validação) | 2 skills + MCP |
| `confluence` | 1.0.0 | Atlassian Confluence — publicação de docs, MIT010/MIT072, extração de PDF | 3 skills + MCP |
| `jira` | 1.0.0 | Atlassian Jira — integração oficial (Rovo), busca/criação de issues | 1 skill + MCP Oficial |
| `jira-api` | 1.0.0 | Jira Cloud REST API v3 — attachments, custom fields, comments, JQL avançado | 1 skill + MCP Custom |

---

## Plugin Fluig

### Skills

| Comando | O que faz |
|---------|-----------|
| `/fluig:init-project` | Entrevista e gera `CLAUDE.md` do projeto cliente |
| `/fluig:brainstorm` | Gate de design — entrevista, mapeia integrações, produz design aprovado antes de qualquer scaffolding |
| `/fluig:widget` | Scaffolding completo de widget Angular 19 + PO-UI |
| `/fluig:dataset` | Dataset JavaScript com try/catch, logging e integração REST |
| `/fluig:form` | Formulário HTML com events/, Util/, validações e máscaras |
| `/fluig:workflow` | Evento BPM (afterStateEntry, validateForm, etc.) |
| `/fluig:test` | Gera e executa testes Jasmine/Karma (unit) e Playwright E2E contra servidor Fluig |
| `/fluig:review` | Gate de qualidade: revisão estática → unit tests → deploy teste → E2E → QA no servidor |
| `/fluig:verify` | Gate de deploy final: checklist adaptativo (HML vs servidor único) + deploy via fluig-deployer |
| `fluig-api-ref` | Referência APIs Fluig (carregada automaticamente) |

### Subagents

| Agent | Modelo | Como usar |
|-------|--------|-----------|
| `fluig-reviewer` | Sonnet | `"use fluig-reviewer to review @ds_exemplo.js"` |
| `fluig-qa` | Sonnet | `"use fluig-qa to analyze @events/validateForm.js"` |
| `fluig-deployer` | Haiku | `"use fluig-deployer to deploy ds_exemplo.js"` |

### Hooks

Dois hooks ativos em projetos com `@po-ui/ng-components`:

**`fluig-lint.sh`** — ativado ao salvar `.js`, `.ts`, `.html`:
- Prettier auto-fix silencioso
- ESLint bloqueante (se config existir)
- `tsc --noEmit` bloqueante para `.ts`
- Proíbe `alert()` → use `Swal.fire()`
- Exige `try/catch` em datasets (`ds_*`) e workflows (`wf_*`)

**`fluig-ts-preference.sh`** — ativado a cada prompt:
- Injeta contexto: Angular 19 + PO-UI 19.36.0, sempre TypeScript, nunca `.js` em componentes

### Fluxo recomendado

```
1. /fluig:init-project  → gera CLAUDE.md do projeto (uma vez por projeto)

Por funcionalidade:
2. /fluig:brainstorm     → design aprovado antes de qualquer código (SEMPRE primeiro)
3. /fluig:dataset        → cria datasets de suporte
4. /fluig:widget         → cria widget (ou fluig-form / fluig-workflow)
5. /fluig:review         → revisão estática + unit tests (Jasmine/Karma)
                                  + deploy HML + E2E (Playwright) + QA no servidor
6. /fluig:verify         → checklist final + deploy produção
```

> **Sobre os testes E2E:** `fluig-review` (Passo 5) aciona automaticamente o `fluig-test` para Playwright após o deploy de teste. Fluig não roda em `localhost` — E2E exige servidor real. A URL é lida do `CLAUDE.md` do projeto.

---

## Plugin Protheus

### Skills

| Comando | O que faz |
|---------|-----------|
| `/protheus:init-project` | Explora o projeto, entrevista e gera `CLAUDE.md` |
| `/protheus:brainstorm` | Planeja a implementação — intake de MIT044, perguntas, design aprovado |
| `/protheus:plan` | Decompõe o design aprovado em tasks ADVPL-tipadas (artefatos `R[MOD][TYPE][SEQ].prw/.tlpp`) |
| `/protheus:implement` | Orquestra Agent Team: implementer (haiku) → spec-reviewer (sonnet) → reviewer (sonnet). Gate de lint antes de avançar |
| `/protheus:deploy` | Compila no AppServer e gera patch `.ptm` ← GATE obrigatório antes do QA |
| `/protheus:qa` | Testes TIR E2E contra ambiente compilado. Retorna para implement se falhas encontradas |
| `/protheus:verify` | Checklist final TOTVS (MIT043, Code Analysis, patch `.ptm`) antes de produção |
| `/protheus:writer` | Gera código ADVPL/TLPP com notação húngara, MVC, FWMBrowse |
| `/protheus:specialist` | Consulta base de conhecimento ADVPL (155k+ registros) via MCP |
| `/protheus:patterns` | Referência de padrões TOTVS (nomenclatura, húngara, MVC, PE) |
| `/protheus:sql` | SQL embarcado: BeginSQL, macros, TCSqlExec |
| `/protheus:reviewer` | Revisão — relatório CRÍTICO/AVISO/SUGESTÃO |
| `/protheus:migrate` | Migração ADVPL procedural → TLPP orientado a objetos |
| `/protheus:compile` | Lint local (`advpls appre`) + compilação no AppServer (`advpls cli`) |
| `/protheus:test-web` | Testes E2E interativos via MCP Playwright — roteiro → aprovação → execução com screenshots → error handling → persistência → MIT010 |
| `/protheus:feedback` | Registra correção ou aprendizado na base de conhecimento via MCP |
| `/protheus:importar-gerenciador-projeto` | Monta o payload JSON para importar projetos/dicionário via UTBCA012 e opcionalmente executa a chamada REST ao ambiente destino |

### Subagents

| Agent | Modelo | Como usar |
|-------|--------|-----------|
| `protheus-implementer` | Haiku | Implementação TDD — chamado automaticamente por `/protheus:implement` |
| `protheus-spec-reviewer` | Sonnet | Conformidade com spec — chamado após implementer |
| `advpl-expert` | Sonnet | `"use advpl-expert to create MVC for SZZ table"` (compatibilidade) |
| `protheus-reviewer` | Sonnet | `"use protheus-reviewer to review @MinhaFuncao.prw"` |
| `protheus-deployer` | Haiku | `"use protheus-deployer to compile @MinhaFuncao.prw"` |

> `protheus-implementer` é o agente de implementação atual (Agent Teams). `advpl-expert` mantido por compatibilidade retroativa.

### Pré-requisito: binário `advpls`

A compilação usa o binário `advpls` do pacote `@totvs/tds-ls` (TDS Language Server Protocol).

**Opção 1 — npm (recomendado, com dependências gerenciadas):**

```bash
# Instalar como dependência do projeto
npm install @totvs/tds-ls --save-dev

# Ou global (menos recomendado)
npm install -g @totvs/tds-ls

# Verificar
advpls --version
```

**Opção 2 — Download direto (binário portátil, sem npm):**

Binários portáteis disponíveis em [GitHub Releases](https://github.com/totvs/tds-ls/releases):

```bash
# Linux/macOS
cd /usr/local/bin
curl -L https://github.com/totvs/tds-ls/releases/download/v<version>/tds-ls-<version>-linux-x64.zip -o tds-ls.zip
unzip tds-ls.zip
chmod +x advpls
advpls --version

# Windows
# Download .exe direto do releases page e adicionar ao PATH
```

**Opção 3 — Usar extensão TDS-VSCode (bundled):**

Se usar TDS-VSCode, o `advpls` já vem incluído. Configure o path:

```bash
# Exemplo Linux/macOS (ajuste conforme sua instalação)
export PATH="$PATH:$HOME/.vscode/extensions/totvs-vscode-<version>/tds-ls/bin"
advpls --version
```

**Se houver problemas após instalação:**

```bash
# Verificar se advpls está no PATH
which advpls

# Se não encontrar, adicionar ao PATH manualmente
export PATH="$PATH:$(npm bin -g)"
# Ou adicionar ao ~/.bashrc / ~/.zshrc

# Testar lint (sem AppServer)
advpls appre seu_arquivo.prw
```

### Hooks

**`advpl-lint.sh`** — ativado ao salvar `.prw` e `.tlpp`:
- Lint via `advpls appre` — detecta erros de sintaxe, variáveis não declaradas, type mismatch
- Erros reais e warnings críticos bloqueiam o Claude até corrigi-los
- Requer `@totvs/tds-ls` instalado

### MCP Server — ADVPL Knowledge Base

Base de conhecimento remota com **155.437 registros** extraídos de **11.923 fontes** Protheus, hospedada em `https://mcp.totvstbc.com.br/mcp`.

| Tipo | Quantidade |
|------|-----------|
| Funções | 119.346 |
| Endpoints REST | 904 |
| SmartViews | 523 |
| ExecAuto | 286 |
| MVC Patterns | 192 |
| Knowledge Patterns | 94 |
| Documentos TDN | 33.899 |
| Módulos | 193 |

**9 tools MCP:** searchFunction, findEndpoint, findSmartView, findExecAuto, findMvcPattern, listModules, searchByTable, searchKnowledge, searchDocuments

#### Configuração do email (obrigatório, sem este passo o MCP não conecta)

O MCP autentica pelo email cadastrado no painel admin TBC. Configure **uma única vez** após instalar o plugin:

**macOS (zsh):**
```bash
echo 'export TBC_USER_EMAIL=seu.nome@empresa.com.br' >> ~/.zshrc && source ~/.zshrc
```

**Linux (bash):**
```bash
echo 'export TBC_USER_EMAIL=seu.nome@empresa.com.br' >> ~/.bashrc && source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
[Environment]::SetEnvironmentVariable("TBC_USER_EMAIL", "seu.nome@empresa.com.br", "User")
```

**Alternativa — arquivo de configuração (qualquer SO):**
```bash
# macOS/Linux
mkdir -p ~/.config/tbc
echo '{ "email": "seu.nome@empresa.com.br" }' > ~/.config/tbc/dev-config.json
```
```powershell
# Windows
mkdir -Force "$env:USERPROFILE\.config\tbc"
'{ "email": "seu.nome@empresa.com.br" }' | Out-File "$env:USERPROFILE\.config\tbc\dev-config.json" -Encoding utf8
```

> O email precisa estar cadastrado no painel admin. Solicite ao administrador em `https://mcp.totvstbc.com.br/admin`.
>
> **Se o email não estiver configurado**, o MCP carrega com uma tool `getConnectionStatus` informando o erro.

#### Como funciona

Ao instalar o plugin, o MCP conecta automaticamente via bundle JS (zero dependências externas):

```
Claude Code CLI / Desktop
  └─ node dist/tbc-mcp-proxy.mjs
       └─ proxy stdio ↔ Streamable HTTP
            └─ https://mcp.totvstbc.com.br/mcp
```

Cross-platform: macOS, Linux e Windows — usa `node` (já incluso no Claude Code).

#### Uso no Claude Desktop

Adicione ao arquivo de configuração:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tbc-knowledge": {
      "command": "node",
      "args": ["<HOME>/.claude/plugins/marketplaces/claude-skills-tbc/dist/tbc-mcp-proxy.mjs"],
      "env": {
        "TBC_USER_EMAIL": "seu.nome@empresa.com.br"
      }
    }
  }
}
```

Substitua `<HOME>` pelo seu home directory (ex: `/Users/joao` ou `C:\\Users\\joao`).


### Fluxo recomendado

```
1. /protheus:init-project → explora projeto, entrevista, gera CLAUDE.md
2. /protheus:brainstorm   → MIT044 (opcional) + perguntas + design aprovado
3. /protheus:plan         → decompõe design em tasks ADVPL-tipadas
4. /protheus:implement    → orquestra Agent Team:
     ├── protheus-implementer   (haiku)  → implementa artefatos em worktree isolado
     ├── protheus-spec-reviewer (sonnet) → verifica conformidade com spec
     └── protheus-reviewer      (sonnet) → qualidade de código ADVPL/TLPP
5. /protheus:deploy       → compila no AppServer, gera patch .ptm ← GATE obrigatório
6. /protheus:qa           → testes TIR E2E (bloqueia enquanto patch não aplicado)
7. /protheus:verify       → checklist final TOTVS antes de produção
```

> **Sobre o gate de compilação:** ADVPL/TLPP é linguagem compilada. O `/protheus:deploy` bloqueia os testes TIR enquanto o patch não for gerado sem erros — nunca avança para QA com código desatualizado no ambiente.

---

## Plugin MIT-Docs

Documentação de projeto TOTVS — independente de produto (Protheus, Fluig, misto).

### Skills

| Comando | O que faz |
|---------|-----------|
| `/mit-docs:mit044` | Gera MIT044 (Especificação de Personalização) via brainstorm colaborativo → DOCX no Google Drive |
| `/mit-docs:mit010` | Gera MIT010 (Termo de Validação) a partir dos resultados de QA → DOCX no Google Drive |

### Fluxo no ciclo de projeto

```
Requisitos do cliente
       ↓
/mit-docs:mit044  ← brainstorm + geração do documento
       ↓
Aprovação cliente (assinatura MIT044)
       ↓
/protheus:brainstorm ou /fluig:* ← implementação a partir da MIT044
       ↓
/protheus:test-web ou /fluig:test ← QA
       ↓
/mit-docs:mit010  ← gera termo de validação com evidências
       ↓
Aceite cliente (assinatura MIT010)
```

---

## Plugin Confluence

### Skills

| Comando | O que faz |
|---------|-----------|
| `/confluence:confluence-tools` | Cria, atualiza, deleta e busca páginas via API Confluence v2 (OAuth) |
| `/confluence:mit-doc-extractor` | Converte documento MIT010/MIT072 em documentação Confluence |
| `/confluence:pdf-image-extractor` | Extrai imagens de PDF e gera índice Markdown |

### MCP Server (Confluence API)

Requer variáveis de ambiente no `.env` do projeto:

```env
CONFLUENCE_URL=https://sua-empresa.atlassian.net
CONFLUENCE_EMAIL=seu-email@empresa.com
CONFLUENCE_API_TOKEN=seu-token-aqui
CONFLUENCE_SPACE_KEY=FSW
```

Configurar no `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "confluence": {
      "command": "python",
      "args": ["~/.claude/plugins/claude-skills-tbc/confluence/skills/confluence-tools/scripts/server.py"]
    }
  }
}
```

Instalar dependências:
```bash
pip install mcp>=1.0.0 httpx>=0.25.0 python-dotenv>=1.0.0
```

### Fluxo recomendado

```
1. /confluence:mit-doc-extractor   → extrai e formata conteúdo do MIT010/072
2. /confluence:pdf-image-extractor → extrai imagens do PDF
3. /confluence:confluence-tools    → converte Markdown e publica no Confluence
```

---

## Plugin Jira

### Skills

Integração oficial via **Atlassian Rovo MCP Server**.

| Comando | O que faz |
|---------|-----------|
| `jira_search_issues` | Busca issues usando JQL |
| `jira_create_issue` | Cria nova issue no Jira |
| `confluence_search` | Busca páginas no Confluence (via MCP oficial) |

### MCP Server Oficial

Diferente do plugin local de Confluence, este usa a infraestrutura da Atlassian. Configure no seu `.mcp.json` na raiz do projeto:

```json
{
  "mcpServers": {
    "atlassian-official": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.atlassian.com/v1/sse"]
    }
  }
}
```

No primeiro uso, o `mcp-remote` abrirá o navegador para autenticação via OAuth 2.1.

---

## Atualizar Plugins

Se `claude plugin update` não pegar a versão mais recente, limpe o cache e reinstale:

**Linux / macOS:**
```bash
rm -rf ~/.claude/plugins/cache/claude-skills-tbc ~/.claude/plugins/marketplaces/claude-skills-tbc
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
claude plugin install confluence@claude-skills-tbc
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\cache\claude-skills-tbc","$env:USERPROFILE\.claude\plugins\marketplaces\claude-skills-tbc"
claude plugin marketplace add https://github.com/tbc-servicos/tbc-knowledge-plugins.git
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
claude plugin install confluence@claude-skills-tbc
```

---

## Desenvolvimento Local (sem instalar)

```bash
claude --plugin-dir /caminho/para/claude_skills/fluig
claude --plugin-dir /caminho/para/claude_skills/protheus
claude --plugin-dir /caminho/para/claude_skills/confluence
claude --plugin-dir /caminho/para/claude_skills/mit-docs
```

---

## Estrutura do Repositório

```
claude_skills/
├── .claude-plugin/marketplace.json   # Registro do marketplace
├── setup-projeto.sh                   # Script de instalação interativo
├── ONBOARDING.md                      # Guia de onboarding da equipe
├── fluig/                             # Plugin Fluig (v1.2.1)
│   ├── .claude-plugin/plugin.json
│   ├── CLAUDE.md
│   ├── skills/                        # 10 skills
│   │   ├── fluig-init-project/
│   │   ├── fluig-brainstorm/          # ← novo: gate de design antes do scaffolding
│   │   ├── fluig-widget/
│   │   ├── fluig-form/
│   │   ├── fluig-dataset/
│   │   ├── fluig-workflow/
│   │   ├── fluig-test/                # Jasmine/Karma + Playwright E2E
│   │   ├── fluig-review/              # ← novo: gate de qualidade (5 passos)
│   │   ├── fluig-verify/              # ← novo: gate de deploy final
│   │   └── fluig-api-ref/
│   ├── agents/                        # 3 subagents
│   └── hooks/
│       ├── hooks.json
│       ├── fluig-lint.sh              # ← novo: lint JS/TS/HTML
│       └── fluig-ts-preference.sh     # ← novo: força TypeScript em projetos Angular
├── protheus/                          # Plugin Protheus (v1.6.0)
│   ├── .claude-plugin/plugin.json
│   ├── CLAUDE.md
│   ├── skills/                        # 13 skills
│   │   ├── protheus-init-project/
│   │   ├── protheus-brainstorm/       # gate de planejamento, intake MIT044
│   │   ├── protheus-writing-plans/    # decompõe design em tasks ADVPL-tipadas
│   │   ├── protheus-subagent-dev/     # orquestra subagentes + gate de patch
│   │   ├── protheus-writer/           # geração ADVPL/TLPP com padrões TBC
│   │   ├── protheus-specialist/       # especialista: MCP + TDN
│   │   ├── protheus-patterns/         # referência de padrões (via MCP)
│   │   ├── protheus-sql/              # SQL embarcado (via MCP)
│   │   ├── protheus-reviewer/         # revisão CRÍTICO/AVISO/SUGESTÃO
│   │   ├── protheus-migrate/          # ADVPL → TLPP orientado a objetos
│   │   ├── protheus-compile/          # lint + compilação TDS-CLI
│   │   ├── protheus-test-web/          # testes E2E via MCP Playwright com evidências
│   │   └── update-knowledge/          # atualiza base de conhecimento
│   ├── mcp-servers/
│   │   └── advpl-knowledge/           # MCP remoto (155k+ registros, 9 tools)
│   │       ├── start.sh               # Bootstrap: npm install + exec
│   │       ├── connect-remote.js      # Proxy stdio ↔ Streamable HTTP
│   │       └── package.json           # Dependências (@modelcontextprotocol/sdk)
│   ├── agents/                        # 3 subagents
│   └── hooks/
│       ├── hooks.json
│       ├── advpl-lint.sh              # lint ADVPL via advpls appre
│       └── advpl-encoding.sh          # validação de encoding CP-1252
└── confluence/                        # Plugin Confluence (v1.0.0)
    ├── CLAUDE.md
    └── skills/                        # 3 skills
        ├── confluence-tools/
        │   ├── SKILL.md
        │   └── scripts/
        │       ├── server.py          # MCP Server (Confluence Cloud API v2 + OAuth)
        │       └── requirements.txt
        ├── mit-doc-extractor/
        │   └── SKILL.md
        └── pdf-image-extractor/
            ├── SKILL.md
            └── scripts/
                └── pdf_image_extractor.py
├── mit-docs/                          # Plugin MIT-Docs (v1.0.0)
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── CLAUDE.md
│   ├── skills/                        # 2 skills
│   │   ├── mit044/                    # Especificação de Personalização (brainstorm → DOCX)
│   │   │   └── SKILL.md
│   │   └── mit010/                    # Termo de Validação (QA → DOCX)
│   │       └── SKILL.md
│   └── mcp-servers/
│       └── tbc-knowledge/             # MCP remoto (templates, exemplos, regras)
│           ├── start.sh
│           ├── connect-remote.js
│           └── package.json
├── jira/                              # Plugin Jira (v1.0.0)
│   └── SKILL.md                       # Documentação MCP Oficial (Rovo)
```
