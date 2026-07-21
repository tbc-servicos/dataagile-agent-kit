# Changelog

Histórico das versões públicas do `dataagile-agent-kit`.

---

## [2.6.1] — 2026-07-21

### O implementer parou de adivinhar e de "melhorar" código alheio (protheus 2.14.1 · fluig 2.1.1)

Os agentes `protheus-implementer` e `fluig-implementer` rodam em **contexto isolado** dentro do
Agent Team: não herdam o `CLAUDE.md` do dev nem skill nenhuma. Era exatamente ali que nasciam o
over-engineering e o chute de campo/API — o agente inferia o comportamento pelo nome e seguia.

- **Quatro regras de execução agora fazem parte do prompt dos dois agentes:** *nunca adivinhar*
  (chave, campo, função ou comportamento desconhecido → consultar o MCP ou reportar
  `NEEDS_CONTEXT`; inferir pelo nome está proibido), *código mínimo que resolve a task* (sem
  feature além da pedida, sem abstração de uso único, sem configurabilidade não solicitada),
  *mudança cirúrgica* (não reformatar nem "melhorar" código adjacente; código morto pré-existente
  se reporta, não se apaga) e *toda linha alterada rastreia até a task*.
- **Nova entrada no marketplace: `andrej-karpathy-skills`.** Guidelines comportamentais para
  reduzir erros comuns de LLM em código, apontando para o upstream
  `multica-ai/andrej-karpathy-skills` (MIT, forrestchang) com **sha pinado** — sem fork e sem
  cópia de texto, então não há drift e a licença fica com o autor. Instalação:
  `/plugin install andrej-karpathy-skills@claude-skills-dataagile`.
- **Correção de release:** `protheus/.claude-plugin/plugin.json` estava em `2.14.0` enquanto o
  `marketplace.json` ainda dizia `2.13.0` — o release da 2.14.0 bumpou só um dos dois arquivos.
  Os dois voltaram a bater, como o `RELEASING.md` exige.

---

## [2.6.0] — 2026-07-14

### Regras do SonarQube EngPro agora são gate na hora da gravação (protheus 2.14.0)

As 49 regras oficiais eram **referência de leitura** do `/protheus:reviewer`: o dev só descobria a
violação quando o review rodava — ou, pior, na homologação da TOTVS. Agora a parte mecânica delas é
verificada **no instante em que o fonte é gravado**.

- **Novo hook `sonar-lint.cjs`** (`PostToolUse`): analisa o fonte a cada Write/Edit e aplica **~30
  das 49 regras** — as decidíveis por léxico. BUG e VULNERABILIDADE **bloqueiam** (`exit 2`, com o
  código da regra e como corrigir); CODE SMELL avisa sem travar o dev. Cobre API restrita (`CA2022`
  StaticCall, `CA2023` PTInternal), dicionário por workarea (`CA2000`–`CA2013`), driver ISAM
  (`CA1000`), interface em transação (`CA1002`), `GetMV` em loop (`CA1003`), SQL injection
  (`CA2050`), `IIF` (`CA4000`), include maiúsculo (`CA3001`) e mais.
- **Não depende do `advpls`/TDS-LS**: é análise de texto, roda em qualquer máquina em
  milissegundos — inclusive para quem não tem o binário instalado.
- **Supressão exige justificativa:** `// sonar:ignore CA1000 <motivo>`. Sem motivo, não vale — e o
  reviewer continua reportando de qualquer jeito.
- **Testes:** 40 unitários do motor (incluindo casos de **falso positivo**: regra citada em
  comentário ou string não pode acusar) + 8 do contrato do hook.

### Infra de qualidade

- **`tests/run-all.sh` e CI**: o repo tinha testes que **nada executava**. Agora há runner agregado
  e workflow do GitHub Actions rodando a suíte em todo push e PR.
- **Corrigido** o teste do sincronizador de regras: o servidor falso usava porta fixa e `kill %1`
  (que não funciona sem job control), deixando um processo órfão que servia conteúdo velho.

---

## [2.5.0] — 2026-07-13

### Adicionado
- **Catálogo oficial das 49 regras SonarQube da EngPro TOTVS** (39 BUG · 9 CODE SMELL · 1 VULNERABILIDADE) em `protheus/skills/reviewer/references/sonarqube-rules-engpro.md` — com causa, descrição, **como corrigir** e exemplos. O `/protheus:reviewer` passa a citar o código da regra (ex.: `CA4000`) e a correção oficial: a mesma régua da homologação TOTVS. (protheus 2.13.0)
- **`scripts/sync-sonar-rules.cjs`** — sincronizador versionado a partir de https://sonar-rules.engpro.totvs.com.br. A fonte é uma SPA Angular **sem API**: o script descobre o bundle, extrai o catálogo embutido e baixa o detalhe de cada regra, gerando markdown determinístico. `--check` detecta quando a TOTVS publica regra nova; falha explícita se o formato da SPA mudar.
- **Teste** com servidor falso (10 asserts): parser, extração do "como corrigir", `--check` e fail-fast de formato.

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
