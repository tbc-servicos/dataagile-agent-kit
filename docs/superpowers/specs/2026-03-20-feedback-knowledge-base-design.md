# Spec: Developer Feedback → Knowledge Base
**Data:** 2026-03-20
**Status:** Aprovado
**Escopo:** Plugin Protheus e Fluig

---

## Problema

Quando Claude erra e um dev corrige, esse aprendizado se perde. Com um time de 17 devs, o mesmo erro pode se repetir com outros desenvolvedores ou em outras sessões. Não existe mecanismo para capturar correções e retroalimentar a base de conhecimento.

---

## Solução

Um fluxo de feedback deliberado e confirmado:

1. Dev corrige Claude durante desenvolvimento
2. Claude propõe registrar o aprendizado (ou dev invoca `/protheus:feedback` / `/fluig:feedback`)
3. Claude gera rascunho estruturado, dev edita/aprova
4. Claude chama MCP tool `submitFeedback` → persiste no `mcp-middleware.db`
5. Feedback fica imediatamente disponível para todos os 17 devs via `searchKnowledge`
6. Painel admin exibe histórico de feedbacks por dev, data e conteúdo

---

## Arquitetura

```
Dev corrige Claude
        │
        ▼
/protheus:feedback ou /fluig:feedback (skill — claude_skills)
  1. Confirma com dev o que estava errado
  2. Propõe rascunho estruturado
  3. Dev aprova ou edita
        │
        ▼
submitFeedback MCP tool (auth-server-skills)
  email/hostname resolvidos via resolveEmail() já existente
        │
        ├─→ INSERT em feedback (mcp-middleware.db)
        │
        ├─→ searchKnowledge() consulta feedback + knowledge_patterns
        │   → disponível imediatamente para todos os devs
        │   → feedback Protheus visível apenas em sessões Protheus
        │   → feedback Fluig visível apenas em sessões Fluig
        │
        └─→ /admin/feedbacks → aba no painel admin
            dev, hostname, data, plugin, erro, regra
```

---

## Parte 1: Skills (claude_skills)

### 1.1 Skill `/protheus:feedback`

**Arquivo:** `protheus/skills/feedback/SKILL.md`

#### Quando usar

- Claude percebe que foi corrigido por um dev durante desenvolvimento
- Dev invoca explicitamente `/protheus:feedback`

#### Fluxo

```
Passo 1 — Confirmar intenção
  Claude: "Posso registrar esse aprendizado na base de conhecimento
           para que outros devs não recebam a mesma resposta errada?"
  Dev: confirma

Passo 2 — Gerar rascunho estruturado
  Claude analisa o contexto da conversa e propõe:

  ❌ ERRO: <o que Claude gerou de incorreto>
  📍 CONTEXTO: <situação — rotina, módulo, padrão envolvido>
  ✅ REGRA: <o que está correto, de forma prescritiva>
  💻 EXEMPLO ERRADO:
     <código ou instrução incorreta>
  💻 EXEMPLO CORRETO:
     <código ou instrução correta>
  🏷 TAGS: <palavras-chave para busca — ex: ExecAuto, MATA010, ErrorBlock>

Passo 3 — Dev revisa
  Claude: "Esse rascunho está correto? Pode editar qualquer campo."
  Dev: aprova ou corrige

Passo 4 — Submeter
  Claude chama: submitFeedback({
    plugin:      'protheus',
    error:       <campo ERRO>,
    context:     <campo CONTEXTO>,
    rule:        <campo REGRA>,
    example_bad: <EXEMPLO ERRADO ou null>,
    example_ok:  <EXEMPLO CORRETO ou null>,
    tags:        <TAGS separadas por vírgula>
  })

Passo 5 — Confirmar ou tratar erro
  Sucesso → Claude: "✅ Aprendizado #<ID> registrado e disponível para todos os devs agora."
  Falha   → Claude: "⚠️ Não foi possível registrar: <motivo>. O rascunho foi preservado:
             [exibir rascunho completo para o dev copiar manualmente]"
```

#### Regras

