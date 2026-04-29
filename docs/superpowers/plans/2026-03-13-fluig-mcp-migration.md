# Fluig MCP Server — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Create a `fluig-knowledge` MCP server following the Protheus pattern and migrate all 10 Fluig skills to use it. Skills with inline knowledge sections will be replaced by `search_knowledge()` MCP calls. All skills get `get_credentials()` for RAG access, replacing the current hardcoded `agentescraping.totvstbc.com.br` URL.

**Architecture:** Same as Protheus MCP, but simpler — only `knowledge_patterns` table, no ADVPL-specific tables. Two tools exposed: `search_knowledge` and `get_credentials`.

**Tech Stack:** Node.js ESM, `better-sqlite3`, `@modelcontextprotocol/sdk`, AES-256-GCM encryption, auth server `https://auth-claudecode.totvstbc.com.br/auth`

**Reference implementation:** `protheus/mcp-servers/advpl-knowledge/index.js`

---

## Skill Migration Map

| File | Current State | Change Required |
|------|--------------|-----------------|
| `fluig/skills/fluig-widget/SKILL.md` | RAG usa padrão antigo | Fix RAG pattern only |
| `fluig/skills/fluig-dataset/SKILL.md` | RAG usa padrão antigo | Fix RAG pattern only |
| `fluig/skills/fluig-form/SKILL.md` | RAG usa padrão antigo | Fix RAG pattern only |
| `fluig/skills/fluig-workflow/SKILL.md` | RAG usa padrão antigo | Fix RAG pattern only |
| `fluig/skills/fluig-test/SKILL.md` | RAG usa padrão antigo | Fix RAG pattern only |
| `fluig/skills/fluig-api-ref/SKILL.md` | RAG parcial | Fix RAG pattern only |
| `fluig/skills/fluig-brainstorm/SKILL.md` | inline knowledge + URL hardcoded | Remove inline + fix RAG |
| `fluig/skills/fluig-review/SKILL.md` | inline knowledge + URL hardcoded | Remove inline + fix RAG |
| `fluig/skills/fluig-verify/SKILL.md` | inline knowledge + URL hardcoded | Remove inline + fix RAG |
| `fluig/skills/fluig-init-project/SKILL.md` | inline knowledge + URL hardcoded | Remove inline + fix RAG |

## Padrão RAG (obrigatório em todas as skills)

```markdown
## Consulta TDN

Obtenha credenciais via MCP e consulte:
\`\`\`
get_credentials()  →  { rag_api_key, rag_search_url, rag_ask_url }
\`\`\`

**Busca semântica:**
\`\`\`bash
curl -s '<rag_search_url>?q=<query>&limit=5' -H 'Authorization: <rag_api_key>'
\`\`\`

**Pergunta contextual:**
\`\`\`bash
curl -s -X POST '<rag_ask_url>' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: <rag_api_key>' \
  -d '{"question": "<pergunta>"}'
\`\`\`

**Quando usar:** dúvida sobre API Fluig, comportamento de dataset, workflow BPM, formulários, integração com Protheus.
```

---

## Chunk 0 — MCP Server (fluig-knowledge)

### Task 0: Criar estrutura do MCP server

**Files:**
- Create: `fluig/mcp-servers/fluig-knowledge/package.json`
- Create: `fluig/mcp-servers/fluig-knowledge/schema.sql`
- Create: `fluig/mcp-servers/fluig-knowledge/index.js`
- Create: `fluig/mcp-servers/fluig-knowledge/parse-knowledge.js`
- Copy: `fluig/mcp-servers/fluig-knowledge/encrypt-db.js` (from `protheus/mcp-servers/advpl-knowledge/encrypt-db.js` verbatim)
- Create: `fluig/mcp-servers/fluig-knowledge/data/.gitkeep`
- Create: `fluig/mcp-servers/fluig-knowledge/.gitignore`

- [ ] Criar `package.json`:
```json
{
  "name": "fluig-knowledge-mcp",
  "version": "1.0.0",
  "description": "MCP server for encrypted Fluig knowledge base",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "parse:knowledge": "node parse-knowledge.js",
    "encrypt": "node encrypt-db.js",
    "test": "node --test test/"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "better-sqlite3": "^11.8.2"
  }
}
```

- [ ] Criar `schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS knowledge_patterns (
  id INTEGER PRIMARY KEY,
  skill TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT,
  platform TEXT DEFAULT 'fluig',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts
  USING fts5(title, content, keywords,
             content=knowledge_patterns,
             content_rowid=id);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge_patterns BEGIN
  INSERT INTO knowledge_fts(rowid, title, content, keywords)
    VALUES (new.id, new.title, new.content, new.keywords);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge_patterns BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, keywords)
    VALUES ('delete', old.id, old.title, old.content, old.keywords);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge_patterns BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, keywords)
    VALUES ('delete', old.id, old.title, old.content, old.keywords);
  INSERT INTO knowledge_fts(rowid, title, content, keywords)
    VALUES (new.id, new.title, new.content, new.keywords);
END;

CREATE INDEX IF NOT EXISTS idx_knowledge_skill    ON knowledge_patterns(skill);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_patterns(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_platform ON knowledge_patterns(platform);
```

- [ ] Copiar `encrypt-db.js` verbatim de `protheus/mcp-servers/advpl-knowledge/encrypt-db.js`

- [ ] Criar `index.js` — adaptado do Protheus, apenas 2 tools (`search_knowledge` + `get_credentials`), cache em `~/.config/tbc/fluig-auth.json`, DB env var `FLUIG_KNOWLEDGE_DB`, server name `fluig-knowledge`. Estrutura idêntica ao Protheus: `server.connect(transport)` ANTES de `setupDatabase()`, DB setup em background via Promise.

