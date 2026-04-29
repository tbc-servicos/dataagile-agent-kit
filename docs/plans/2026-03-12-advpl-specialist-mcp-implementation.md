# MCP Centralizado com Auth + Knowledge Base Criptografada — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a centralized ADVPL/TLPP knowledge system with encrypted SQLite, remote auth server with admin panel, and local MCP server that decrypts and serves 10 tools.

**Architecture:** Parser extracts metadata from Protheus sources + SKILL.md knowledge + PDFs into SQLite. Database is AES-256-GCM encrypted. Auth server (Docker/Hostgator) validates dev email and returns decryption key. Local MCP server (stdio) caches auth for 7 days, decrypts in-memory, serves tools. Skills stripped to workflow-only.

**Tech Stack:** Node.js 20, Express, better-sqlite3, @modelcontextprotocol/sdk, crypto (native), pdf-parse, Docker

**Design doc:** `docs/plans/2026-03-12-centralized-mcp-auth-design.md`

---

## Block A: Knowledge Base Schema + Parsers

### Task 1: Project scaffolding + SQLite schema

**Files:**
- Create: `protheus/mcp-servers/advpl-knowledge/package.json`
- Create: `protheus/mcp-servers/advpl-knowledge/schema.sql`

**Step 1: Create directory structure**

```bash
mkdir -p protheus/mcp-servers/advpl-knowledge/{data,test}
```

**Step 2: Write package.json**

```json
{
  "name": "advpl-knowledge-mcp",
  "version": "1.0.0",
  "description": "MCP server for encrypted ADVPL/TLPP knowledge base",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "parse": "node parse-fontes.js",
    "parse:knowledge": "node parse-knowledge.js",
    "parse:pdfs": "node parse-pdfs.js",
    "encrypt": "node encrypt-db.js",
    "test": "node --test test/"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "better-sqlite3": "^11.8.2",
    "pdf-parse": "^1.1.1"
  }
}
```

**Step 3: Write schema.sql**

Full schema from design doc — all 9 tables + indexes:
```sql
-- Fontes padrao Protheus
CREATE TABLE IF NOT EXISTS functions (
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

CREATE TABLE IF NOT EXISTS endpoints (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT,
  namespace TEXT,
  function_name TEXT,
  file_path TEXT,
  module TEXT
);

CREATE TABLE IF NOT EXISTS smartview_objects (
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

CREATE TABLE IF NOT EXISTS exec_auto (
  id INTEGER PRIMARY KEY,
  caller_function TEXT,
  target_function TEXT,
  table_alias TEXT,
  module TEXT,
  file_path TEXT,
  line_number INTEGER
);

CREATE TABLE IF NOT EXISTS mvc_patterns (
  id INTEGER PRIMARY KEY,
  model_id TEXT NOT NULL,
  tables TEXT,
  primary_key TEXT,
  has_grid BOOLEAN,
  file_path TEXT,
  module TEXT
);

CREATE TABLE IF NOT EXISTS includes (
  id INTEGER PRIMARY KEY,
  include_name TEXT,
  file_path TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_patterns (
  id INTEGER PRIMARY KEY,
  skill TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  platform TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  source_file TEXT,
  content TEXT,
  section TEXT,
  page_number INTEGER,
  doc_type TEXT
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_functions_name ON functions(name);
CREATE INDEX IF NOT EXISTS idx_functions_module ON functions(module);
CREATE INDEX IF NOT EXISTS idx_functions_type ON functions(type);
CREATE INDEX IF NOT EXISTS idx_endpoints_path ON endpoints(path);
CREATE INDEX IF NOT EXISTS idx_endpoints_method ON endpoints(method);
CREATE INDEX IF NOT EXISTS idx_smartview_team ON smartview_objects(team);
CREATE INDEX IF NOT EXISTS idx_smartview_class ON smartview_objects(class_name);
CREATE INDEX IF NOT EXISTS idx_exec_auto_target ON exec_auto(target_function);
CREATE INDEX IF NOT EXISTS idx_exec_auto_table ON exec_auto(table_alias);
CREATE INDEX IF NOT EXISTS idx_mvc_model ON mvc_patterns(model_id);
CREATE INDEX IF NOT EXISTS idx_mvc_tables ON mvc_patterns(tables);
CREATE INDEX IF NOT EXISTS idx_includes_name ON includes(include_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_skill ON knowledge_patterns(skill);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_patterns(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_platform ON knowledge_patterns(platform);
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);
```

