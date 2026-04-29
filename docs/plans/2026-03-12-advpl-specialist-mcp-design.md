# Design: Especialista ADVPL/TLPP + MCP Knowledge Server

**Aprovado em:** 2026-03-12

## Visão Geral

Criar um sistema de conhecimento ADVPL/TLPP composto por:
1. **Parser** que extrai metadados dos fontes padrão Protheus (1.5GB) e gera SQLite (~100-200MB)
2. **MCP Server** que serve o SQLite e expõe tools de busca para os agentes
3. **Skill `/protheus:advpl-specialist`** que consulta MCP + RAG + advpl-patterns para gerar código de qualidade
4. **Skill `/protheus:update-knowledge`** que clona o repo de fontes padrão, reparsa e atualiza o .db

## Repositório de Fontes

- **Repo:** `git@bitbucket-totvs:fabricatbc/fontes_padroes_protheus.git`
- **Versão atual:** R2510-2026-Janeiro
- **Composição:** 9,172 .prw + 2,756 .tlpp + 1,566 .prx + 553 .ch
- **51 módulos** (adm, crm, fluig, etc)
- **Padrões encontrados:** 363 endpoints REST, 783 SmartView, 493 ExecAuto

## Componente 1: Parser (`parse-fontes.js`)

Script Node.js que lê recursivamente os fontes e gera SQLite.

**Extrai:**
- Funções (nome, tipo, parâmetros, retorno, módulo, arquivo, linha)
- Endpoints REST (@Get/@Post/@Put/@Delete, path, namespace)
- SmartView objects (classe, team, tabelas, namespace)
- ExecAuto (função chamada, tabela, módulo)
- MVC patterns (model_id, tabelas, primary_key)
- Includes (.ch utilizados)
- ProtheusDoc (cabeçalhos documentados)

## Componente 2: MCP Server (`advpl-knowledge/`)

MCP server Node.js que serve o SQLite.

**Tools:**
- `search_function` — Busca função por nome, módulo, versão
- `find_endpoint` — Busca endpoints REST por path ou keyword
- `find_smartview` — Busca SmartView objects por keyword ou team
- `find_exec_auto` — Busca ExecAuto por rotina ou tabela
- `find_mvc_pattern` — Busca padrões MVC por model_id ou tabela
- `list_modules` — Lista módulos disponíveis
- `search_by_table` — Busca tudo que usa uma tabela específica

## Componente 3: Skill `/protheus:advpl-specialist`

Fluxo:
1. Classifica requisito (endpoint REST | PE | SmartView | ExecAuto | outro)
2. Consulta MCP (fontes padrão indexados)
3. Complementa com RAG `/api/search` (TDN)
4. Consulta advpl-patterns (convenções TBC)
5. Apresenta análise + recomendação
6. Gera código seguindo padrão real

Regras:
- Endpoints REST → SEMPRE TLPP
- Antes de implementar → verificar ExecAuto e MVC existentes
- SmartView → seguir padrão IntegratedProvider
- Consultar advpl-patterns para notação húngara e nomenclatura

## Componente 4: SQLite Schema

```sql
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

CREATE INDEX idx_functions_name ON functions(name);
CREATE INDEX idx_functions_module ON functions(module);
CREATE INDEX idx_endpoints_path ON endpoints(path);
CREATE INDEX idx_smartview_team ON smartview_objects(team);
CREATE INDEX idx_exec_auto_target ON exec_auto(target_function);
CREATE INDEX idx_mvc_model ON mvc_patterns(model_id);
```

## Componente 5: Skill `/protheus:update-knowledge`

Fluxo:
1. git clone/pull de `git@bitbucket-totvs:fabricatbc/fontes_padroes_protheus.git`
2. Detecta versões disponíveis (pastas = versões)
3. Parseia os fontes via `parse-fontes.js`
4. Gera `protheus_knowledge.db` atualizado
5. Mostra diff vs versão anterior
6. Commit + push no claude_skills → marketplace atualiza devs
7. Limpa clone temporário

## RAG Integration

```
GET https://agentescraping.totvstbc.com.br/api/search?q=<query>&limit=5
Authorization: Bearer <token>
```

Token armazenado em variável de ambiente ou CLAUDE.md do projeto.

## Distribuição

O .db é distribuído junto com o plugin via marketplace Bitbucket.
Dev instala/atualiza → recebe .db atualizado automaticamente.

## Estrutura de Arquivos

```
protheus/
├─ .claude-plugin/plugin.json
├─ skills/
│   ├─ advpl-specialist/SKILL.md       (NOVA)
│   ├─ update-knowledge/SKILL.md       (NOVA)
│   ├─ advpl-patterns/SKILL.md         (existente)
│   └─ ...
├─ mcp-servers/
│   └─ advpl-knowledge/
│       ├─ package.json
│       ├─ index.js
│       └─ data/
│           └─ protheus_knowledge.db
└─ scripts/
    └─ parse-fontes.js
```
