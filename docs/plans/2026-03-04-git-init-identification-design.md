# Design — Identificação Git Init

**Data:** 2026-03-04
**Status:** Aprovado
**Escopo:** `protheus-init-project`, `fluig-init-project`

---

## Problema

Os skills de init de projeto não distinguem se o repositório é interno (TBC) ou do cliente. Isso gera riscos:

- Commitar arquivos `.claude/` e `CLAUDE.md` em repositórios de clientes expõe rastros de uso de IA
- No repositório TBC, esses arquivos deveriam ser compartilhados com o time

---

## Solução — Opção B: Bloco padrão `## Contexto Git`

Ambos os init skills recebem um **Passo 0 — Contexto Git** idêntico, inserido antes de qualquer outra ação.

---

## Detecção do contexto

```bash
git remote get-url origin 2>/dev/null
```

| Situação | Ação |
|----------|------|
| Sem remote configurado | Bloquear — orientar `git remote add origin <url>` antes de continuar |
| URL contém `bitbucket.org/fabricatbc` | **Modo TBC** |
| Qualquer outro remote | **Modo Cliente** |

---

## Modo TBC

- Ao final do init, commitar: `.claude/`, `CLAUDE.md`, estrutura de pastas criada
- Mensagem de commit com referência ao skill
- Sem restrições de linguagem — pode mencionar IA, Claude, etc.

---

## Modo Cliente

- Adicionar ao `.gitignore`:
  ```
  # Internal tooling
  .claude/
  CLAUDE.md
  ```
- **Proibido mencionar**: IA, Claude, ferramentas de AI em qualquer saída (commits, PRs, mensagens, descrições)
- Commits sem footer `Co-Authored-By: Claude`
- O skill opera normalmente, mas sem deixar rastros de uso de IA

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `protheus/skills/protheus-init-project/SKILL.md` | Adicionar Passo 0 — Contexto Git |
| `fluig/skills/fluig-init-project/SKILL.md` | Adicionar Passo 0 — Contexto Git |
| `protheus/.claude-plugin/plugin.json` | Bump de patch na versão |
| `fluig/.claude-plugin/plugin.json` | Bump de patch na versão |
| `README.md` | Atualizar tabela de versões |

---

## Versionamento

- Ambos os plugins: bump de **patch** (comportamento interno, sem breaking change)
