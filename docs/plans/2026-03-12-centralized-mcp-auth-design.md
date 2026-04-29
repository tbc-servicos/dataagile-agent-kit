# Design: MCP Centralizado com Auth Server + Knowledge Base Criptografada

**Aprovado em:** 2026-03-12

## Visao Geral

Sistema de conhecimento ADVPL/TLPP com controle de acesso. Dados rodam 100% local (performance), autenticacao remota (controle). O conhecimento que hoje esta nos .md do plugin migra para um banco SQLite criptografado — sem a chave, o plugin e inutil.

## Arquitetura

```
┌─ Maquina do JV (build) ──────────────────────────┐
│  fontes_padroes_protheus/ + docs/material_treinamento/
│       ↓                                           │
│  parse-fontes.js  → funcoes, endpoints, MVC, etc  │
│  parse-knowledge.js → conteudo dos .md            │
│  parse-pdfs.js    → texto dos PDFs                │
│       ↓                                           │
│  protheus_knowledge.db (plaintext)                │
│       ↓                                           │
│  encrypt-db.js → protheus_knowledge.db.enc        │
│       (AES-256-GCM, chave so do JV)              │
│       ↓                                           │
│  git push → Bitbucket marketplace                 │
└───────────────────────────────────────────────────┘

┌─ Hostgator (Docker) ─────────────────────────────┐
│  auth-server/                                     │
│    POST /auth { email }                           │
│      → 200 { encryption_key, rag_api_key,         │
│              rag_api_url, expires_at }             │
│      → 403 "nao autorizado"                       │
│    + Loga TODA tentativa (granted/denied)         │
│    + Admin panel (whitelist + logs + expiracao)    │
│                                                   │
│  Stack: Node.js 20 + Express + SQLite             │
│  Banco: auth.db (users + access_logs)             │
│  Backup: cron diario, reten 30 dias              │
│  Persistencia: volume ./data no host              │
└───────────────────────────────────────────────────┘

┌─ Maquina do Dev ─────────────────────────────────┐
│  Plugin instalado via Bitbucket                   │
│    protheus_knowledge.db.enc (criptografado)      │
│                                                   │
│  MCP Server (stdio, local):                       │
│    1. Le cache ~/.config/tbc/advpl-auth.json      │
│    2. Se expirado (>7 dias) → POST /auth {email}  │
│    3. Descriptografa .db.enc em memoria            │
│    4. Serve tools normalmente                     │
│                                                   │
│  RAG API: chave vem do auth (nao do plugin)       │
└───────────────────────────────────────────────────┘
```

## Componentes

| # | Componente | Onde roda | Descricao |
|---|-----------|-----------|-----------|
| 1 | parse-fontes.js | Maquina JV | Parseia .prw/.tlpp → SQLite (funcoes, endpoints, SmartView, ExecAuto, MVC, includes) |
| 2 | parse-knowledge.js | Maquina JV | Migra conteudo dos SKILL.md → SQLite (patterns, templates, referencias) |
| 3 | parse-pdfs.js | Maquina JV | Extrai texto dos PDFs de treinamento → SQLite |
| 4 | encrypt-db.js | Maquina JV | Criptografa .db → .db.enc (AES-256-GCM) |
| 5 | auth-server | Docker Hostgator | Valida email + retorna keys + painel admin + logs |
| 6 | MCP Server (local) | Maquina dev (stdio) | Descriptografa + serve 9 tools |
| 7 | advpl-specialist skill | Plugin | Consulta MCP + RAG + patterns |
| 8 | update-knowledge skill | Maquina JV | Clone + parse + encrypt + push |
| 9 | Skills .md atualizadas | Plugin | So workflow, conhecimento migrado pro banco |

## Auth Server

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20 Alpine |
| Framework | Express |
| Banco | SQLite (better-sqlite3) |
| Frontend admin | HTML + vanilla JS |
| Container | Docker + docker-compose |
| Persistencia | Volume montado ./data |
| Backup | Cron diario, retem 30 dias |
| SSL | Reverse proxy (Nginx) ou Hostgator SSL |

### Schema auth.db

```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL,   -- granted, denied_not_found, denied_expired
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_logs_email ON access_logs(email);
CREATE INDEX idx_logs_status ON access_logs(status);
CREATE INDEX idx_logs_date ON access_logs(created_at);
```

### Endpoints

```
POST   /auth                        — { email } → { keys } ou 403 (publico)
GET    /admin                       — pagina HTML do painel (protegida)
POST   /admin/login                 — { password } → cookie sessao
GET    /admin/api/users             — lista emails
POST   /admin/api/users             — { email, expires_at, notes }
PUT    /admin/api/users/:email      — { expires_at, notes }
DELETE /admin/api/users/:email
GET    /admin/api/logs?status=denied&days=30
```

### Logs de Acesso

Toda chamada a `/auth` e logada:

