# Wish: Rastreabilidade JIRA — Claude Skills

| Field | Value |
|-------|-------|
| **Status** | SHIPPED |
| **Slug** | jira-rastreabilidade |
| **Date** | 2026-04-08 |
| **Epic** | DAI-172 |

---

## Summary

Todo trabalho no repositório `claude_skills` deve ser rastreado automaticamente no JIRA, sem ação manual dos devs. A integração usa git hooks + Claude Code hooks para criar Stories por plugin e Tasks por sessão de trabalho sob o Epic DAI-172, além de gravar comentários em linguagem natural antes de cada PR.

---

## Scope

### IN
- SessionStart hook: detecta plugin pelo diretório, persiste contexto em `.jira-session`
- Pre-commit hook (expansão): no 1º commit da sessão, cria Story (se não existir) e Task no JIRA; commits subsequentes adicionam comentários na Task
- Pre-push hook (novo): Claude analisa o diff e grava comentário em linguagem natural na Task
- Stories criadas dinamicamente por plugin sob DAI-172
- `.jira-session` adicionado ao `.gitignore`
- `setup-dev` documentado no ONBOARDING.md (já feito: `git config core.hooksPath .githooks`)

### OUT
- Transições de status automáticas (In Progress / Done)
- Time tracking / worklogs automáticos
- Link PR ↔ tarefa no Bitbucket
- Notificações Slack
- Suporte a devs sem Claude Code instalado

---

## Decisions

| Decisão | Escolha | Rationale |
|---------|---------|-----------|
| Gatilho de criação da Task | 1º commit da sessão | Evita poluir JIRA com sessões sem commits |
| Identificação do plugin | Nome do diretório raiz | Simples, sem config extra |
| Mapeamento diretório → Story | Dinâmico (busca/cria) | Zero manutenção manual |
| Estado de sessão | `.jira-session` (gitignored) | Persiste entre hook calls na mesma sessão |
| Comentário pré-PR | Claude analisa diff | Linguagem natural, mais útil que lista de commits |
| Auth JIRA | Plugin jira-api (já configurado) | Toda a equipe já usa |

---

## Success Criteria

- [ ] Dado um commit em `keepass/`, uma Story "keepass" existe sob DAI-172 no JIRA
- [ ] A Story contém uma Task com título incluindo branch e data
- [ ] Cada commit subsequente adiciona um comentário na Task
- [ ] Após `git push`, a Task contém um comentário em linguagem natural sobre o diff
- [ ] Fazer `git status` não mostra `.jira-session`
- [ ] Se a Story do plugin já existe, não é duplicada — só cria nova Task
- [ ] Dev sem `.jira-session` (sessão fora do Claude Code) não causa erro no hook

---

## Execution Groups

### Grupo 1 — Fundação: estado de sessão + .gitignore

**Goal:** Criar a infra de estado que os demais grupos dependem.

**Deliverables:**
- `.jira-session` adicionado ao `.gitignore`
- Script shell `scripts/jira-session.sh` com funções: `session_read`, `session_write`, `session_clear`
- Formato do `.jira-session`: JSON com campos `plugin`, `branch`, `user`, `timestamp`, `issue_key`

**Acceptance Criteria:**
- [ ] `cat .gitignore | grep jira-session` retorna resultado
- [ ] `bash scripts/jira-session.sh write keepass feat/test` cria `.jira-session` válido
- [ ] `bash scripts/jira-session.sh read plugin` retorna `keepass`

**Validation:**
```bash
echo '{"plugin":"keepass","branch":"test","user":"rodrigo","timestamp":"2026-04-08","issue_key":""}' > .jira-session
bash scripts/jira-session.sh read plugin
rm .jira-session
grep "jira-session" .gitignore
```

---

### Grupo 2 — SessionStart hook

**Goal:** Detectar o plugin ao abrir Claude Code e inicializar `.jira-session`.

**Deliverables:**
- Hook `SessionStart` em `settings.json` (ou script referenciado por ele)
- Lógica de detecção: lista subdiretórios com `.claude-plugin/plugin.json`, intersecta com diretório atual
- Se não detectar plugin (ex: está na raiz), salva `plugin: null`

**Acceptance Criteria:**
- [ ] Abrir Claude Code em `keepass/` gera `.jira-session` com `plugin: "keepass"`
- [ ] Abrir na raiz gera `.jira-session` com `plugin: null`
- [ ] Hook não falha se `.jira-session` já existe (sobrescreve)

