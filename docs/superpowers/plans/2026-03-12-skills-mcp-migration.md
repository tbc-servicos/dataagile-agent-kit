# Skills MCP Migration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Migrar todas as 13 skills Protheus para o novo formato: sem conhecimento inline no `.md`, todo conteúdo consultado via MCP (`search_knowledge`, `search_function`, etc.) e RAG usando `get_credentials()` → `rag_search_url`/`rag_ask_url`.

**Architecture:** Cada SKILL.md deve conter apenas: (1) o fluxo de trabalho da skill, (2) instruções de COMO chamar os tools MCP, (3) seção RAG padrão no final. Todo conhecimento (padrões, templates, convenções, exemplos) fica no `knowledge_patterns` do SQLite e é acessado via `search_knowledge()`.

**Tech Stack:** Node.js, SQLite (`better-sqlite3`), MCP SDK, skills Markdown

**Referência (formato alvo):** O padrão RAG correto está definido neste plano. Os arquivos `advpl-specialist` e `advpl-patterns` já têm a estrutura certa de MCP, mas ainda usam `rag_api_url` (legado) — serão corrigidos na Task 0.

---

## Padrão de RAG (obrigatório em todas as skills)

```markdown
## Consulta TDN (RAG)

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

**Quando usar:** dúvida sobre rotina padrão, PE, tabelas do dicionário, comportamento não coberto pela base local.
```

---

## Mapa de Arquivos

| Arquivo | Estado Atual | Mudança |
|---------|-------------|---------|
| `skills/advpl-specialist/SKILL.md` | rag_api_url legado | Fix rag URL (Task 0) |
| `skills/advpl-patterns/SKILL.md` | rag_api_url legado | Fix rag URL (Task 0) |
| `skills/advpl-sql/SKILL.md` | rag_api_url errado | Fix rag URL |
| `skills/protheus-diagnose/SKILL.md` | rag_api_url errado | Fix rag URL |
| `skills/protheus-test/SKILL.md` | rag_api_url errado | Fix rag URL |
| `skills/advpl-writer/SKILL.md` | inline content + rag_api_url | Remove inline + fix RAG |
| `skills/protheus-reviewer/SKILL.md` | inline content + rag_api_url | Remove inline + fix RAG |
| `skills/protheus-migrate/SKILL.md` | inline content + rag_api_url | Remove inline + fix RAG |
| `skills/protheus-brainstorm/SKILL.md` | hardcoded URL | Fix RAG |
| `skills/protheus-subagent-dev/SKILL.md` | hardcoded URL | Fix RAG |
| `skills/protheus-writing-plans/SKILL.md` | hardcoded URL | Fix RAG |
| `skills/protheus-compile/SKILL.md` | inline content + hardcoded URL | Remove inline + fix RAG |
| `skills/protheus-init-project/SKILL.md` | inline content + hardcoded URL | Remove inline + fix RAG |
| `skills/update-knowledge/SKILL.md` | sem RAG | OK (sem RAG necessário) |

---

## Chunk 0: Corrigir arquivos de referência

### Task 0: advpl-specialist + advpl-patterns — fix rag_api_url

**Files:**
- Modify: `protheus/skills/advpl-specialist/SKILL.md`
- Modify: `protheus/skills/advpl-patterns/SKILL.md`

- [ ] Ler ambos os arquivos
- [ ] Em `advpl-specialist`: substituir `<rag_api_url>?q=` por `<rag_search_url>?q=` (busca semântica via GET)
- [ ] Em `advpl-specialist`: adicionar bloco POST com `<rag_ask_url>` para perguntas contextuais
- [ ] Em `advpl-patterns`: mesma correção (seção RAG no final)
- [ ] Verificar ausência de `rag_api_url` em ambos
- [ ] Commit: `fix(skills): advpl-specialist e advpl-patterns usam rag_search_url/rag_ask_url`

---

## Chunk 1: Fix RAG simples (sem remoção de conteúdo)

Skills que só precisam corrigir o padrão RAG, sem remover conhecimento inline.

### Task 1: advpl-sql — fix rag URL

**Files:**
- Modify: `protheus/skills/advpl-sql/SKILL.md`

- [ ] Ler o arquivo atual
- [ ] Localizar a seção de RAG no final
- [ ] Substituir `<rag_api_url>` por `<rag_ask_url>` (field renomeado no MCP)
- [ ] Adicionar `rag_search_url` no bloco de busca semântica (se não tiver)
- [ ] Aplicar o padrão completo de RAG conforme template acima
- [ ] Verificar que não há `agentescraping.totvstbc.com.br` hardcoded
- [ ] Commit: `fix(skills): advpl-sql usa rag_ask_url via get_credentials`

### Task 2: protheus-diagnose — fix rag URL

**Files:**
- Modify: `protheus/skills/protheus-diagnose/SKILL.md`

- [ ] Ler o arquivo atual
- [ ] Substituir seção RAG: `<rag_api_url>` → `<rag_ask_url>`
- [ ] Adicionar busca semântica com `rag_search_url`
- [ ] Verificar ausência de URL hardcoded
- [ ] Commit: `fix(skills): protheus-diagnose usa rag_ask_url via get_credentials`