- [ ] Criar `parse-knowledge.js` — lê todos os `fluig/skills/*/SKILL.md`, extrai seções de conhecimento (não processo), insere em `knowledge_patterns`. Filtrar seções: `Consulta TDN`, `Passo N`, `Hard Gate`, `Fluxo`, `Quando usar`, `Como usar`, `Pré-requisitos`.

- [ ] Criar `.gitignore`:
```
data/*.db
!data/.gitkeep
node_modules/
```

- [ ] Instalar dependências:
```bash
cd fluig/mcp-servers/fluig-knowledge && npm install
```

- [ ] Rodar parser:
```bash
npm run parse:knowledge
# Esperado: entradas para fluig-widget, fluig-dataset, fluig-form, fluig-workflow, fluig-api-ref, fluig-init-project
```

- [ ] Encriptar o DB:
```bash
ENCRYPTION_KEY=$(node -e "
  import('fs').then(fs => {
    const d = JSON.parse(fs.readFileSync(process.env.HOME+'/.config/tbc/advpl-auth.json','utf8'));
    console.log(d.encryption_key);
  });
")
node encrypt-db.js encrypt data/fluig_knowledge.db data/fluig_knowledge.db.enc $ENCRYPTION_KEY
rm data/fluig_knowledge.db
ls -lh data/fluig_knowledge.db.enc
```

- [ ] Testar server:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node index.js 2>/dev/null
# Esperado: tools com search_knowledge e get_credentials
```

- [ ] Commit: `feat(fluig): add fluig-knowledge MCP server`

---

## Chunk 1 — Plugin Wiring

### Task 1: Conectar MCP ao plugin Fluig

**Files:**
- Create: `fluig/.mcp.json`
- Modify: `fluig/.claude-plugin/plugin.json`

- [ ] Criar `fluig/.mcp.json`:
```json
{
  "mcpServers": {
    "fluig-knowledge": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-servers/fluig-knowledge/index.js"]
    }
  }
}
```

- [ ] Atualizar `fluig/.claude-plugin/plugin.json` — adicionar `"mcpServers": "./.mcp.json"` e bumpar versão para `1.4.0`

- [ ] Verificar servidor sobe com `${CLAUDE_PLUGIN_ROOT}` resolvido:
```bash
CLAUDE_PLUGIN_ROOT=$(pwd)/fluig node fluig/mcp-servers/fluig-knowledge/index.js &
sleep 3 && kill %1
# Esperado: [server] MCP server started + [server] Database ready
```

- [ ] Commit: `feat(fluig): wire fluig-knowledge MCP no plugin`

---

## Chunk 2 — Skill Migration

### Task 2: Fix RAG em skills simples (sem remoção de conteúdo)

**Files:**
- Modify: `fluig/skills/fluig-widget/SKILL.md`
- Modify: `fluig/skills/fluig-dataset/SKILL.md`
- Modify: `fluig/skills/fluig-form/SKILL.md`
- Modify: `fluig/skills/fluig-workflow/SKILL.md`
- Modify: `fluig/skills/fluig-test/SKILL.md`
- Modify: `fluig/skills/fluig-api-ref/SKILL.md`

- [ ] Em cada arquivo: localizar seção de RAG/Consulta com URL hardcoded `agentescraping.totvstbc.com.br` ou `rag_api_url`
- [ ] Substituir pelo padrão RAG completo (ver topo do plano)
- [ ] Verificar ausência de `agentescraping` e `rag_api_url`
- [ ] Commit: `fix(fluig): todas as skills usam get_credentials para RAG`

### Task 3: Migrar skills com conteúdo inline

**Files:**
- Modify: `fluig/skills/fluig-brainstorm/SKILL.md`
- Modify: `fluig/skills/fluig-review/SKILL.md`
- Modify: `fluig/skills/fluig-verify/SKILL.md`
- Modify: `fluig/skills/fluig-init-project/SKILL.md`

Para cada arquivo:
- [ ] Ler o arquivo
- [ ] Remover seção RAG hardcoded e substituir pelo padrão
- [ ] Para `fluig-init-project`: renomear seção `Passo 2 — Gerar CLAUDE.md` para `## Template CLAUDE.md` (para o parser capturar), adicionar chamada: `search_knowledge({ skill: "fluig-init-project", keyword: "template claude.md" })`
- [ ] Commit: `refactor(fluig): skills inline migradas para MCP`

---

## Chunk 3 — Verificação

### Task 4: Verificação global e re-encrypt

- [ ] Grep: `grep -r "agentescraping\|rag_api_url" fluig/skills/` → deve retornar vazio
- [ ] Re-rodar parser após migração das skills (conteúdo mudou):
```bash
cd fluig/mcp-servers/fluig-knowledge && npm run parse:knowledge
```
- [ ] Re-encriptar DB com conteúdo atualizado
- [ ] Testar `search_knowledge` end-to-end:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_knowledge","arguments":{"skill":"fluig-widget","keyword":"template"}}}' | node index.js
```
- [ ] Push: `git push origin main`
- [ ] Atualizar plugin local: `CLAUDECODE="" claude plugin update fluig@claude-skills-tbc --scope user`
- [ ] Instalar `node_modules` no cache do plugin:
```bash
ls ~/.claude/plugins/cache/claude-skills-tbc/fluig/
# Instalar na versão nova
cd ~/.claude/plugins/cache/claude-skills-tbc/fluig/1.4.0/mcp-servers/fluig-knowledge
npm install --omit=dev
```
- [ ] Reiniciar Claude e verificar `/mcp` mostra `plugin:fluig:fluig-knowledge · ✔ connected`
- [ ] Commit final: `docs(fluig): migração completa para formato MCP v1.4`
