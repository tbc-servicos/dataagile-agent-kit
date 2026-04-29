# Git Init Identification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Detectar o contexto do repositório git (TBC vs cliente) nos skills de init e adaptar comportamento para evitar rastros de IA em repositórios de clientes.

**Architecture:** Bloco padrão `## Passo 0 — Contexto Git` inserido no início de ambos os init skills. Detecção via `git remote get-url origin`. Dois modos: TBC (compartilha `.claude/`, `CLAUDE.md`) e Cliente (`.gitignore`, sem menção a IA).

**Tech Stack:** Markdown (SKILL.md), JSON (plugin.json), shell inline nos skills

---

### Task 1: Adicionar Passo 0 ao `protheus-init-project`

**Files:**
- Modify: `protheus/skills/protheus-init-project/SKILL.md`

**Step 1: Ler o arquivo atual**

```bash
cat protheus/skills/protheus-init-project/SKILL.md
```

**Step 2: Inserir o Passo 0 antes do Passo 1**

Localizar a linha `## Passo 1 — Explorar o projeto` e inserir o bloco abaixo **acima** dela:

```markdown
## Passo 0 — Contexto Git

Antes de qualquer ação, identifique o contexto do repositório:

```bash
git remote get-url origin 2>/dev/null
```

| Resultado | Contexto |
|-----------|----------|
| Nenhuma saída / erro | **Sem remote** — bloquear |
| URL contém `bitbucket.org/fabricatbc` | **Modo TBC** |
| Qualquer outro remote | **Modo Cliente** |

### Se sem remote

Bloquear e orientar:

```
Nenhum remote configurado. Configure antes de continuar:
  git remote add origin <url>
```

### Modo TBC (bitbucket.org/fabricatbc)

Ao final do init, commitar os artefatos criados:

```bash
git add .claude/ CLAUDE.md
git commit -m "chore: init projeto Protheus — configuração Claude Code"
```

Pode mencionar Claude, IA e ferramentas de automação normalmente.

### Modo Cliente (repositório externo)

- **Nunca mencionar** IA, Claude, automação ou ferramentas de AI em qualquer saída: commits, PRs, mensagens, comentários ou instruções ao developer
- Commits **sem** footer `Co-Authored-By:`
- Ao criar o `CLAUDE.md`, adicionar automaticamente ao `.gitignore`:

```
# Internal tooling
.claude/
CLAUDE.md
```

Ao final, commitar apenas o `.gitignore`:

```bash
git add .gitignore
git commit -m "chore: configurar projeto"
```

---

```

**Step 3: Verificar que o arquivo ficou correto**

Confirmar que o Passo 0 está antes do Passo 1 e que os demais passos mantêm a numeração original (1–5).

**Step 4: Commit**

```bash
git add protheus/skills/protheus-init-project/SKILL.md
git commit -m "feat(protheus): init-project detecta contexto TBC vs cliente"
```

---

### Task 2: Adicionar Passo 0 ao `fluig-init-project`

**Files:**
- Modify: `fluig/skills/fluig-init-project/SKILL.md`

**Step 1: Ler o arquivo atual**

```bash
cat fluig/skills/fluig-init-project/SKILL.md
```

**Step 2: Inserir o Passo 0 antes do Passo 1**

Localizar a linha `## Passo 1 — Entrevista` e inserir o bloco idêntico ao da Task 1 **acima** dela:

```markdown
## Passo 0 — Contexto Git

Antes de qualquer ação, identifique o contexto do repositório:

```bash
git remote get-url origin 2>/dev/null
```

| Resultado | Contexto |
|-----------|----------|
| Nenhuma saída / erro | **Sem remote** — bloquear |
| URL contém `bitbucket.org/fabricatbc` | **Modo TBC** |
| Qualquer outro remote | **Modo Cliente** |

### Se sem remote

Bloquear e orientar:

```
Nenhum remote configurado. Configure antes de continuar:
  git remote add origin <url>