### Task 3: protheus-test — fix rag URL

**Files:**
- Modify: `protheus/skills/protheus-test/SKILL.md`

- [ ] Ler o arquivo atual
- [ ] Substituir seção RAG: `<rag_api_url>` → `<rag_ask_url>`
- [ ] Adicionar busca semântica com `rag_search_url`
- [ ] Verificar ausência de URL hardcoded
- [ ] Commit: `fix(skills): protheus-test usa rag_ask_url via get_credentials`

---

## Chunk 2: Remove inline content + fix RAG

Skills que têm conteúdo de conhecimento embutido que já existe no DB.

### Task 4: advpl-writer — remove inline + fix RAG

**Files:**
- Modify: `protheus/skills/advpl-writer/SKILL.md`

Seções que devem ser substituídas por MCP calls:
- "Limite de Caracteres no Nome da Funcao" → `search_knowledge({ skill: "advpl-writer", keyword: "limite nome funcao" })`
- "TLPP com Namespace" (bloco de código com exemplos) → `search_knowledge({ skill: "advpl-writer", keyword: "namespace tlpp" })`
- "Regras Inegociaveis" (lista inline) → `search_knowledge({ skill: "advpl-patterns", keyword: "regras inegociaveis" })`
- "Templates de Geração" → `search_knowledge({ skill: "advpl-writer", keyword: "template" })`
- "Verificacao Final" (checklist inline) → `search_knowledge({ skill: "advpl-writer", keyword: "checklist" })`

Manter (é PROCESSO, não conhecimento):
- Fluxo de perguntas ao usuário (tipo artefato, módulo, sequencial, etc.)
- Referência a design doc em `docs/plans/`

- [ ] Ler o arquivo atual
- [ ] Remover seções de conhecimento inline (5 seções listadas acima)
- [ ] Substituir cada uma pelo `search_knowledge()` correspondente com descrição de 1 linha
- [ ] Substituir seção RAG final: `<rag_api_url>` → padrão completo com `rag_ask_url` + `rag_search_url`
- [ ] Verificar que o arquivo resultante tem <80 linhas
- [ ] Commit: `refactor(skills): advpl-writer remove inline knowledge, usa MCP`

### Task 5: protheus-reviewer — remove inline + fix RAG

**Files:**
- Modify: `protheus/skills/protheus-reviewer/SKILL.md`

Seções para substituir por MCP:
- Checklist de 11 pontos (review criteria) → `search_knowledge({ skill: "protheus-reviewer", keyword: "checklist revisao" })`
- Template ProtheusDoc → `search_knowledge({ skill: "advpl-patterns", keyword: "ProtheusDoc" })`
- Formato do relatório de saída → `search_knowledge({ skill: "protheus-reviewer", keyword: "formato relatorio" })`

Manter (é PROCESSO):
- Instrução de quando invocar
- Fluxo: ler código → consultar MCP → gerar relatório

- [ ] Ler o arquivo atual
- [ ] Remover seções de conhecimento inline
- [ ] Substituir por `search_knowledge()` calls
- [ ] Aplicar padrão RAG completo
- [ ] Commit: `refactor(skills): protheus-reviewer remove inline knowledge, usa MCP`

### Task 6: protheus-migrate — remove inline + fix RAG

**Files:**
- Modify: `protheus/skills/protheus-migrate/SKILL.md`

Seções para substituir:
- Padrão de namespace FSW.TBC (exemplos de código) → `search_knowledge({ skill: "advpl-writer", keyword: "namespace tlpp" })`
- Checklist de migração → `search_knowledge({ skill: "protheus-migrate", keyword: "checklist migracao" })`
- Anti-patterns (exemplos de código) → `search_knowledge({ skill: "protheus-migrate", keyword: "antipatterns" })`

Manter (PROCESSO):
- 7 etapas do fluxo de migração (são instrução de como fazer, não conhecimento)

- [ ] Ler o arquivo atual
- [ ] Remover seções de conhecimento inline
- [ ] Substituir por `search_knowledge()` calls
- [ ] Aplicar padrão RAG completo
- [ ] Commit: `refactor(skills): protheus-migrate remove inline knowledge, usa MCP`

---

## Chunk 3: Skills com URL hardcoded (sem conteúdo relevante a remover)

### Task 7: protheus-brainstorm — fix RAG

**Files:**
- Modify: `protheus/skills/protheus-brainstorm/SKILL.md`

> Nota: `protheus-brainstorm` não tem entradas em `knowledge_patterns` no DB. Não usar `search_knowledge({ skill: "protheus-brainstorm", ... })` — retornaria vazio. A skill tem apenas fixo de RAG.

- [ ] Ler o arquivo atual
- [ ] Localizar seção `📚 Consulta à Base de Conhecimento (TDN)` no final
- [ ] Substituir bloco inteiro (endpoint hardcoded + curl sem auth) pelo padrão completo com `get_credentials()` + `rag_ask_url` + `rag_search_url`
- [ ] Verificar que `agentescraping.totvstbc.com.br` não está mais presente
- [ ] Commit: `fix(skills): protheus-brainstorm usa get_credentials para RAG`