| Campo | Descricao |
|-------|-----------|
| email | Email enviado na request |
| status | `granted`, `denied_not_found`, `denied_expired` |
| ip | IP do requisitante |
| created_at | Timestamp |

No admin panel: aba "Logs" com filtro por status e periodo. `denied_not_found` destacado em vermelho (compartilhamento indevido).

### Backup

```bash
# Cron diario as 3h
0 3 * * * cp /app/data/auth.db /app/data/backups/auth_$(date +%Y%m%d).db
# Retem 30 dias
0 4 * * * ls -t /app/data/backups/*.db | tail -n +31 | xargs rm -f
```

### Docker Compose

```yaml
services:
  auth-server:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file: .env
    restart: unless-stopped
```

### .env

```
ENCRYPTION_KEY=<chave-aes-256-gerada>
RAG_API_KEY=Bearer eyJhbG...
RAG_API_URL=https://agentescraping.totvstbc.com.br/api/search
ADMIN_PASSWORD=<senha-admin>
PORT=3000
```

## Knowledge Base SQLite

### Schema (protheus_knowledge.db)

```sql
-- Fontes padrao Protheus (do parse-fontes.js)
CREATE TABLE functions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  module TEXT,
  file_path TEXT,
  line_number INTEGER,
  parameters TEXT,
  return_type TEXT,
  protheus_doc TEXT,
  version TEXT
);

CREATE TABLE endpoints (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT,
  namespace TEXT,
  function_name TEXT,
  file_path TEXT,
  module TEXT
);

CREATE TABLE smartview_objects (
  id INTEGER PRIMARY KEY,
  class_name TEXT NOT NULL,
  namespace TEXT,
  team TEXT,
  tables TEXT,
  display_name TEXT,
  country TEXT,
  file_path TEXT,
  module TEXT
);

CREATE TABLE exec_auto (
  id INTEGER PRIMARY KEY,
  caller_function TEXT,
  target_function TEXT,
  table_alias TEXT,
  module TEXT,
  file_path TEXT,
  line_number INTEGER
);

CREATE TABLE mvc_patterns (
  id INTEGER PRIMARY KEY,
  model_id TEXT NOT NULL,
  tables TEXT,
  primary_key TEXT,
  has_grid BOOLEAN,
  file_path TEXT,
  module TEXT
);

CREATE TABLE includes (
  id INTEGER PRIMARY KEY,
  include_name TEXT,
  file_path TEXT
);

-- Conhecimento migrado dos .md (do parse-knowledge.js)
CREATE TABLE knowledge_patterns (
  id INTEGER PRIMARY KEY,
  skill TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  platform TEXT
);

-- PDFs de treinamento (do parse-pdfs.js)
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  source_file TEXT,
  content TEXT,
  section TEXT,
  page_number INTEGER,
  doc_type TEXT
);

-- Metadados do parse
CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indices
CREATE INDEX idx_functions_name ON functions(name);
CREATE INDEX idx_functions_module ON functions(module);
CREATE INDEX idx_functions_type ON functions(type);
CREATE INDEX idx_endpoints_path ON endpoints(path);
CREATE INDEX idx_endpoints_method ON endpoints(method);
CREATE INDEX idx_smartview_team ON smartview_objects(team);
CREATE INDEX idx_smartview_class ON smartview_objects(class_name);
CREATE INDEX idx_exec_auto_target ON exec_auto(target_function);
CREATE INDEX idx_exec_auto_table ON exec_auto(table_alias);
CREATE INDEX idx_mvc_model ON mvc_patterns(model_id);
CREATE INDEX idx_mvc_tables ON mvc_patterns(tables);
CREATE INDEX idx_includes_name ON includes(include_name);
CREATE INDEX idx_knowledge_skill ON knowledge_patterns(skill);
CREATE INDEX idx_knowledge_category ON knowledge_patterns(category);
CREATE INDEX idx_knowledge_platform ON knowledge_patterns(platform);
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_documents_type ON documents(doc_type);
```

## MCP Server — Tools

| # | Tool | Descricao |
|---|------|-----------|
| 1 | `search_function` | Busca funcoes por nome, modulo, tipo |
| 2 | `find_endpoint` | Busca endpoints REST por path, metodo |
| 3 | `find_smartview` | Busca SmartView por keyword, team |
| 4 | `find_exec_auto` | Busca ExecAuto por rotina, tabela |
| 5 | `find_mvc_pattern` | Busca MVC por model_id, tabela |
| 6 | `list_modules` | Lista modulos disponiveis |
| 7 | `search_by_table` | Cross-search por alias de tabela |
| 8 | `search_knowledge` | Busca patterns, templates, referencias (migrado dos .md) |
| 9 | `search_documents` | Busca nos PDFs de treinamento |
| 10 | `get_credentials` | Retorna RAG API key + URL (do cache de auth) |

## Migracao dos .md

### Migram para o banco (conhecimento)

