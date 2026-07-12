# Changelog

Histórico das versões públicas do `dataagile-agent-kit`.

---

## [2.4.0] — 2026-07-12

### Corrigido/Endurecido (mesma release)
- **Playwright é a engine oficial de E2E** (visão computacional); aviso no topo do
  `tir-test-generator` (TIR = só regressão CI opcional); nomenclatura "testes TIR"
  substituída em plan/verify/CLAUDE.md/init-project/brainstorm/plugin.json.
- **`advpl-lint.sh`:** injeção shell→JS neutralizada (dados via ambiente); gate deixou
  de ser no-op com advpls no PATH; relatório bloqueante via stderr; linha correta.
- **`fluig-lint.sh`:** -prune de node_modules, tsc incremental, npx --no-install.
- **Gates mecânicos:** `karma.conf.template.js` (cobertura <70% falha o `npm test`),
  gate do orquestrador no implement, `gates.json` lido nos HARD GATEs de
  deploy/qa/verify, QA com critério verificável por TC e lista fechada de ALTO.
- **Testes novos:** `tests/hooks/` (15 asserts, payloads maliciosos reais).

### Adicionado
- **`/protheus:clean-architecture`** — Clean Architecture (Robert Martin) aplicada a ADVPL/TLPP: regra de dependência, camadas → artefatos Protheus (MVC/REST/PE/ExecAuto), SOLID em TLPP OO com before/after, refatoração guiada do endpoint-monólito com checklist estrutural de review. SKILL.md + 3 references. (protheus 2.12.0)
- **`/protheus:ddd`** — Implementing DDD (Vaughn Vernon) aplicado a Protheus: linguagem ubíqua (glossário ↔ dicionário), bounded contexts (1 = 1 namespace TLPP), ACL sobre ExecAuto/integrações, agregado como fronteira transacional, exemplo de modelagem ponta a ponta. SKILL.md + 3 references. (protheus 2.12.0)
- **`/fluig:clean-architecture`** — camadas no widget Angular + PO-UI (DI do Angular = DIP), god-dataset refatorado, eventos de workflow como adaptadores. **Sem versão fixa de Angular** — consulta o MCP oficial do Angular CLI (`npx -y @angular/cli mcp`) e o `@po-ui/mcp` antes de gerar. SKILL.md + 2 references. (fluig 2.1.0)
- **`/fluig:ddd`** — o processo BPM como bounded context, documento do processo como agregado (client valida UX, evento server é autoridade), falha de integração modelada; compatível com Fluig Voyager 2.0. SKILL.md + 2 references. (fluig 2.1.0)

## [2.3.0] — 2026-06-28

### Adicionado
- **Suíte de skills AdvPL/TLPP da TOTVS** (`totvs/engpro-advpl-tlpp-skills`, MIT — atribuição em `protheus/skills/_THIRD_PARTY/`): geradores (mvc/rest/fwrest/query/entry-point), qualidade (code-review SonarQube G1–G5, sql-code-review, sql-optimization), refactor (2), data-dictionary-lookup, documentation-writer, context-map, create-implementation-plan, advpl-tlpp-sdd, utf8-to-cp1252-conversion, tir-test-generator. 17 skills + references/. Inglês — localização PT-BR follow-up. (protheus 2.1.0)

## [2.2.1] — 2026-06-28

### Corrigido
- **Hooks com bit de execução (`+x`).** Hooks de `protheus/` e `fluig/` estavam `100644`; o `hooks.json` invoca `run-hook.cmd` como executável → `run-hook.cmd: Permission denied` no PostToolUse após `claude plugin update`. Marcados `100755`. (protheus 2.0.9, fluig 2.0.6)

### Adicionado
- **Versionamento + Releases.** Esquema de tag por plugin `<plugin>-vX.Y.Z`, `RELEASING.md`, workflow `release.yml` (cria release no push de tag `*-v*`) e templates de issue/PR padronizando o fluxo issue→PR.

## [2.2.0] — 2026-05-21

### Adicionado
- **Suporte cross-platform** — Codex CLI e Gemini CLI além do Claude Code
- **Instalador npm** (`installer/index.js`) — detecta CLIs instalados automaticamente, registra o MCP server e pede a API key interativamente; suporte a `--dry-run`
- **`get_skill` MCP tool** — carrega qualquer SKILL.md sob demanda via `get_skill({ name: "protheus:specialist" })`; skills públicas (protheus, fluig) disponíveis para todos os tiers; skills privadas (mit-docs) só para tier interno
- **INSTALL.md** — guia completo zero-contexto: Claude Code, Codex CLI, Gemini CLI, pré-requisitos, uso de skills, troubleshooting (5 entradas), desinstalação
- **package.json** com `"bin"` entry para suporte a `npx github:tbc-servicos/dataagile-agent-kit`

### Alterado
- ONBOARDING.md substituído por INSTALL.md como documento primário de instalação

---

## [2.1.0] — 2026-05-05

### Adicionado
- `/protheus:suporte` — diagnóstico de erro ERP por categoria (parametrização, integridade de dados, runtime, performance, ambiente), identifica causa raiz e gera resposta estruturada

---

## [2.0.8] — 2026-04-29

Primeira release pública no GitHub.

### Plugins disponíveis

| Plugin | Versão | O que faz |
|--------|--------|-----------|
| **protheus** | `2.0.8` | ADVPL/TLPP — brainstorm, plan, implement (Agent Teams), deploy TDS-CLI, QA TIR |
| **playwright** | `1.0.0` | Testes E2E — test agents (planner/generator/healer) + autenticação storageState |

---

## Versionamento

Semver por plugin (`MAJOR.MINOR.PATCH`):

- **MAJOR** — mudanças incompatíveis de interface
- **MINOR** — novas features compatíveis
- **PATCH** — correções e ajustes

---

## Suporte

dev@dataagile.com.br

[knowledge.dataagile.com.br](https://knowledge.dataagile.com.br)

[Issues no GitHub](https://github.com/tbc-servicos/dataagile-agent-kit/issues)