### Task 8: protheus-subagent-dev — fix RAG

**Files:**
- Modify: `protheus/skills/protheus-subagent-dev/SKILL.md`

- [ ] Ler o arquivo atual
- [ ] Substituir seção RAG hardcoded pelo padrão com `get_credentials()`
- [ ] Verificar ausência de URL hardcoded
- [ ] Commit: `fix(skills): protheus-subagent-dev usa get_credentials para RAG`

### Task 9: protheus-writing-plans — fix RAG

**Files:**
- Modify: `protheus/skills/protheus-writing-plans/SKILL.md`

- [ ] Ler o arquivo atual
- [ ] Substituir seção RAG hardcoded pelo padrão com `get_credentials()`
- [ ] Verificar ausência de URL hardcoded
- [ ] Commit: `fix(skills): protheus-writing-plans usa get_credentials para RAG`

---

## Chunk 4: Skills com muito conteúdo inline (maior esforço)

### Task 10: protheus-compile — remove inline + fix RAG

**Files:**
- Modify: `protheus/skills/protheus-compile/SKILL.md`

Seções para substituir por MCP:
- Tabela de modos de compilação → `search_knowledge({ skill: "protheus-compile", keyword: "modos compilacao" })`
- Tabela de categorias de severidade → `search_knowledge({ skill: "protheus-compile", keyword: "severidade erros" })`
- Tabela de warning patterns → `search_knowledge({ skill: "protheus-compile", keyword: "warning patterns" })`
- Tabela de troubleshooting → `search_knowledge({ skill: "protheus-compile", keyword: "troubleshooting" })`
- Exemplos de INI template → `search_knowledge({ skill: "protheus-compile", keyword: "ini template" })`
- Código do JSON parser → `search_knowledge({ skill: "protheus-compile", keyword: "parser saida compilador" })`

Manter (PROCESSO):
- Passos de como verificar/instalar o binário `advpls`
- Comandos de lint e compilação (são procedimentos operacionais)
- Estrutura geral de fluxo

- [ ] Ler o arquivo completo
- [ ] Remover cada seção de conhecimento inline (6 seções)
- [ ] Substituir por `search_knowledge()` calls com 1 linha de descrição cada
- [ ] Aplicar padrão RAG completo no final
- [ ] Verificar que o arquivo resultante tem <120 linhas
- [ ] Commit: `refactor(skills): protheus-compile remove inline knowledge, usa MCP`

### Task 11: protheus-init-project — remove inline + fix RAG

**Files:**
- Modify: `protheus/skills/protheus-init-project/SKILL.md`

Seções para substituir por MCP:
- Template CLAUDE.md completo (60+ linhas) → `search_knowledge({ skill: "protheus-init-project", keyword: "claude md template" })`
- Tabela de contexto git → `search_knowledge({ skill: "protheus-init-project", keyword: "git context" })`
- Comandos de detecção de binários → `search_knowledge({ skill: "protheus-init-project", keyword: "binary detection" })`

Manter (PROCESSO):
- Fluxo de perguntas ao usuário
- Sequência de ações (criar arquivo, perguntar, validar)

- [ ] Ler o arquivo completo
- [ ] Remover template CLAUDE.md inline (maior bloco)
- [ ] Remover tabelas de conhecimento
- [ ] Substituir por `search_knowledge()` calls
- [ ] Aplicar padrão RAG completo
- [ ] Verificar que o arquivo resultante tem <80 linhas
- [ ] Commit: `refactor(skills): protheus-init-project remove inline knowledge, usa MCP`

---

## Chunk 5: Verificação final

### Task 12: Verificação global

- [ ] Rodar grep em todos os SKILL.md: `grep -r "agentescraping\|rag_api_url" protheus/skills/` → deve retornar vazio
- [ ] Rodar grep: `grep -r "https://" protheus/skills/` → revisar cada resultado (só URLs de processo são OK, ex: codeanalysis.totvs.com.br)
- [ ] Testar skill `protheus-brainstorm` no Claude com `--plugin-dir`: invocar e verificar que RAG chama `get_credentials` antes do curl
- [ ] Commit final: `docs(skills): migração completa para formato MCP v1.5`

---

## Notas de Implementação

**O que NÃO remover das skills:**
- Fluxo de trabalho (steps 1, 2, 3...)
- Perguntas que a skill faz ao usuário
- Instruções de comandos operacionais (install, run, compile)
- Referências a outras skills (`/protheus:protheus-brainstorm`)

**O que SEMPRE remover:**
- Tabelas de referência de padrões/convenções
- Exemplos de código de padrões
- Templates inline (vão para DB)
- Checklists de validação (vão para DB)
- URLs hardcoded de APIs

**Teste de aceitação por skill:**
Após atualizar, a skill deve ter ≤100 linhas e não conter nenhuma informação de domínio inline — apenas chamadas MCP e fluxo de trabalho.