**Step 4: Install dependencies**

```bash
cd protheus/mcp-servers/advpl-knowledge && npm install
```

**Step 5: Commit**

```bash
git add protheus/mcp-servers/advpl-knowledge/package.json protheus/mcp-servers/advpl-knowledge/schema.sql protheus/mcp-servers/advpl-knowledge/package-lock.json
git commit -m "feat(protheus): scaffold advpl-knowledge MCP server with full SQLite schema"
```

---

### Task 2: Source parser — function + endpoint extractors

**Files:**
- Create: `protheus/mcp-servers/advpl-knowledge/parse-fontes.js`
- Create: `protheus/mcp-servers/advpl-knowledge/test/parse-fontes.test.js`

**Step 1: Write failing tests**

Create `test/parse-fontes.test.js` with tests for:
- `extractFunctions`: User Function with ProtheusDoc, Static Function, TLPP function with namespace, class + method definitions, empty source
- `extractEndpoints`: @Get with namespace, multiple endpoints, PUT/DELETE, no endpoints
- `extractSmartView`: annotation parsing (team, tables, displayName, country)
- `extractExecAuto`: MsExecAuto and ExecAuto calls with caller detection
- `extractMvcPatterns`: MPFormModel with SetPrimaryKey, AddGrid detection
- `extractIncludes`: #include directives

See the test code in the previous implementation plan (Task 2-4 tests) — same tests apply. Combine all into one test file.

**Step 2: Run tests to verify they fail**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/parse-fontes.test.js
```

**Step 3: Implement all extractors in parse-fontes.js**

Single file with all exports: `extractFunctions`, `extractEndpoints`, `extractSmartView`, `extractExecAuto`, `extractMvcPatterns`, `extractIncludes`, `parseSourceTree`.

Key implementation details:
- Regex patterns for ADVPL/TLPP syntax (User Function, Static Function, @Get/@Post, class/method, etc)
- ProtheusDoc extraction via `/*/{Protheus.doc}` blocks
- Namespace detection for TLPP files
- Line number calculation from match index
- `parseSourceTree(sourcesDir, dbPath, version)` — walks directory, reads files as `latin1`, extracts all patterns, writes to SQLite in a single transaction
- CLI entry point: `node parse-fontes.js <sources-dir> [db-path] [version]`

See the complete implementation code in previous plan Tasks 2-5 — reuse the same extractors and parseSourceTree.

**Step 4: Run tests to verify they pass**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/parse-fontes.test.js
```

**Step 5: Test against real fontes**

```bash
cd protheus/mcp-servers/advpl-knowledge && node parse-fontes.js /tmp/fontes_padroes_protheus/R2510-2026-Janeiro/fontes data/protheus_knowledge.db R2510-2026-Janeiro
```

Expected: ~11,928 files parsed, 30k+ functions, 300+ endpoints.

**Step 6: Commit**

```bash
git add protheus/mcp-servers/advpl-knowledge/parse-fontes.js protheus/mcp-servers/advpl-knowledge/test/parse-fontes.test.js
git commit -m "feat(protheus): add source parser for functions, endpoints, SmartView, ExecAuto, MVC, includes"
```

---

### Task 3: Knowledge parser — migrate .md content to SQLite

**Files:**
- Create: `protheus/mcp-servers/advpl-knowledge/parse-knowledge.js`
- Create: `protheus/mcp-servers/advpl-knowledge/test/parse-knowledge.test.js`

**Step 1: Write failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSkillContent, extractSections } from '../parse-knowledge.js';

describe('extractSections', () => {
  it('splits markdown into titled sections', () => {
    const md = `## Notacao Hungara\n\nContent here\n\n## Funcoes Nativas\n\nMore content`;
    const sections = extractSections(md);
    assert.strictEqual(sections.length, 2);
    assert.strictEqual(sections[0].title, 'Notacao Hungara');
    assert.ok(sections[0].content.includes('Content here'));
  });

  it('handles ### subsections by merging into parent', () => {
    const md = `## Main Section\n\nIntro\n\n### Sub A\n\nSub content`;
    const sections = extractSections(md);
    assert.strictEqual(sections.length, 1);
    assert.ok(sections[0].content.includes('Sub content'));
  });
});

describe('parseSkillContent', () => {
  it('extracts knowledge entries from a skill definition', () => {
    const result = parseSkillContent('advpl-patterns', 'protheus', `
---
name: advpl-patterns
description: test
---

## Notacao Hungara (OBRIGATORIA)

| Prefixo | Tipo |
|---------|------|
| c | Character |

## Consulta a Base de Conhecimento (TDN)

Use a API de RAG...
`);
    // Should extract Notacao Hungara but skip RAG section (workflow)
    assert.ok(result.length >= 1);
    assert.ok(result.some(r => r.title.includes('Notacao Hungara')));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/parse-knowledge.test.js
```

**Step 3: Implement parse-knowledge.js**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

// Sections to SKIP (workflow, not knowledge)
const SKIP_PATTERNS = [
  /consulta.*base.*conhecimento/i,
  /fluxo de trabalho/i,
  /quando usar/i,
  /como usar/i,
  /pre-requisitos/i,
  /^\s*---\s*$/,
];

/**
 * Split markdown into sections by ## headers.
 * ### subsections are merged into their parent ##.
 */
