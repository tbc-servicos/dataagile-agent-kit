# DESIGN: Rastreabilidade JIRA — Claude Skills

**Epic:** DAI-172
**Status:** Ready for /wish

---

## Problema

Todo trabalho no repositório `claude_skills` precisa ser rastreável no JIRA automaticamente, sem depender de ação manual dos devs. Qualquer membro do time deve conseguir acompanhar o que está sendo feito abrindo o JIRA, sem precisar perguntar no Claude Code.

---

## Solução

Integração via git hooks + Claude Code hooks que criam e alimentam tarefas JIRA automaticamente durante o fluxo normal de trabalho.

---

## Fluxo

```
Abre Claude Code no repo
        ↓
SessionStart hook
  → Detecta plugin pelo diretório atual (ex: keepass/ → "keepass")
  → Salva contexto em .jira-session (plugin, branch, user, timestamp)
  → NÃO cria nada no JIRA ainda
        ↓
Dev trabalha e faz commit
        ↓
Pre-commit hook (.githooks/pre-commit — já existente, expandir)
  → Lê .jira-session
  → Se é o 1º commit da sessão:
      → Busca Story "keepass" sob DAI-172 via jira-api
      → Se não existe: cria Story automaticamente
      → Cria Task vinculada à Story com título = branch + data
      → Grava issue key da Task no .jira-session
  → Se já existe Task na sessão:
      → Adiciona comentário com mensagem do commit
  → Auto-bump de versão (já implementado)
        ↓
Dev faz git push (pré-PR)
        ↓
Pre-push hook (.githooks/pre-push — novo)
  → Lê issue key do .jira-session
  → Executa: claude -p "analise este diff e escreva comentário JIRA"
  → Posta comentário em linguagem natural na Task
```

---

## Componentes a implementar

### 1. SessionStart hook (Claude Code)
- Detecta diretório raiz do plugin sendo trabalhado
- Escreve `.jira-session` com: `plugin`, `branch`, `user`, `timestamp`, `issue_key` (vazio inicialmente)

### 2. Expansão do pre-commit hook
- Lógica JIRA após o auto-bump de versão existente
- Usa `jira-api` (MCP Atlassian) para buscar/criar Story e Task
- Atualiza `.jira-session` com `issue_key`

### 3. Novo pre-push hook
- Coleta diff da branch (`git diff main...HEAD`)
- Chama Claude para gerar resumo em linguagem natural
- Posta como comentário na Task via jira-api

### 4. .gitignore
- Adicionar `.jira-session` ao .gitignore do repo

---

## Estrutura JIRA resultante

```
Epic DAI-172 — Claude Skills
├── Story: keepass
│   ├── Task: feat/keepass-totp — 2026-04-08
│   │   ├── Comentário: "commit: feat(keepass): adicionar operação totp"
│   │   └── Comentário (pré-PR): "Foram adicionadas operações de TOTP ao keepass..."
├── Story: fluig
│   └── Task: fix/fluig-dataset — 2026-04-09
└── Story: protheus
    └── ...
```

---

## Escopo

### IN
- Detecção automática de plugin pelo diretório
- Criação dinâmica de Story por plugin (se não existir) sob DAI-172
- Criação de Task por sessão (somente se houver commits)
- Comentários de commit na Task
- Comentário pré-PR gerado pelo Claude (diff resumido)
- Estado de sessão em `.jira-session` (gitignored)

### OUT (fora desta versão)
- Transições de status automáticas (In Progress / Done)
- Time tracking / worklogs
- Link PR ↔ tarefa no Bitbucket
- Notificações Slack

---

## Riscos e premissas

- Todo contribuidor tem Claude Code + plugin jira-api configurado
- `git config core.hooksPath .githooks` deve estar ativo (já documentado no ONBOARDING.md)
- O pre-push hook depende de `claude -p` disponível no shell — requer Claude Code no PATH
- Múltiplas sessões simultâneas no mesmo repo (improvável, mas possível): `.jira-session` seria sobrescrito

---

## Critério de aceite

> Dado que um dev fez pelo menos 1 commit em qualquer plugin (ex: `keepass/`), ao abrir o Epic DAI-172 no JIRA deve existir uma Story com o nome do plugin e uma Task vinculada contendo resumo do que foi feito — **sem nenhuma ação manual do dev**.

Critérios adicionais:
- Se a Story do plugin já existe, não duplica — só cria nova Task
- Pre-push grava comentário em linguagem natural na Task antes do PR
- `.jira-session` está no `.gitignore` e não aparece em `git status`
