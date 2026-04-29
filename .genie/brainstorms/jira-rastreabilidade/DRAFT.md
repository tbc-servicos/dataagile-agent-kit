# DRAFT: Rastreabilidade JIRA — Claude Skills

**Epic:** DAI-172
**Ideia inicial:** Todo trabalho neste repo deve ser rastreado no JIRA automaticamente.
- Uma história por skill
- Tarefas criadas automaticamente por sessão/planejamento
- Comentários gravados no JIRA antes de PRs
- Rastreabilidade para todo o time, sem depender de perguntar no Claude Code

## Decisão 1 — Gatilho
Escolhido: **C — Ambos**
- SessionStart cria a tarefa no JIRA
- Commit registra progresso (comentário/log) na tarefa

## Decisão 2 — Identificação da história
Escolhido: **B — Pelo nome do diretório/plugin**
- Se o dev está em `keepass/` → tarefa vai na história do keepass
- Mapeamento: nome do diretório → história JIRA correspondente

## Decisão 3 — Mapeamento diretório → história
Escolhido: **C — Dinâmico**
- Hook busca história existente com label/nome do plugin no Epic DAI-172
- Se não encontrar, cria automaticamente
- Histórias ficam vivas no JIRA, não precisam de manutenção manual

## Decisão 4 — Comentário pré-PR
Escolhido: **B — Diff resumido pelo Claude**
- Claude analisa as mudanças e escreve comentário em linguagem natural
- Foco no impacto: o que mudou, por que importa, o que foi corrigido/adicionado
- Disparado pelo pre-push hook (antes do push da branch)

## Decisão 5 — Público alvo
Escolhido: **A — Todo contribuidor usa Claude Code com jira-api**
- Pode usar MCP Atlassian e jira-api plugin diretamente
- Não precisa de fallback standalone para hooks shell
- Integração pode ser rica (Claude analisa, decide, cria)

## Decisão 6 — Criação condicional de tarefa
Escolhido: **B — Cria tarefa só se houver commits na sessão**
- SessionStart: registra contexto localmente (plugin, branch, timestamp) — ainda NÃO cria no JIRA
- Pre-commit hook: na primeira vez que o dev comita, cria a tarefa no JIRA e guarda o issue key localmente
- Commits subsequentes: adicionam worklogs/comentários na tarefa já criada
- SessionStop (ou pre-push): sem commits = nada criado no JIRA

## Escopo

### IN
- SessionStart: detecta plugin pelo diretório, salva contexto local
- Pre-commit (1º commit da sessão): cria Story no JIRA sob DAI-172 se não existir, cria Task vinculada
- Pre-commit (commits subsequentes): adiciona comentário na Task existente
- Pre-push: Claude analisa diff, grava comentário em linguagem natural na Task
- Histórias criadas dinamicamente por plugin se não existirem

### OUT (fora desta versão)
- Transições de status automáticas (In Progress / Done)
- Time tracking / worklogs automáticos
- Link PR ↔ tarefa no Bitbucket
- Notificações Slack

## Decisão 7 — Estado de sessão
Escolhido: **A — Arquivo local `.jira-session` (gitignored)**
- SessionStart escreve: plugin detectado, branch, timestamp, user
- Pre-commit lê o arquivo, cria/atualiza tarefa, escreve o issue key de volta
- Pre-push lê o issue key para saber onde gravar o comentário
- Adicionado ao .gitignore do repo

## Critério de aceite principal
"Dado que um dev fez pelo menos 1 commit em qualquer plugin (ex: keepass/),
ao abrir o Epic DAI-172 no JIRA deve existir uma Story com o nome do plugin
e uma Task vinculada contendo resumo do que foi feito — sem nenhuma ação manual."

Critérios adicionais:
- Se a Story do plugin já existe, não duplica — só cria nova Task
- Pre-push grava comentário em linguagem natural na Task antes do PR
- .jira-session está no .gitignore e não aparece em git status
