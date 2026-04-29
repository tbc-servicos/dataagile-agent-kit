# Fluig Knowledge → MCP Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todo conhecimento do plugin Fluig (APIs, padrões, review rules, QA checks) para o banco SQLite do MCP server remoto (`mcp.totvstbc.com.br`), e configurar o plugin Fluig para usar o mesmo conector `tbc-knowledge`.

**Architecture:** O conhecimento será armazenado em 2 tabelas: `knowledge_patterns` (existente, com `platform='fluig'`) para padrões/convenções, e `fluig_api` (nova) para referência estruturada de APIs. As skills .md do Fluig passarão a referenciar o MCP em vez de conter conhecimento inline. O plugin Fluig compartilha o mesmo `start.sh` e `connect-remote.js` do diretório `protheus/mcp-servers/advpl-knowledge/`.

**Tech Stack:** Node.js, SQLite (better-sqlite3), MCP SDK, Shell script

---

## File Structure

### Novos arquivos
- `auth-server-skills/mcp-middleware/seed-fluig-knowledge.js` — Script para popular o banco com conhecimento Fluig
- `fluig/.mcp.json` — Config MCP do plugin Fluig (aponta para mesmo start.sh do Protheus)

### Arquivos modificados
- `auth-server-skills/mcp-middleware/tools.js` — Adicionar tools Fluig (`searchFluigApi`, `searchFluigPatterns`)
- `auth-server-skills/mcp-middleware/db.js` — Adicionar tabela `fluig_api` no schema

### Skills Fluig a simplificar (fase final)
- `fluig/skills/fluig-api-ref/SKILL.md`
- `fluig/skills/fluig-dataset/SKILL.md`
- `fluig/skills/fluig-form/SKILL.md`
- `fluig/skills/fluig-workflow/SKILL.md`
- `fluig/skills/fluig-widget/SKILL.md`

---

## Task 1: Criar tabela `fluig_api` no schema do banco

**Files:**
- Modify: `auth-server-skills/mcp-middleware/db.js`

- [ ] **Step 1: Ler o schema atual do db.js**

Verificar as tabelas existentes e o padrão de criação.

- [ ] **Step 2: Adicionar CREATE TABLE fluig_api**

```sql
CREATE TABLE IF NOT EXISTS fluig_api (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_name TEXT NOT NULL,       -- 'DatasetFactory', 'WCMAPI', 'CardAPI', 'FormAPI', etc.
  method_name TEXT NOT NULL,    -- 'getDataset', 'createConstraint', etc.
  signature TEXT,               -- 'DatasetFactory.getDataset(name, fields, constraints, order)'
  description TEXT,             -- descrição do método
  parameters TEXT,              -- JSON: [{"name":"p1","type":"String","desc":"..."}]
  return_type TEXT,             -- tipo de retorno
  example TEXT,                 -- código de exemplo
  category TEXT,                -- 'dataset', 'form', 'workflow', 'widget', 'rest', 'utility'
  platform TEXT DEFAULT 'fluig' -- sempre 'fluig'
);
```

- [ ] **Step 3: Testar localmente**

```bash
cd /home/jv/developments/tbc/auth-server-skills
node -e "const {createDb} = require('./mcp-middleware/db.js'); const db = createDb('/tmp/test-fluig.db'); console.log(db.prepare('PRAGMA table_info(fluig_api)').all());"
```

- [ ] **Step 4: Commit**

```bash
git add mcp-middleware/db.js
git commit -m "feat(mcp): add fluig_api table to schema"
```

---

## Task 2: Criar script de seed do conhecimento Fluig

**Files:**
- Create: `auth-server-skills/mcp-middleware/seed-fluig-knowledge.js`

- [ ] **Step 1: Criar o script de seed**

O script deve:
1. Ler o banco existente (ou criar novo)
2. Popular `fluig_api` com APIs do Fluig (DatasetFactory, WCMAPI, CardAPI, FormAPI, WorkflowAPI, ZoomAPI, REST, utilitários, jQuery masks)
3. Popular `knowledge_patterns` com `platform='fluig'` para padrões de código, naming, review rules, QA checks