```

### Modo TBC (bitbucket.org/fabricatbc)

Ao final do init, commitar os artefatos criados:

```bash
git add .claude/ CLAUDE.md
git commit -m "chore: init projeto Fluig — configuração Claude Code"
```

Pode mencionar Claude, IA e ferramentas de automação normalmente.

### Modo Cliente (repositório externo)

- **Nunca mencionar** IA, Claude, automação ou ferramentas de AI em qualquer saída: commits, PRs, mensagens, comentários ou instruções ao developer
- Commits **sem** footer `Co-Authored-By:`
- Ao criar o `CLAUDE.md`, adicionar automaticamente ao `.gitignore`:

```
# Internal tooling
.claude/
CLAUDE.md
```

Ao final, commitar apenas o `.gitignore`:

```bash
git add .gitignore
git commit -m "chore: configurar projeto"
```

---

```

**Step 3: Verificar que o arquivo ficou correto**

Confirmar que o Passo 0 está antes do Passo 1 e que os demais passos mantêm a numeração original (1–3).

**Step 4: Commit**

```bash
git add fluig/skills/fluig-init-project/SKILL.md
git commit -m "feat(fluig): init-project detecta contexto TBC vs cliente"
```

---

### Task 3: Bump de versão — protheus 1.3.0 → 1.3.1

**Files:**
- Modify: `protheus/.claude-plugin/plugin.json`

**Step 1: Ler o arquivo atual**

```bash
cat protheus/.claude-plugin/plugin.json
```

Confirmar que versão atual é `1.3.0`.

**Step 2: Atualizar versão**

Alterar:
```json
"version": "1.3.0"
```
Para:
```json
"version": "1.3.1"
```

**Step 3: Commit**

```bash
git add protheus/.claude-plugin/plugin.json
git commit -m "chore(protheus): bump 1.3.0 → 1.3.1"
```

---

### Task 4: Bump de versão — fluig 1.2.0 → 1.2.1

**Files:**
- Modify: `fluig/.claude-plugin/plugin.json`

**Step 1: Ler o arquivo atual**

```bash
cat fluig/.claude-plugin/plugin.json
```

Confirmar que versão atual é `1.2.0`.

**Step 2: Atualizar versão**

Alterar:
```json
"version": "1.2.0"
```
Para:
```json
"version": "1.2.1"
```

**Step 3: Commit**

```bash
git add fluig/.claude-plugin/plugin.json
git commit -m "chore(fluig): bump 1.2.0 → 1.2.1"
```

---

### Task 5: Atualizar README.md

**Files:**
- Modify: `README.md`

**Step 1: Localizar e atualizar a tabela de plugins**

Linha atual:
```
| `fluig` | 1.2.0 | ...
| `protheus` | 1.2.1 | ...
```

Alterar para:
```
| `fluig` | 1.2.1 | ...
| `protheus` | 1.3.1 | ...
```

**Step 2: Atualizar a seção de estrutura do repositório**

Localizar:
```
├── fluig/                             # Plugin Fluig (v1.2.0)
```
Alterar para:
```
├── fluig/                             # Plugin Fluig (v1.2.1)
```

Localizar:
```
├── protheus/                          # Plugin Protheus (v1.2.1)
```
Alterar para:
```
├── protheus/                          # Plugin Protheus (v1.3.1)
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: atualiza versões fluig 1.2.1 e protheus 1.3.1 no README"
```

---

### Task 6: Code Review

Executar `superpowers:requesting-code-review` para revisar todas as mudanças antes de fechar a branch.

Verificar:
- [ ] Passo 0 presente em ambos os init skills
- [ ] Bloco idêntico nos dois skills (sem divergências de conteúdo)
- [ ] Versões corretas no plugin.json e README
- [ ] Nenhum commit com footer `Co-Authored-By:` (as mensagens de commit deste plano não devem ter)