- **Nunca submeter sem confirmação explícita do dev**
- Se o dev recusar registrar, não insistir
- Claude pode invocar proativamente após perceber uma correção, mas nunca de forma automática
- Se `submitFeedback` falhar, exibir o rascunho completo para não perder o conteúdo
- Tags devem conter termos que Claude usaria ao buscar durante desenvolvimento

### 1.2 Skill `/fluig:feedback`

**Arquivo:** `fluig/skills/feedback/SKILL.md`

Fluxo idêntico ao `/protheus:feedback`, com as seguintes diferenças:

- `plugin: 'fluig'` no `submitFeedback`
- Exemplos de ERRO/REGRA/TAGS usam terminologia Fluig (datasets, widgets, workflows, FormController, fluigc, etc.)
- Feedback Fluig só aparece em buscas realizadas em sessões conectadas ao endpoint `/mcp` com `platform: 'fluig'`

---

## Parte 2: Mudanças no MCP (auth-server-skills)

> **Entrega para o desenvolvedor do repositório `auth-server-skills`.**
> Todas as alterações ficam no `mcp-middleware`. O `auth-server` (porta 9291) não é alterado.

---

### 2.1 Schema — Nova tabela `feedback`

**Arquivo:** `schema-mcp.sql` — adicionar ao final do arquivo existente.

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  plugin       TEXT NOT NULL CHECK(plugin IN ('protheus', 'fluig')),
  email        TEXT NOT NULL,
  hostname     TEXT,
  error        TEXT NOT NULL,
  context      TEXT,
  rule         TEXT NOT NULL,
  example_bad  TEXT,
  example_ok   TEXT,
  tags         TEXT NOT NULL,
  created_at   DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_plugin ON feedback(plugin);
CREATE INDEX IF NOT EXISTS idx_feedback_email  ON feedback(email);
CREATE INDEX IF NOT EXISTS idx_feedback_tags   ON feedback(tags);
```

**Migration em produção** — executar com o container ativo (SQLite suporta DDL concorrente com leituras):

```bash
sqlite3 /caminho/mcp-middleware.db \
  "CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plugin TEXT NOT NULL CHECK(plugin IN ('protheus','fluig')),
    email TEXT NOT NULL, hostname TEXT,
    error TEXT NOT NULL, context TEXT,
    rule TEXT NOT NULL, example_bad TEXT, example_ok TEXT,
    tags TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_feedback_plugin ON feedback(plugin);
  CREATE INDEX IF NOT EXISTS idx_feedback_email  ON feedback(email);
  CREATE INDEX IF NOT EXISTS idx_feedback_tags   ON feedback(tags);"