Estrutura do script:
```javascript
// seed-fluig-knowledge.js
import Database from 'better-sqlite3';

const FLUIG_APIS = [
  // DatasetFactory
  { api_name: 'DatasetFactory', method_name: 'getDataset', signature: '...', ... },
  // WCMAPI
  { api_name: 'WCMAPI', method_name: 'get', signature: '...', ... },
  // ... todas as APIs
];

const FLUIG_PATTERNS = [
  // Naming
  { content: '...', skill: 'fluig-conventions', category: 'naming', platform: 'fluig' },
  // Error handling
  { content: '...', skill: 'fluig-conventions', category: 'error-handling', platform: 'fluig' },
  // Review rules
  { content: '...', skill: 'fluig-reviewer', category: 'review-rule', platform: 'fluig' },
  // QA checks
  { content: '...', skill: 'fluig-qa', category: 'qa-check', platform: 'fluig' },
  // ... todos os padrões extraídos das skills
];
```

Extrair conhecimento de:
- `fluig/skills/fluig-api-ref/SKILL.md` → APIs (se tiver conteúdo real)
- `fluig/skills/fluig-dataset/SKILL.md` → padrões dataset, templates, REST
- `fluig/skills/fluig-form/SKILL.md` → padrões formulário, validações, máscaras
- `fluig/skills/fluig-workflow/SKILL.md` → eventos BPM, variáveis sistema
- `fluig/skills/fluig-widget/SKILL.md` → Angular 19 + PO-UI, estrutura
- `fluig/agents/fluig-reviewer.md` → 43 review rules
- `fluig/agents/fluig-qa.md` → 18 QA edge cases
- `fluig/CLAUDE.md` → convenções obrigatórias
- Documentação TDN via RAG (APIs Fluig)

- [ ] **Step 2: Popular com dados reais**

Ler cada skill .md, extrair o conhecimento estruturado e codificar no script.

- [ ] **Step 3: Testar o seed localmente**

```bash
cd /home/jv/developments/tbc/auth-server-skills
node mcp-middleware/seed-fluig-knowledge.js /tmp/test-fluig.db
node -e "const db = require('better-sqlite3')('/tmp/test-fluig.db'); console.log('APIs:', db.prepare('SELECT COUNT(*) as n FROM fluig_api').get()); console.log('Patterns:', db.prepare('SELECT COUNT(*) as n FROM knowledge_patterns WHERE platform = ?').get('fluig'));"
```

- [ ] **Step 4: Commit**

```bash
git add mcp-middleware/seed-fluig-knowledge.js
git commit -m "feat(mcp): add Fluig knowledge seed script"
```

---

## Task 3: Adicionar tools Fluig no MCP server

**Files:**
- Modify: `auth-server-skills/mcp-middleware/tools.js`

- [ ] **Step 1: Adicionar definições de tools**

Adicionar ao array `TOOL_DEFINITIONS`:

```javascript
{
  name: 'searchFluigApi',
  description: 'Search Fluig API reference by API name, method, or category',
  inputSchema: {
    type: 'object',
    properties: {
      api_name: { type: 'string', description: 'API name (DatasetFactory, WCMAPI, CardAPI, FormAPI, etc.)' },
      method_name: { type: 'string', description: 'Method name (partial match)' },
      keyword: { type: 'string', description: 'Search in description and example' },
      category: { type: 'string', description: 'Category filter (dataset, form, workflow, widget, rest, utility)' },
      limit: { type: 'integer', description: 'Maximum results', default: 20 }
    }
  }
},
{
  name: 'searchFluigPatterns',
  description: 'Search Fluig code patterns, conventions, review rules, and QA checks',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Search in content' },
      skill: { type: 'string', description: 'Skill filter (fluig-conventions, fluig-reviewer, fluig-qa, fluig-dataset, fluig-form, fluig-workflow, fluig-widget)' },
      category: { type: 'string', description: 'Category filter (naming, error-handling, review-rule, qa-check, template, convention)' },
      limit: { type: 'integer', description: 'Maximum results', default: 20 }
    },
    required: ['keyword']
  }
}
```