export function extractSections(markdown) {
  const sections = [];
  const lines = markdown.split('\n');
  let currentTitle = null;
  let currentContent = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = h2Match[1].trim();
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }
  return sections;
}

/**
 * Parse a single SKILL.md and return knowledge entries.
 */
export function parseSkillContent(skillName, platform, markdown) {
  // Remove frontmatter
  const stripped = markdown.replace(/^---[\s\S]*?---\s*/, '');
  const sections = extractSections(stripped);

  return sections
    .filter(s => !SKIP_PATTERNS.some(p => p.test(s.title)))
    .filter(s => s.content.length > 20) // skip trivially short sections
    .map(s => ({
      skill: skillName,
      category: categorize(s.title),
      title: s.title,
      content: s.content,
      tags: extractTags(s.content),
      platform
    }));
}

function categorize(title) {
  const t = title.toLowerCase();
  if (t.includes('notac') || t.includes('nomenclat') || t.includes('convenc')) return 'convention';
  if (t.includes('func') || t.includes('nativ')) return 'functions';
  if (t.includes('erro') || t.includes('soluc') || t.includes('problem')) return 'errors';
  if (t.includes('template') || t.includes('estrutura') || t.includes('padrao') || t.includes('pattern')) return 'template';
  if (t.includes('api') || t.includes('endpoint') || t.includes('dataset')) return 'api-ref';
  if (t.includes('mvc') || t.includes('browse') || t.includes('smartview')) return 'pattern';
  if (t.includes('sql') || t.includes('banco') || t.includes('tabela') || t.includes('dicion')) return 'database';
  if (t.includes('teste') || t.includes('test') || t.includes('tir') || t.includes('karma')) return 'testing';
  return 'reference';
}

function extractTags(content) {
  const tags = new Set();
  if (/advpl/i.test(content)) tags.add('advpl');
  if (/tlpp/i.test(content)) tags.add('tlpp');
  if (/fluig/i.test(content)) tags.add('fluig');
  if (/mvc/i.test(content)) tags.add('mvc');
  if (/sql/i.test(content)) tags.add('sql');
  if (/rest|endpoint|@get|@post/i.test(content)) tags.add('rest');
  if (/angular|po-ui/i.test(content)) tags.add('angular');
  if (/dataset/i.test(content)) tags.add('dataset');
  if (/widget/i.test(content)) tags.add('widget');
  if (/workflow/i.test(content)) tags.add('workflow');
  return Array.from(tags).join(',');
}

/**
 * Parse all SKILL.md files from plugin directories and write to SQLite.
 */
export async function parseAllKnowledge(pluginDirs, dbPath) {
  const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const db = new Database(dbPath);
  db.exec(schema);
  db.exec('DELETE FROM knowledge_patterns');

  const insert = db.prepare(
    `INSERT INTO knowledge_patterns (skill, category, title, content, tags, platform) VALUES (?, ?, ?, ?, ?, ?)`
  );

  let count = 0;
  const insertAll = db.transaction(() => {
    for (const { dir, platform } of pluginDirs) {
      const skillsDir = path.join(dir, 'skills');
      if (!fs.existsSync(skillsDir)) continue;

      for (const skillName of fs.readdirSync(skillsDir)) {
        const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
        if (!fs.existsSync(skillPath)) continue;

        const content = fs.readFileSync(skillPath, 'utf-8');
        const entries = parseSkillContent(skillName, platform, content);

        for (const e of entries) {
          insert.run(e.skill, e.category, e.title, e.content, e.tags, e.platform);
          count++;
        }
      }
    }
  });

  insertAll();
  db.close();
  return count;
}