```

Verificar sucesso:
```bash
sqlite3 /caminho/mcp-middleware.db ".tables" | grep feedback
```

---

### 2.2 Novo MCP Tool `submitFeedback`

**Arquivo:** `mcp-middleware/tools.js`

#### Definição do tool

```javascript
{
  name: 'submitFeedback',
  description: 'Registra um aprendizado de correção na base de conhecimento. ' +
               'Usar SOMENTE após o dev confirmar explicitamente o conteúdo aprovado. ' +
               'O feedback fica imediatamente disponível para todos os devs via searchKnowledge.',
  inputSchema: {
    type: 'object',
    properties: {
      plugin:      { type: 'string', enum: ['protheus', 'fluig'],
                     description: 'Plugin de origem do feedback' },
      error:       { type: 'string', maxLength: 2000,
                     description: 'O que Claude gerou de incorreto' },
      context:     { type: 'string', maxLength: 2000,
                     description: 'Situação em que ocorreu o erro (rotina, módulo, padrão). Opcional.' },
      rule:        { type: 'string', maxLength: 2000,
                     description: 'Regra correta de forma prescritiva' },
      example_bad: { type: 'string', maxLength: 4000,
                     description: 'Código/instrução incorreta. Opcional.' },
      example_ok:  { type: 'string', maxLength: 4000,
                     description: 'Código/instrução correta. Opcional.' },
      tags:        { type: 'string', maxLength: 500,
                     description: 'Palavras-chave separadas por vírgula' }
    },
    required: ['plugin', 'error', 'rule', 'tags']
  }
}
```

#### Handler

```javascript
case 'submitFeedback': {
  try {
    const { plugin, error, context, rule, example_bad, example_ok, tags } = args;

    // email e hostname: usar o objeto session já resolvido por resolveEmail()
    // Para CLI (X-User-Email): session.email vem do header; session.hostname do x-hostname
    // Para Bearer mcp_xxx / oat_xxx: session.email resolvido via lookup de token;
    //   session.hostname será null (não há header x-hostname nesse fluxo)
    const email    = session?.email    ?? 'unknown';
    const hostname = session?.hostname ?? null;

    // Validação server-side: plugin deve corresponder ao que a sessão usa.
    // Ambos protheus e fluig conectam em /mcp, a distinção é pelo platform
    // passado na sessão (se disponível). Por ora, aceitar o plugin informado pelo tool.
    // TODO (futuro): validar session.platform === plugin se o middleware expuser isso.

    const stmt = db.prepare(`
      INSERT INTO feedback (plugin, email, hostname, error, context, rule, example_bad, example_ok, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      plugin,
      email,
      hostname,
      error,
      context     ?? null,
      rule,
      example_bad ?? null,
      example_ok  ?? null,
      tags
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: result.lastInsertRowid,
          message: `Feedback #${result.lastInsertRowid} registrado com sucesso. ` +
                   `Disponível para todos os devs imediatamente via searchKnowledge.`
        })
      }]
    };

  } catch (err) {
    // Retornar erro legível para Claude exibir ao dev (não silenciar)
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: true,
          message: `Falha ao registrar feedback: ${err.message}`
        })
      }],
      isError: true
    };
  }
}
```

---

### 2.3 Atualizar `searchKnowledge` para incluir feedback

**Arquivo:** `mcp-middleware/tools.js` — handler do tool `searchKnowledge`

O parâmetro `platform` existente em `searchKnowledge` é usado para filtrar feedbacks pelo plugin (protheus/fluig). Adicionar após a query existente:

```javascript
// --- ADICIONAR após a query existente de knowledge_patterns ---

// Buscar feedbacks relevantes (top 10, mais recentes primeiro)
// platform aqui é 'protheus' ou 'fluig', já existente como parâmetro do tool
const feedbackPlugin = platform ?? 'protheus';

const feedbackResults = db.prepare(`
  SELECT
    'feedback'   AS source,
    (error || COALESCE(' | CONTEXTO: ' || context, '')
           || ' | REGRA: ' || rule
           || COALESCE(' | EXEMPLO OK: ' || example_ok, '')) AS content,
    plugin       AS skill,
    'correction' AS category,
    plugin       AS platform,
    email,
    created_at
  FROM feedback
  WHERE plugin = ?
    AND (error LIKE ? OR rule LIKE ? OR tags LIKE ? OR context LIKE ?)
  ORDER BY created_at DESC
  LIMIT 10
`).all(feedbackPlugin,
       `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

// Retornar feedbacks primeiro (mais recentes e diretamente relevantes),
// seguidos dos resultados da knowledge_patterns.
// Nota: limit aplica-se separadamente — feedback max 10, knowledge usa o limit original.
return [...feedbackResults, ...knowledgeResults];
```

> **Compatibilidade:** A query existente de `knowledge_patterns` não é alterada. O retorno apenas concatena os dois arrays. Clientes que não esperam o campo `source` ignorarão sem problema.

---

### 2.4 Endpoints admin para Feedbacks

**Arquivo:** `mcp-middleware/admin-api.js`

```javascript
// GET /admin/feedbacks?plugin=protheus&email=joao@&page=1
app.get('/admin/feedbacks', requireAdmin, (req, res) => {
  const { plugin, email, page = 1 } = req.query;
  const limit  = 50;
  const offset = (page - 1) * limit;

  // Construir WHERE dinâmico (igual para dados e contagem total filtrada)
  let where  = 'WHERE 1=1';
  let params = [];

  if (plugin) { where += ' AND plugin = ?';      params.push(plugin); }
  if (email)  { where += ' AND email LIKE ?';     params.push(`%${email}%`); }

  const rows  = db.prepare(
    `SELECT * FROM feedback ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  // Contar com os mesmos filtros (paginação correta)
  const total = db.prepare(
    `SELECT COUNT(*) as n FROM feedback ${where}`
  ).get(...params).n;

  res.json({ rows, total, page: Number(page), limit });
});