| Skill .md | Conteudo que migra |
|-----------|-------------------|
| advpl-patterns | Notacao hungara, nomenclatura, funcoes nativas, PEs por modulo, erros, dicionario, MVC, FWMBrowse, semaforos |
| advpl-sql | BeginSQL, macros, TCQuery, TCSqlExec, regras SQL |
| advpl-writer | Templates de codigo, regras de geracao |
| protheus-diagnose | Tabelas de erros compilacao/runtime/performance/locks |
| protheus-migrate | Mapeamento tipos ADVPL→TLPP, padroes de migracao |
| protheus-test | TIR 2.x API, config.json, metodos webapp, problemas comuns |
| protheus-reviewer | Checklist de revisao (vira regras consultaveis) |
| fluig-api-ref | DatasetFactory, WCMAPI, ConstraintType |
| fluig-dataset | Templates dataset, padroes REST, error row |
| fluig-widget | Angular 19 + PO-UI templates, package.json, service HTTP |
| fluig-form | HTML templates, enableFields, validateForm, SweetAlert2 |
| fluig-workflow | Eventos, afterStateEntry, notificacoes |
| fluig-test | Karma config, spec templates, Playwright E2E |

### Ficam no .md (so workflow)

| Skill .md | Conteudo que permanece |
|-----------|----------------------|
| Todos os SKILL.md | Workflow + instrucoes: "use tool X do MCP para Y" |
| Agents .md | Sem mudanca (ja sao workflow) |
| CLAUDE.md | Sem mudanca (config local) |
| protheus-brainstorm | Processo de design (sem dados) |
| protheus-compile | Execucao local do advpls (sem dados) |
| protheus-init-project | Entrevista + geracao CLAUDE.md |
| protheus-writing-plans | Decomposicao de tarefas |
| protheus-subagent-dev | Orquestracao de subagentes |
| fluig-brainstorm | Processo de design |
| fluig-review | Orquestracao de review |
| fluig-verify | Checklist de deploy |
| fluig-init-project | Entrevista + geracao CLAUDE.md |

## Fluxo de Seguranca

```
Dev instala plugin → MCP inicia → verifica cache (7 dias)
  ├─ Cache valido → descriptografa .db.enc → serve tools
  └─ Cache expirado/inexistente
       ↓
     Obtem email da conta Claude Code
       ↓
     POST /auth { email }
       ├─ 200 { keys } → salva cache → descriptografa → serve
       ├─ 403 not_found → log "denied_not_found" → MCP falha
       └─ 403 expired → log "denied_expired" → MCP falha
```

Revogacao: remover email do admin panel → na proxima revalidacao (max 7 dias), dev perde acesso.

## Cache Local

```json
// ~/.config/tbc/advpl-auth.json
{
  "email": "dev@tbc.com.br",
  "encryption_key": "base64...",
  "rag_api_key": "Bearer eyJhbG...",
  "rag_api_url": "https://agentescraping.totvstbc.com.br/api/search",
  "expires_at": "2026-03-19T14:30:00Z",
  "cached_at": "2026-03-12T14:30:00Z"
}
```

## Estrutura de Arquivos Final

```
protheus/
├─ .claude-plugin/plugin.json
├─ CLAUDE.md
├─ agents/
│   ├─ advpl-expert.md
│   ├─ protheus-reviewer.md
│   └─ protheus-deployer.md
├─ skills/
│   ├─ advpl-specialist/SKILL.md       (NOVA — consulta MCP + RAG)
│   ├─ update-knowledge/SKILL.md       (NOVA — clone + parse + encrypt)
│   ├─ advpl-patterns/SKILL.md         (REDUZIDA — so workflow)
│   ├─ advpl-writer/SKILL.md           (REDUZIDA — so workflow)
│   ├─ advpl-sql/SKILL.md              (REDUZIDA — so workflow)
│   └─ ... (demais skills reduzidas)
├─ mcp-servers/
│   └─ advpl-knowledge/
│       ├─ package.json
│       ├─ index.js                     (MCP server + descriptografia)
│       ├─ schema.sql
│       ├─ parse-fontes.js             (parser fontes padrao)
│       ├─ parse-knowledge.js          (parser .md → SQLite)
│       ├─ parse-pdfs.js               (parser PDFs)
│       ├─ encrypt-db.js               (criptografia AES-256-GCM)
│       ├─ test/
│       └─ data/
│           └─ protheus_knowledge.db.enc
├─ hooks/
│   └─ ... (existentes)
└─ scripts/
    └─ ... (existentes)

auth-server/                            (repo separado — Docker Hostgator)
├─ Dockerfile
├─ docker-compose.yml
├─ index.js
├─ public/
│   └─ admin.html
├─ data/
│   ├─ auth.db
│   └─ backups/
└─ .env
```

## Distribuicao

1. JV recebe fontes da matriz → roda update-knowledge → .db.enc atualizado no plugin
2. git push → Bitbucket marketplace atualiza
3. Devs fazem pull/install → recebem .db.enc novo
4. MCP revalida auth a cada 7 dias → descriptografa → serve