**Validation:**
```bash
cd keepass && claude --print "echo ok" 2>/dev/null; cat ../.jira-session | grep plugin
```

---

### Grupo 3 — Expansão do pre-commit: criação de Story e Task

**Goal:** No 1º commit da sessão, criar Story (se necessário) e Task no JIRA.

**Deliverables:**
- Expansão de `.githooks/pre-commit` com bloco JIRA após o auto-bump de versão
- Usa `claude -p` com MCP jira-api para:
  1. Buscar Story com label = nome do plugin sob DAI-172
  2. Se não existe: criar Story
  3. Criar Task vinculada com título `[plugin] branch — YYYY-MM-DD`
- Grava `issue_key` da Task no `.jira-session`
- Se `plugin: null` no `.jira-session`, pula silenciosamente

**Acceptance Criteria:**
- [ ] Após 1º commit em `keepass/`, Story "keepass" existe ou foi criada no JIRA
- [ ] Task existe vinculada à Story com título correto
- [ ] `.jira-session` contém `issue_key` preenchido
- [ ] 2º commit não cria nova Task, adiciona comentário na existente
- [ ] Commit sem `.jira-session` (ex: CI) não causa erro

**Validation:**
```bash
# Verificar manualmente no JIRA após commit de teste
cat .jira-session | grep issue_key
```

---

### Grupo 4 — Comentários de commit na Task

**Goal:** Cada commit subsequente registra sua mensagem na Task JIRA.

**Deliverables:**
- Lógica no pre-commit (após criação da Task): se `issue_key` já existe, adicionar comentário
- Comentário formato: `commit: <mensagem> | branch: <branch> | <timestamp>`

**Acceptance Criteria:**
- [ ] Após 2º commit, Task no JIRA tem comentário com a mensagem do commit
- [ ] Comentários acumulam (não substituem)
- [ ] Commit de merge ou revert também é registrado

**Validation:**
```bash
# Abrir Task no JIRA após 2 commits e verificar comentários
cat .jira-session | grep issue_key
```

---

### Grupo 5 — Pre-push hook com análise do Claude

**Goal:** Antes do push, Claude analisa o diff e grava comentário em linguagem natural na Task.

**Deliverables:**
- Novo arquivo `.githooks/pre-push`
- Coleta `git diff main...HEAD` (ou branch base detectada)
- Chama `claude -p` com prompt de análise de diff para JIRA
- Posta resultado como comentário na Task via jira-api
- Se `.jira-session` não tem `issue_key`, pula silenciosamente

**Acceptance Criteria:**
- [ ] Após `git push`, Task no JIRA tem comentário gerado pelo Claude
- [ ] Comentário está em português, em linguagem natural (não lista de commits)
- [ ] Push sem Task associada não falha e não bloqueia o push
- [ ] Hook é executável: `ls -la .githooks/pre-push | grep x`

**Validation:**
```bash
ls -la .githooks/pre-push
# Verificar comentário na Task após git push em branch de teste
```

---

### Grupo 6 — ONBOARDING.md e documentação final

**Goal:** Garantir que o time saiba que a integração existe e como funciona.

**Deliverables:**
- Seção "Integração JIRA" no ONBOARDING.md explicando o fluxo automático
- Nota sobre comportamento esperado (quando Task é criada, o que aparece no JIRA)
- Instrução: se quiser desativar localmente, basta remover `.jira-session`

**Acceptance Criteria:**
- [ ] ONBOARDING.md tem seção sobre integração JIRA
- [ ] Seção explica o fluxo em menos de 20 linhas
- [ ] Não requer nenhuma configuração extra além do `core.hooksPath` já documentado

---

## Dependencies

- Depende de: plugin `jira-api` instalado e configurado (já existente)
- Depende de: `core.hooksPath .githooks` ativo (já documentado no ONBOARDING.md)
- Depende de: `claude` disponível no PATH do shell (pré-requisito do time)

---

## Assumptions & Risks

| Risco | Mitigação |
|-------|-----------|
| Dev sem `claude` no PATH: pre-push falha | Hook verifica `command -v claude` antes de chamar; pula se não encontrar |
| Múltiplas sessões simultâneas: `.jira-session` sobrescrito | Improvável no fluxo normal; aceito nesta versão |
| Token JIRA expirado: hook falha silenciosamente | Pre-commit não bloqueia o commit em caso de erro JIRA — apenas loga warning |
| Plugin não detectado (root, pasta não-plugin): | `plugin: null` → todos os blocos JIRA pulam silenciosamente |