// DELETE /admin/feedbacks/:id
app.delete('/admin/feedbacks/:id', requireAdmin, (req, res) => {
  const { changes } = db.prepare('DELETE FROM feedback WHERE id = ?').run(req.params.id);
  if (changes === 0) return res.status(404).json({ error: 'Feedback não encontrado' });
  res.json({ ok: true });
});
```

---

### 2.5 Aba "Feedbacks" no painel admin

**Arquivo:** `admin/dashboard.html`

Adicionar ao menu de navegação e implementar a aba com:

- **Filtros:** plugin (select: todos / protheus / fluig), email (text input), período (date range)
- **Tabela:**

| # | Plugin | Dev (email) | Hostname | Data | Erro | Regra | Tags | Ações |
|---|--------|-------------|----------|------|------|-------|------|-------|

- Colunas `Erro` e `Regra` truncadas com `...` — clicar expande linha para ver `context`, `example_bad`, `example_ok` completos
- Botão `🗑 Remover` por linha — chama `DELETE /admin/feedbacks/:id`
- Paginação usando `total` e `limit` retornados pela API

---

## Isolamento Protheus × Fluig

Ambos os plugins (`protheus:tbc-knowledge` e `fluig:tbc-knowledge`) conectam na mesma rota `/mcp`. A separação de feedbacks é feita pelo campo `plugin`:

- `searchKnowledge` chamado de uma sessão Protheus usa `platform: 'protheus'` → retorna apenas feedbacks `plugin = 'protheus'`
- `searchKnowledge` chamado de uma sessão Fluig usa `platform: 'fluig'` → retorna apenas feedbacks `plugin = 'fluig'`
- No `submitFeedback`, a skill sempre passa o plugin correto (`protheus` ou `fluig`) hardcoded no SKILL.md

---

## Resumo das Entregas

### claude_skills (implementar neste repo)

| Arquivo | Ação |
|---------|------|
| `protheus/skills/feedback/SKILL.md` | Criar skill com fluxo completo |
| `fluig/skills/feedback/SKILL.md` | Criar skill (idêntica, `plugin: 'fluig'`, exemplos Fluig) |

### auth-server-skills (outro desenvolvedor)

| Arquivo | Ação |
|---------|------|
| `schema-mcp.sql` | Adicionar tabela `feedback` + índices |
| Migration | Executar SQL direto no banco de produção (container não precisa parar) |
| `mcp-middleware/tools.js` | Adicionar tool `submitFeedback` com try/catch |
| `mcp-middleware/tools.js` | Atualizar `searchKnowledge`: UNION com `feedback` por `platform` |
| `mcp-middleware/admin-api.js` | Endpoints `GET /admin/feedbacks` e `DELETE /admin/feedbacks/:id` |
| `admin/dashboard.html` | Aba "Feedbacks" com tabela, filtros e paginação |

---

## Critérios de Aceite

- [ ] Dev invoca `/protheus:feedback` e Claude conduz o diálogo de confirmação
- [ ] Claude **não** submete sem aprovação explícita do dev
- [ ] Se `submitFeedback` falhar, Claude exibe o rascunho completo para não perder o conteúdo
- [ ] Após submissão, `searchKnowledge` retorna o feedback ao buscar pelas tags registradas
- [ ] Feedback `plugin: 'protheus'` **não** aparece em buscas de sessões Fluig e vice-versa
- [ ] `/fluig:feedback` funciona identicamente com `plugin: 'fluig'`
- [ ] Painel admin exibe feedbacks com filtro por dev, plugin e paginação correta
- [ ] Admin consegue remover feedback incorreto pelo painel
- [ ] Paginação do admin reflete o filtro ativo (total filtrado, não total geral)