// CLI
const isMain = process.argv[1]?.endsWith('parse-knowledge.js');
if (isMain) {
  const dbPath = process.argv[2] || 'data/protheus_knowledge.db';
  const baseDir = path.resolve(process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
  const pluginDirs = [
    { dir: path.join(baseDir, 'protheus'), platform: 'protheus' },
    { dir: path.join(baseDir, 'fluig'), platform: 'fluig' }
  ];
  console.log(`Parsing knowledge from: ${pluginDirs.map(d => d.dir).join(', ')}`);
  const count = await parseAllKnowledge(pluginDirs, dbPath);
  console.log(`Indexed ${count} knowledge entries into ${dbPath}`);
}
```

**Step 4: Run tests**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/parse-knowledge.test.js
```

**Step 5: Run against real skills**

```bash
cd protheus/mcp-servers/advpl-knowledge && node parse-knowledge.js data/protheus_knowledge.db /home/jv/developments/tbc/claude_skills
```

**Step 6: Verify content**

```bash
sqlite3 data/protheus_knowledge.db "SELECT skill, category, title, length(content) FROM knowledge_patterns ORDER BY skill"
```

**Step 7: Commit**

```bash
git add protheus/mcp-servers/advpl-knowledge/parse-knowledge.js protheus/mcp-servers/advpl-knowledge/test/parse-knowledge.test.js
git commit -m "feat(protheus): add knowledge parser that migrates SKILL.md content to SQLite"
```

---

### Task 4: PDF parser

**Files:**
- Create: `protheus/mcp-servers/advpl-knowledge/parse-pdfs.js`
- Create: `protheus/mcp-servers/advpl-knowledge/test/parse-pdfs.test.js`

**Step 1: Write failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parsePdfToEntries } from '../parse-pdfs.js';

describe('parsePdfToEntries', () => {
  it('returns empty for non-existent directory', async () => {
    const result = await parsePdfToEntries('/tmp/nonexistent-dir-xyz');
    assert.deepStrictEqual(result, []);
  });
});
```

**Step 2: Implement parse-pdfs.js**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * Parse all PDFs in a directory and return document entries.
 */
export async function parsePdfToEntries(pdfDir) {
  if (!fs.existsSync(pdfDir)) return [];

  const entries = [];
  const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));

  for (const file of files) {
    const fullPath = path.join(pdfDir, file);
    try {
      const buffer = fs.readFileSync(fullPath);
      const data = await pdf(buffer);
      const title = file.replace('.pdf', '');

      // Split by pages (approximate — pdf-parse gives full text)
      // We store as single entry per PDF for simplicity
      entries.push({
        title,
        source_file: file,
        content: data.text,
        section: null,
        page_number: null,
        doc_type: 'pdf'
      });
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`);
    }
  }
  return entries;
}

/**
 * Parse PDFs and write to SQLite.
 */