- [ ] **Step 2: Adicionar handlers de query**

```javascript
function searchFluigApi({ api_name, method_name, keyword, category, limit = 20 }) {
  let query = 'SELECT * FROM fluig_api WHERE 1=1';
  const params = [];
  if (api_name) { query += ' AND api_name LIKE ?'; params.push(`%${api_name}%`); }
  if (method_name) { query += ' AND method_name LIKE ?'; params.push(`%${method_name}%`); }
  if (keyword) { query += ' AND (description LIKE ? OR example LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' LIMIT ?'; params.push(limit);
  return db.prepare(query).all(...params);
}

function searchFluigPatterns({ keyword, skill, category, limit = 20 }) {
  let query = "SELECT * FROM knowledge_patterns WHERE platform = 'fluig'";
  const params = [];
  if (keyword) { query += ' AND content LIKE ?'; params.push(`%${keyword}%`); }
  if (skill) { query += ' AND skill = ?'; params.push(skill); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' LIMIT ?'; params.push(limit);
  return db.prepare(query).all(...params);
}
```

- [ ] **Step 3: Adicionar cases no switch de dispatch**

```javascript
case 'searchFluigApi':
  result = handlers.searchFluigApi(args);
  break;
case 'searchFluigPatterns':
  result = handlers.searchFluigPatterns(args);
  break;
```

- [ ] **Step 4: Testar localmente**

```bash
cd /home/jv/developments/tbc/auth-server-skills
node --test test/mcp-middleware.test.js
```

- [ ] **Step 5: Commit**

```bash
git add mcp-middleware/tools.js
git commit -m "feat(mcp): add searchFluigApi and searchFluigPatterns tools"
```

---

## Task 4: Popular o banco no servidor remoto

**Files:**
- Nenhum arquivo novo — usar o seed script criado na Task 2

- [ ] **Step 1: Executar seed no banco remoto**

```bash
# Copiar o script para o servidor
rsync -av --exclude='node_modules' --exclude='data' \
  /home/jv/developments/tbc/auth-server-skills/ vps_auditor:/root/docker/auth-server/

# Executar o seed dentro do container
ssh vps_auditor "cd /root/docker/auth-server && \
  docker compose exec mcp-middleware node mcp-middleware/seed-fluig-knowledge.js /app/data/mcp-middleware.db"
```

- [ ] **Step 2: Verificar dados no banco**

```bash
ssh vps_auditor "cd /root/docker/auth-server && \
  docker compose exec mcp-middleware node -e \"
    const db = require('better-sqlite3')('/app/data/mcp-middleware.db');
    console.log('Fluig APIs:', db.prepare('SELECT COUNT(*) as n FROM fluig_api').get());
    console.log('Fluig Patterns:', db.prepare('SELECT COUNT(*) as n FROM knowledge_patterns WHERE platform = ?').get('fluig'));
  \""
```

- [ ] **Step 3: Rebuild e deploy**

```bash
ssh vps_auditor "cd /root/docker/auth-server && \
  docker compose build mcp-middleware && \
  docker compose up -d mcp-middleware"
```

- [ ] **Step 4: Re-seed admin**

```bash
ssh vps_auditor "cd /root/docker/auth-server && \
  docker compose exec mcp-middleware node mcp-middleware/seed-admin.js admin@tbc.com tbc@2026"
```

- [ ] **Step 5: Testar tools remotamente**

