# Fluig Plugin — Design Document

**Data:** 2026-02-19
**Status:** Aprovado
**Repositório:** `https://bitbucket.org/fabricatbc/claude_skills`

---

## Contexto

Plugin Claude Code para desenvolvimento na plataforma **TOTVS Fluig** — cobrindo todo o ciclo de vida: scaffolding de artefatos, revisão de código, análise de qualidade e deploy.

Substitui/generaliza as 4 skills CASSI-específicas existentes em `cassi/fluig/` para skills genéricas reutilizáveis em qualquer projeto Fluig.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Formato | Claude Code Plugin (`.claude-plugin/plugin.json`) | Distribuição, versionamento, namespace |
| Distribuição | Marketplace privado no Bitbucket (`fabricatbc/claude_skills`) | Controle de acesso via permissões do repo; instalação com `/plugin marketplace add git@bitbucket.org:fabricatbc/claude_skills.git` |
| Integração servidor | Subagent `fluig-deployer` via SSH/REST | Sem MCP server por ora — deploy via Bash SSH |
| Automação | Hooks pós-edição | Validação determinística sem contexto LLM |
| Escopo | Genérico (não CASSI-específico) | Reutilizável em qualquer cliente Fluig |

---

## Estrutura do Plugin

```
fluig-plugin/
├── .claude-plugin/
│   └── plugin.json              # manifesto do plugin
├── skills/
│   ├── fluig-form/
│   │   └── SKILL.md             # scaffolding formulários HTML/JS
│   ├── fluig-dataset/
│   │   └── SKILL.md             # scaffolding datasets JavaScript
│   ├── fluig-widget/
│   │   └── SKILL.md             # scaffolding widgets Angular + PO-UI
│   ├── fluig-workflow/
│   │   └── SKILL.md             # scaffolding scripts BPM/eventos
│   └── fluig-api-ref/
│       └── SKILL.md             # referência APIs Fluig (DatasetFactory, WCMAPI, etc.)
├── agents/
│   ├── fluig-reviewer.md        # code review: padrões, segurança, nomenclatura
│   ├── fluig-qa.md              # análise QA: casos de borda, cobertura
│   └── fluig-deployer.md        # deploy via SSH (VPS) ou REST API Fluig
├── hooks/
│   └── hooks.json               # validação pós-edição em arquivos .js
└── README.md
```

---

## Componentes Detalhados

### Skills (5)

#### `fluig-form` — Scaffolding de Formulários

**Trigger:** Claude detecta "formulário Fluig" / `/fluig:form`
**Gera:**
- `[ID] - [Nome]/[nome].html` — HTML com campos padronizados
- `events/enableFields.js`, `displayFields.js`, `inputFields.js`, `validateForm.js`
- `Util/UtilsHandler.js`, `Util/DatasetUtils.js`
- `Lib/` (jquery.mask, sweetalert, lodash)
- `Style/form.css`

**Padrões obrigatórios:** SweetAlert2 (não `alert()`), máscaras jQuery, `try/catch`, IDs 6 dígitos.

---

#### `fluig-dataset` — Scaffolding de Datasets

**Trigger:** Claude detecta "dataset Fluig" / `/fluig:dataset`
**Gera:**
- Arquivo `ds_[acao]_[entidade].js`
- Funções: `defineStructure()`, `onSync()`, `createDataset(fields, constraints, sortFields)`
- Template: `getConstraintValue()`, `log.info/error`, `try/catch`, `DatasetBuilder.newDataset()`

---

#### `fluig-widget` — Scaffolding de Widgets Angular

**Trigger:** Claude detecta "widget Fluig" / `/fluig:widget`
**Gera:**
- Estrutura `_node/wg_[nome]/` com Angular 19 + PO-UI 19.36.0
- `src/app/` com: `components/`, `pages/`, `services/`, `shared/`, `utils/`
- `karma.conf.js`, `.eslintrc.json`, `tsconfig.json`
- Testes Jasmine/Karma configurados