export async function parseAllPdfs(pdfDir, dbPath) {
  const schemaPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const db = new Database(dbPath);
  db.exec(schema);
  db.exec('DELETE FROM documents');

  const entries = await parsePdfToEntries(pdfDir);
  const insert = db.prepare(
    `INSERT INTO documents (title, source_file, content, section, page_number, doc_type) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const insertAll = db.transaction(() => {
    for (const e of entries) {
      insert.run(e.title, e.source_file, e.content, e.section, e.page_number, e.doc_type);
    }
  });
  insertAll();
  db.close();
  return entries.length;
}

// CLI
const isMain = process.argv[1]?.endsWith('parse-pdfs.js');
if (isMain) {
  const pdfDir = process.argv[2] || 'docs/material_treinamento';
  const dbPath = process.argv[3] || 'data/protheus_knowledge.db';
  console.log(`Parsing PDFs from: ${pdfDir}`);
  const count = await parseAllPdfs(pdfDir, dbPath);
  console.log(`Indexed ${count} documents into ${dbPath}`);
}
```

**Step 3: Run tests**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/parse-pdfs.test.js
```

**Step 4: Commit**

```bash
git add protheus/mcp-servers/advpl-knowledge/parse-pdfs.js protheus/mcp-servers/advpl-knowledge/test/parse-pdfs.test.js
git commit -m "feat(protheus): add PDF parser for training material documents"
```

---

### Task 5: Encryption utility

**Files:**
- Create: `protheus/mcp-servers/advpl-knowledge/encrypt-db.js`
- Create: `protheus/mcp-servers/advpl-knowledge/test/encrypt-db.test.js`

**Step 1: Write failing test**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { encryptFile, decryptToBuffer } from '../encrypt-db.js';

describe('encrypt/decrypt', () => {
  const testFile = '/tmp/test-encrypt-input.txt';
  const encFile = '/tmp/test-encrypt-output.enc';
  const testKey = 'a'.repeat(64); // 32 bytes hex

  it('encrypts and decrypts back to original', () => {
    fs.writeFileSync(testFile, 'Hello ADVPL Knowledge');
    encryptFile(testFile, encFile, testKey);

    assert.ok(fs.existsSync(encFile));
    const encContent = fs.readFileSync(encFile);
    assert.notStrictEqual(encContent.toString(), 'Hello ADVPL Knowledge');

    const decrypted = decryptToBuffer(encFile, testKey);
    assert.strictEqual(decrypted.toString(), 'Hello ADVPL Knowledge');

    fs.unlinkSync(testFile);
    fs.unlinkSync(encFile);
  });

  it('fails with wrong key', () => {
    fs.writeFileSync(testFile, 'Secret data');
    encryptFile(testFile, encFile, testKey);

    const wrongKey = 'b'.repeat(64);
    assert.throws(() => decryptToBuffer(encFile, wrongKey));

    fs.unlinkSync(testFile);
    fs.unlinkSync(encFile);
  });
});
```

**Step 2: Implement encrypt-db.js**

```javascript
import crypto from 'node:crypto';
import fs from 'node:fs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a file using AES-256-GCM.
 * Output format: [IV (16 bytes)][AuthTag (16 bytes)][Ciphertext]
 */
export function encryptFile(inputPath, outputPath, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const plaintext = fs.readFileSync(inputPath);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  fs.writeFileSync(outputPath, Buffer.concat([iv, authTag, encrypted]));
}

/**
 * Decrypt a file to a Buffer (in-memory).
 */
export function decryptToBuffer(encPath, hexKey) {
  const key = Buffer.from(hexKey, 'hex');
  const data = fs.readFileSync(encPath);

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Generate a random 256-bit key as hex string.
 */
export function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

// CLI
const isMain = process.argv[1]?.endsWith('encrypt-db.js');
if (isMain) {
  const command = process.argv[2];

  if (command === 'genkey') {
    console.log(generateKey());
  } else if (command === 'encrypt') {
    const input = process.argv[3];
    const output = process.argv[4] || input + '.enc';
    const key = process.argv[5] || process.env.ENCRYPTION_KEY;
    if (!input || !key) { console.error('Usage: encrypt-db.js encrypt <input> [output] [key]'); process.exit(1); }
    encryptFile(input, output, key);
    console.log(`Encrypted: ${input} → ${output}`);
  } else if (command === 'decrypt') {
    const input = process.argv[3];
    const output = process.argv[4];
    const key = process.argv[5] || process.env.ENCRYPTION_KEY;
    if (!input || !output || !key) { console.error('Usage: encrypt-db.js decrypt <input> <output> [key]'); process.exit(1); }
    const buf = decryptToBuffer(input, key);
    fs.writeFileSync(output, buf);
    console.log(`Decrypted: ${input} → ${output}`);
  } else {
    console.log('Usage: encrypt-db.js <genkey|encrypt|decrypt> [args]');
  }
}
```

**Step 3: Run tests**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/encrypt-db.test.js
```

**Step 4: Commit**

```bash
git add protheus/mcp-servers/advpl-knowledge/encrypt-db.js protheus/mcp-servers/advpl-knowledge/test/encrypt-db.test.js
git commit -m "feat(protheus): add AES-256-GCM encryption utility for knowledge base"
```

---

## Block B: Auth Server (Docker)

### Task 6: Auth server with SQLite + admin API

**Files:**
- Create: `auth-server/package.json`
- Create: `auth-server/schema.sql`
- Create: `auth-server/index.js`
- Create: `auth-server/test/auth.test.js`

**Step 1: Write package.json**

```json
{
  "name": "advpl-auth-server",
  "version": "1.0.0",
  "description": "Auth server for ADVPL knowledge base access control",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "test": "node --test test/"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.2",
    "express": "^5.1.0",
    "cookie-parser": "^1.4.7"
  }
}
```

**Step 2: Write schema.sql**

```sql
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_email ON access_logs(email);
CREATE INDEX IF NOT EXISTS idx_logs_status ON access_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_date ON access_logs(created_at);
```

**Step 3: Write failing tests**

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../index.js';

describe('POST /auth', () => {
  let app, server;

  before(async () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    process.env.RAG_API_KEY = 'Bearer test-key';
    process.env.RAG_API_URL = 'https://test.com/api/search';
    process.env.ADMIN_PASSWORD = 'admin123';
    app = createApp('/tmp/test-auth.db');
    server = app.listen(0);
  });

  after(() => { server.close(); });

  it('returns 403 for unknown email', async () => {
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@test.com' })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.error, 'denied_not_found');
  });

  it('returns keys for valid email', async () => {
    const port = server.address().port;
    // Add user first
    await fetch(`http://localhost:${port}/admin/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=admin123'
      },
      body: JSON.stringify({ email: 'dev@tbc.com', expires_at: '2099-12-31' })
    });

    const res = await fetch(`http://localhost:${port}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev@tbc.com' })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.encryption_key);
    assert.ok(body.rag_api_key);
    assert.ok(body.expires_at);
  });
});
```

**Step 4: Implement index.js**

Complete Express server with:
- `POST /auth` — validate email, log access, return keys or 403
- `GET /admin` — serve admin.html
- `POST /admin/login` — set cookie
- Admin CRUD: `GET/POST/PUT/DELETE /admin/api/users`
- `GET /admin/api/logs` — with status/days filters
- Auth middleware for admin routes (cookie-based)
- `createApp(dbPath)` exported for testing

**Step 5: Run tests**

```bash
cd auth-server && npm install && node --test test/
```

**Step 6: Commit**

```bash
git add auth-server/
git commit -m "feat(auth): add auth server with email whitelist, access logging, and admin API"
```

---

### Task 7: Admin panel HTML

**Files:**
- Create: `auth-server/public/admin.html`

**Step 1: Implement admin.html**

Single-page vanilla HTML/JS with:
- **Login form** (password → `POST /admin/login`)
- **Users tab**: table with email, expires_at, notes, created_at + Add/Edit/Delete buttons
- **Logs tab**: table with email, status, ip, created_at + filters (status dropdown, days input)
- `denied_not_found` rows highlighted red
- Responsive, clean CSS (no framework)
- All API calls via `fetch()` to `/admin/api/*`

**Step 2: Test manually**

```bash
cd auth-server && node index.js
# Open http://localhost:3000/admin
```

**Step 3: Commit**

```bash
git add auth-server/public/admin.html
git commit -m "feat(auth): add admin panel with users management and access logs"
```

---

### Task 8: Docker setup

**Files:**
- Create: `auth-server/Dockerfile`
- Create: `auth-server/docker-compose.yml`
- Create: `auth-server/.env.example`
- Create: `auth-server/.dockerignore`

**Step 1: Write Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN mkdir -p /app/data/backups

# Backup cron
RUN echo '0 3 * * * cp /app/data/auth.db /app/data/backups/auth_$(date +\%Y\%m\%d).db' >> /etc/crontabs/root \
 && echo '0 4 * * * ls -t /app/data/backups/*.db | tail -n +31 | xargs rm -f' >> /etc/crontabs/root

CMD ["sh", "-c", "crond && node index.js"]
EXPOSE 3000
```

**Step 2: Write docker-compose.yml**

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

**Step 3: Write .env.example**

```
ENCRYPTION_KEY=run_node_encrypt-db.js_genkey_to_generate
RAG_API_KEY=Bearer your-jwt-token-here
RAG_API_URL=https://agentescraping.totvstbc.com.br/api/search
ADMIN_PASSWORD=change-me
PORT=3000
```

**Step 4: Test Docker build**

```bash
cd auth-server && docker build -t advpl-auth . && docker run --rm -p 3000:3000 --env-file .env.example advpl-auth
```

**Step 5: Commit**

```bash
git add auth-server/Dockerfile auth-server/docker-compose.yml auth-server/.env.example auth-server/.dockerignore
git commit -m "feat(auth): add Docker setup with backup cron and compose"
```

---

## Block C: MCP Server (Local, with Auth + Decryption)

### Task 9: MCP server with auth + decryption + 10 tools

**Files:**
- Create: `protheus/mcp-servers/advpl-knowledge/index.js`
- Create: `protheus/mcp-servers/advpl-knowledge/test/mcp-server.test.js`

**Step 1: Write failing tests**

Test `createQueryHandlers` with all 10 tools (same as previous plan Task 6, plus `search_knowledge`, `search_documents`, `get_credentials`).

**Step 2: Implement index.js**

MCP server with:
- **Auth flow on startup**: check `~/.config/tbc/advpl-auth.json` cache → if expired/missing, get email from `CLAUDE_CODE_USER_EMAIL` env → `POST /auth` to auth server → cache response
- **Decryption**: read `.db.enc` → `decryptToBuffer()` with key from auth → write to temp file or use in-memory SQLite
- **10 tools**: search_function, find_endpoint, find_smartview, find_exec_auto, find_mvc_pattern, list_modules, search_by_table, search_knowledge, search_documents, get_credentials
- `createQueryHandlers(dbPath)` exported for testing (bypasses auth for tests)
- Auth server URL from env `AUTH_SERVER_URL` (configured in plugin.json)

**Step 3: Run tests**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/mcp-server.test.js
```

**Step 4: Commit**

```bash
git add protheus/mcp-servers/advpl-knowledge/index.js protheus/mcp-servers/advpl-knowledge/test/mcp-server.test.js
git commit -m "feat(protheus): add MCP server with auth + decryption + 10 query tools"
```

---

## Block D: Skills + Plugin Config

### Task 10: Register MCP in plugin.json + advpl-specialist + update-knowledge skills

**Files:**
- Modify: `protheus/.claude-plugin/plugin.json`
- Create: `protheus/skills/advpl-specialist/SKILL.md`
- Create: `protheus/skills/update-knowledge/SKILL.md`

**Step 1: Update plugin.json**

Add `mcpServers` section with `advpl-knowledge` server config. Bump version to `1.5.0`. Add `AUTH_SERVER_URL` env.

**Step 2: Write advpl-specialist skill**

Workflow-only SKILL.md that:
1. Classifies requirement type
2. Calls MCP tools (search_function, find_endpoint, etc)
3. Calls `get_credentials` for RAG API key
4. Calls RAG API with credentials
5. Calls `search_knowledge` for patterns/conventions
6. Presents analysis + generates code

**Step 3: Write update-knowledge skill**

Workflow-only SKILL.md that:
1. Clone/pull fontes_padroes_protheus
2. Run parse-fontes.js
3. Run parse-knowledge.js
4. Run parse-pdfs.js (if PDFs present)
5. Run encrypt-db.js
6. Commit + push

**Step 4: Commit**

```bash
git add protheus/.claude-plugin/plugin.json protheus/skills/advpl-specialist/SKILL.md protheus/skills/update-knowledge/SKILL.md
git commit -m "feat(protheus): add specialist + update-knowledge skills and register MCP in plugin"
```

---

### Task 11: Strip knowledge from SKILL.md files

**Files:**
- Modify: All 13 Protheus SKILL.md files (knowledge sections → "use MCP tool X")
- Modify: All 10 Fluig SKILL.md files (same treatment)

**Step 1: For each SKILL.md with knowledge content**

Replace knowledge sections with MCP tool references. Example for advpl-patterns:

**Before (733 lines):**
```markdown
## Notacao Hungara (OBRIGATORIA)
| Prefixo | Tipo | Exemplo |
| c | Character | cNome |
... (full table)
```

**After (~30 lines):**
```markdown
## Notacao Hungara
Para consultar a tabela completa de notacao hungara:
Use a tool `search_knowledge` do MCP advpl-knowledge:
search_knowledge({ skill: "advpl-patterns", category: "convention", keyword: "hungara" })
```

Apply same pattern to all knowledge sections in all 23 skills. Keep workflow/process sections intact.

Also remove the RAG API section from all skills (credentials now come from MCP `get_credentials` tool).

**Step 2: Verify skills still make sense**

Read each modified skill to confirm workflow is intact and MCP references are correct.

**Step 3: Commit**

```bash
git add protheus/skills/*/SKILL.md fluig/skills/*/SKILL.md
git commit -m "refactor(protheus,fluig): migrate knowledge from SKILL.md to encrypted SQLite, keep workflow only"
```

---

### Task 12: .gitignore + version bump + changelog

**Files:**
- Modify: `.gitignore`
- Modify: `CHANGELOG.md`
- Create: `protheus/mcp-servers/advpl-knowledge/data/.gitkeep`

**Step 1: Update .gitignore**

```
# MCP server
protheus/mcp-servers/*/node_modules/
auth-server/node_modules/
auth-server/data/
auth-server/.env

# Plaintext DB (only .enc goes in repo)
protheus/mcp-servers/advpl-knowledge/data/*.db
!protheus/mcp-servers/advpl-knowledge/data/*.db.enc
```

**Step 2: Update CHANGELOG.md**

Add v1.5.0 entry with all changes.

**Step 3: Commit**

```bash
git add .gitignore CHANGELOG.md protheus/mcp-servers/advpl-knowledge/data/.gitkeep
git commit -m "chore: bump v1.5.0 with centralized MCP, auth server, encrypted knowledge base"
```

---

## Block E: Build + Validate

### Task 13: Full build pipeline — parse + encrypt + validate

**Step 1: Generate encryption key**

```bash
cd protheus/mcp-servers/advpl-knowledge && node encrypt-db.js genkey
```
Save this key — it goes in auth-server `.env` and is NEVER committed.

**Step 2: Run all parsers**

```bash
cd protheus/mcp-servers/advpl-knowledge
node parse-fontes.js /tmp/fontes_padroes_protheus/R2510-2026-Janeiro/fontes data/protheus_knowledge.db R2510-2026-Janeiro
node parse-knowledge.js data/protheus_knowledge.db /home/jv/developments/tbc/claude_skills
node parse-pdfs.js /home/jv/developments/tbc/claude_skills/docs/material_treinamento data/protheus_knowledge.db
```

**Step 3: Verify database**

```bash
sqlite3 data/protheus_knowledge.db "SELECT key, value FROM metadata"
sqlite3 data/protheus_knowledge.db "SELECT COUNT(*) FROM functions"
sqlite3 data/protheus_knowledge.db "SELECT COUNT(*) FROM knowledge_patterns"
sqlite3 data/protheus_knowledge.db "SELECT COUNT(*) FROM documents"
```

**Step 4: Encrypt**

```bash
node encrypt-db.js encrypt data/protheus_knowledge.db data/protheus_knowledge.db.enc <YOUR-KEY>
```

**Step 5: Verify encryption**

```bash
# Should fail
sqlite3 data/protheus_knowledge.db.enc "SELECT 1"
# Should succeed
node encrypt-db.js decrypt data/protheus_knowledge.db.enc /tmp/test-decrypt.db <YOUR-KEY>
sqlite3 /tmp/test-decrypt.db "SELECT COUNT(*) FROM functions"
```

**Step 6: Run all tests**

```bash
cd protheus/mcp-servers/advpl-knowledge && node --test test/
cd auth-server && node --test test/
```

**Step 7: Commit encrypted database**

```bash
git add protheus/mcp-servers/advpl-knowledge/data/protheus_knowledge.db.enc
git commit -m "data(protheus): add encrypted knowledge base R2510-2026-Janeiro"
```

---

## Summary

| Task | Block | Component | Description |
|------|-------|-----------|-------------|
| 1 | A | Schema | SQLite schema + package.json |
| 2 | A | Parser | Source file extractors (functions, endpoints, SmartView, ExecAuto, MVC) |
| 3 | A | Parser | Knowledge parser (.md → SQLite) |
| 4 | A | Parser | PDF parser |
| 5 | A | Crypto | AES-256-GCM encrypt/decrypt utility |
| 6 | B | Auth | Express server + SQLite + admin API + access logs |
| 7 | B | Auth | Admin panel HTML (users + logs) |
| 8 | B | Auth | Docker setup (Dockerfile + compose + backup cron) |
| 9 | C | MCP | Local MCP server with auth + decryption + 10 tools |
| 10 | D | Skills | Plugin config + advpl-specialist + update-knowledge |
| 11 | D | Skills | Strip knowledge from 23 SKILL.md files |
| 12 | D | Infra | .gitignore + changelog + version bump |
| 13 | E | Build | Full pipeline: parse → encrypt → validate |