```bash
curl -s -X POST "https://mcp.totvstbc.com.br/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-user-email: joaov1tu@gmail.com" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

---

## Task 5: Configurar plugin Fluig para usar o MCP

**Files:**
- Create: `fluig/.mcp.json`

- [ ] **Step 1: Criar .mcp.json do Fluig**

```json
{
  "mcpServers": {
    "tbc-knowledge": {
      "type": "stdio",
      "command": "sh",
      "args": ["${CLAUDE_PLUGIN_ROOT}/../protheus/mcp-servers/advpl-knowledge/start.sh"]
    }
  }
}
```

> **Nota:** O path relativo `../protheus/` funciona porque ambos os plugins estão no mesmo marketplace. Se isso causar problema, copiar `start.sh` e `connect-remote.js` para um diretório compartilhado ou duplicar no Fluig.

- [ ] **Step 2: Testar a referência cruzada**

```bash
claude --plugin-dir /home/jv/developments/tbc/claude_skills/fluig
# Rodar /mcp e verificar se conecta
```

- [ ] **Step 3: Se path relativo falhar, duplicar o connector**

Copiar `start.sh`, `connect-remote.js` e `package.json` para `fluig/mcp-servers/tbc-knowledge/`.

- [ ] **Step 4: Bumpar versão do plugin Fluig**

Atualizar `fluig/.claude-plugin/plugin.json` com nova versão.

- [ ] **Step 5: Commit**

```bash
git add fluig/.mcp.json fluig/.claude-plugin/plugin.json
git commit -m "feat(fluig): add tbc-knowledge MCP connector"
```

---

## Task 6: Simplificar skills .md do Fluig

**Files:**
- Modify: `fluig/skills/fluig-api-ref/SKILL.md`
- Modify: `fluig/skills/fluig-dataset/SKILL.md`
- Modify: `fluig/skills/fluig-form/SKILL.md`
- Modify: `fluig/skills/fluig-workflow/SKILL.md`
- Modify: `fluig/skills/fluig-widget/SKILL.md`

- [ ] **Step 1: Atualizar fluig-api-ref**

Substituir conteúdo inline por chamadas ao MCP:

```markdown
## Referência de API

Consulte a API Fluig via MCP:
- `searchFluigApi({ api_name: "DatasetFactory" })` — métodos de dataset
- `searchFluigApi({ api_name: "WCMAPI" })` — API de formulário web
- `searchFluigApi({ category: "rest" })` — endpoints REST
- `searchFluigPatterns({ keyword: "máscara" })` — padrões jQuery mask
```

- [ ] **Step 2: Atualizar demais skills**

Para cada skill, mover o conhecimento de referência para chamadas MCP, mantendo apenas o fluxo/workflow da skill.

- [ ] **Step 3: Testar skills com MCP**

Verificar que as skills continuam funcionando corretamente com o conhecimento vindo do MCP.

- [ ] **Step 4: Commit**

```bash
git add fluig/skills/
git commit -m "refactor(fluig): simplify skills to use MCP knowledge"
```

---

## Task 7: Testes E2E e deploy final

- [ ] **Step 1: Testar Protheus continua funcionando**

```bash
claude --plugin-dir /home/jv/developments/tbc/claude_skills/protheus
# /mcp → verificar que as 9+2 tools (Protheus + Fluig) aparecem
# Testar: searchFunction, searchFluigApi, searchFluigPatterns
```

- [ ] **Step 2: Testar Fluig funciona**

```bash
claude --plugin-dir /home/jv/developments/tbc/claude_skills/fluig
# /mcp → verificar conexão
# Testar: searchFluigApi, searchFluigPatterns
```

- [ ] **Step 3: Verificar dashboard**

```bash
python3 -c "
from playwright.sync_api import sync_playwright
# Login e verificar que sessions dos dois plugins aparecem
"
```

- [ ] **Step 4: Push final**

```bash
git push origin main
```

- [ ] **Step 5: Atualizar plugins nas máquinas**

```bash
rm -rf ~/.claude/plugins/cache/claude-skills-tbc ~/.claude/plugins/marketplaces/claude-skills-tbc
claude plugin marketplace add git@bitbucket.org:fabricatbc/claude_skills.git
claude plugin install protheus@claude-skills-tbc
claude plugin install fluig@claude-skills-tbc
```