---

#### `fluig-workflow` — Scaffolding de Scripts BPM

**Trigger:** Claude detecta "workflow/evento BPM" / `/fluig:workflow`
**Gera:**
- Arquivo `wf_[processo].[evento].js`
- Templates por evento: `afterStateEntry`, `beforeStateEntry`, `afterProcessCreate`, `afterProcessFinish`, `subProcessCreated`
- Padrão: `log.info`, notificações, integração Protheus

---

#### `fluig-api-ref` — Referência de APIs

**Trigger:** Claude detecta dúvida sobre API Fluig / `/fluig:api-ref`
**Contém:** DatasetFactory, WCMAPI, CardAPI, WorkflowAPI, FormAPI, ZoomAPI, APIs REST (OAuth2)

---

### Subagents (3)

#### `fluig-reviewer`

**Ferramentas:** `Read, Grep, Glob`
**Executa em:** Contexto isolado (não polui conversa principal)
**Analisa:**
- Nomenclatura (padrão `ds_`, `wf_`, `wg_`, `mc_`)
- Presença de `try/catch` e logs
- Uso de `alert()` nativo (deve ser SweetAlert2)
- Segurança: sem credenciais hardcoded
- Padrões: `DatasetBuilder`, `fluigAPI`, `log.info/error`

---

#### `fluig-qa`

**Ferramentas:** `Read, Grep, Bash`
**Analisa:**
- Cobertura de constraints no dataset
- Campos obrigatórios nos formulários
- Casos de borda: dataset vazio, erro de conexão, valor nulo
- Testes unitários em widgets Angular

---

#### `fluig-deployer`

**Ferramentas:** `Bash`
**Suporta dois modos:**
1. **SSH** — `ssh vps_4_hostinger_fluig` para copiar artefatos e reiniciar containers
2. **REST** — upload via `POST /api/public/2.0/documents/upload` com OAuth2

---

### Hooks

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "file=$(jq -r '.tool_input.file_path' 2>/dev/null); [[ \"$file\" == *.js ]] && grep -l 'try' \"$file\" > /dev/null || echo 'AVISO: arquivo .js sem try/catch detectado'"
        }]
      }
    ]
  }
}
```

---

## Distribuição

```bash
# Opção 1: --plugin-dir (sem instalar)
claude --plugin-dir /path/to/fluig-plugin

# Opção 2: Instalar no projeto (.claude/ do projeto)
git clone git@bitbucket-totvs:fabricatbc/claude_skills.git .claude/skills
# Plugin fica em .claude/skills/fluig/

# Opção 3: Global (~/.claude/plugins/)
# Adicionar ao known_marketplaces ou instalar manualmente
```

**Namespace das skills:** `/fluig:form`, `/fluig:dataset`, etc.

---

## Relação com Skills Existentes

| Existente (CASSI-específico) | Novo (Genérico) |
|------------------------------|-----------------|
| `cassi/fluig/fluig-form-builder.md` | `fluig/skills/fluig-form/SKILL.md` |
| `cassi/fluig/fluig-dataset-builder.md` | `fluig/skills/fluig-dataset/SKILL.md` |
| `cassi/fluig/fluig-widget-builder.md` | `fluig/skills/fluig-widget/SKILL.md` |
| `cassi/fluig/fluig-workflow-builder.md` | `fluig/skills/fluig-workflow/SKILL.md` |

As skills CASSI continuam existindo para customizações específicas do cliente. O plugin genérico é a base.

---

## Critérios de Sucesso

1. `claude --plugin-dir ./fluig-plugin` carrega todas as 5 skills e 3 agents
2. `/fluig:dataset` gera um dataset JS válido com a estrutura correta
3. `fluig-reviewer` identifica código sem `try/catch` ou com `alert()` nativo
4. Hook avisa sobre `.js` sem tratamento de erros após cada edição

---

## Próximos Passos

→ Invocar `superpowers:writing-plans` para criar o plano de implementação detalhado.
