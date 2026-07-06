---
name: smartview-relatorio
description: Gera um relatório TOTVS SmartView de ponta a ponta, do código ao artefato renderizando dados. A partir de uma especificação (tabelas/campos Protheus, query SQL ou dados literais), gera o Business Object TLPP (IntegratedProvider), compila no AppServer via advpls (TDS CLI remoto), registra na discovery e monta o artefato no SmartView (Data Grid, Tabela Dinamica/Pivot ou Report). Esta skill deve ser usada quando o usuario pedir para criar ou gerar um relatorio SmartView, fazer um Business Object para o SmartView, publicar um IntegratedProvider, gerar Data Grid, Pivot ou Report no SmartView, ou desenvolver relatorios SmartView com agentes de IA. Cobre um ambiente SmartView (TReports) self-hosted ligado a um AppServer Protheus.
---

# Gerar relatório SmartView (código → artefato renderizando)

## Visão geral

Um relatório SmartView tem **duas camadas**:
1. **Backend — Business Object TLPP** (`IntegratedProvider`): define os dados (`getData`) e o schema
   de colunas/parâmetros (`getSchema`). É código, 100% gerável.
2. **Artefato no SmartView** (Data Grid / Pivot / Report): consome o BO. Criado na plataforma
   (via API REST + UI). O `.trp` exportado é cifrado pelo servidor — **nunca gerar offline**.

Os BOs **padrão** da TOTVS podem vir vazios num ambiente sem dado/empresa configurada. Um **BO
customizado próprio** (com `getData` que lê uma tabela com dado OU devolve dados literais) renderiza
de forma confiável. Para validar a esteira, comece com um BO de dados literais.

## Fluxo (executar em ordem)

### 1. Gerar o Business Object TLPP
Use `scripts/generate_bo.py` (Jinja2) a partir de um spec JSON (ver `scripts/example_spec.json`), OU
escreva o `.tlpp` direto seguindo `assets/VENDASIA.tlpp` (exemplo completo com dados literais).
Regras do padrão: namespace `tbc.fsw.smartview.*`, herda `totvs.framework.treports.integratedprovider.IntegratedProvider`,
decorator `@totvsFrameworkTReportsIntegratedProvider`, métodos `new()/getData()/getSchema()`,
`getData` faz `self:oData:appendData(JsonObject)` por linha + `self:setHasNext(.F.)`,
`getSchema` declara `self:addProperty(id,titulo,tipo,desc,campo)`. Sem `BEGIN SEQUENCE`. Ver
detalhes em `references/recipe.md` (seção "Padrão IntegratedProvider").

#### 1.1 Escolha o padrão de `getData` pela complexidade (não reescreva SQL à toa)
- **`self:oData:aliasToData("SED", oFilter)`** — framework lê o alias, pagina e devolve. Zero loop. Para 1 tabela simples sem JOIN. (`aliasToData` é método de `oData`, como o `appendData`.)
- **`setQuery(cQuery)` + `setWhere(cWhere)` + `setOrder(...)`** com placeholders `#QueryFields#` / `#QueryWhere#` — framework itera e pagina. Para query customizada de 1 tabela.
- **Manual** (montar `cQuery`, abrir alias, loop `while` + `appendData(JsonObject)`) — **só** quando há JOIN/cálculo/LGPD/aninhados. Implementar `setPageSize`, o skip `(nPage-1)*pageSize` e o `setHasNext` explicitamente.
- `oFilter` oferece: `hasFilter()`, `getSQLExpression()` (WHERE pronto), `hasFields()`/`getFields()` (subset de colunas pedido), `getParameters()` (parâmetros nativos).

#### 1.2 Schema: propriedades, parâmetros de filtro e lookup
- `addProperty(cId, cTitulo, cType, cDescricao, cRealName)` — mesma assinatura da linha "id,titulo,tipo,desc,campo" acima (ex.: `assets/VENDASIA.tlpp`: `addProperty("VENDEDOR","Vendedor","string","Nome do vendedor","VENDEDOR")`). `cType` ∈ `string|number|boolean|date|memo`. O **cRealName** (nome real do campo) é essencial p/ o filtro funcionar; para campo manual, repetir o cId.
- **Filtro de período / parâmetro nativo:** `addParameter(cId, cDisplayName, cType, lIsMultiValue, cUrl, lHasOptions, lHasLookUp, cIdConsult[, cParamId, cDescription, lAllowNull, aDefaultValues])` — suporta lookup (F3), combo (SX1), multivalor e valor default (ex.: `{totvs.framework.treports.date.dateToTimeStamp(Date())}`). Recuperar no getData via `oFilter:getParameters()`. É o jeito certo de DATA_INI/DATA_FIM.
- **Aninhados** (`addNestedProperty`/`transformInNested`): hierarquia pai-filho — **não são filtráveis e não paginam** (entregar completos). Para volume alto, prefira flat + agrupamento no design.

#### 1.3 🔴 Datas — conversão OBRIGATÓRIA
Todo campo `date` no `appendData` precisa virar timestamp — e a função depende do **tipo** do valor: campo de data nativo (`(cAlias)->CAMPO`, tipo `D`) → `totvs.framework.treports.date.dateToTimeStamp((cAlias)->CAMPO)`; valor já string (calculado/concatenado) → `stringToTimeStamp(...)`. O padrão da fábrica usa um dispatcher `varToTimeStamp` que escolhe por `valType`. Gravar `AllTrim`/string crua (sem timestamp) → o valor chega **nulo** no SmartView. E **desative `MV_HVERAO`** (horário de verão) — ele distorce `FwTimeStamp` e gera datas erradas (ex.: "visão retroativa" trazendo títulos indevidos).

#### 1.4 🔴 Query manual — qualifique os campos
Em getData com JOIN, **qualifique todo campo** (`alias.CAMPO`). Campo ambíguo (ex.: `D3_EMISSAO` em 2 tabelas) → `connectors.native.failed-to-deserialize` / `internal-server-error`. Trate também caractere especial (apóstrofo `'`) nos dados — quebra Pergunte/Profile.

### 2. Compilar no AppServer (advpls remoto — NÃO trava o RPO)
Use `scripts/compile_bo.sh <fonte.tlpp> <environment>` (default env `CLIENTES_FSW_REST`). Ele monta o
`advpls.ini` e chama o `advpls` (TDS-LS) conectando no AppServer **rodando** pela porta TCP de build.
`appsrvlinux -compile` LOCAL falha ("Failed to open repository" — RPO travado pelo appserver vivo).
Pré-requisitos e valores (porta, includes, credenciais) em `references/recipe.md` (seção "Compilação").

### 3. Registrar + verificar discovery
Reinicie o AppServer para registrar o IntegratedProvider (a REST fica ~60s indisponível após o
commit do build — esperar `/<namespace>/ping` → 401). **Pré-requisitos de INI** (confirmar as chaves exatas do seu ambiente em `references/recipe.md`): REST 2.0 com **segurança habilitada** (o discovery `/.well-known/treports/` exige a REST autenticada) e a seção `[REPORTSERVICE]` configurada.
Confirme via API: `GET /api/connectors/business-objects?q=<nome>` (use `scripts/smartview_client.py`).
Ligue `FwTraceLog=1` no INI para logar a integração.

### 4. Montar o artefato no SmartView
- **Data Grid / Pivot**: criar pela UI (Playwright) escolhendo o BO + campos — rebind via API **não**
  reconfigura colunas. Validar render via API: `POST /api/resources/{data-grid|pivot-table}/<id>/viewer-data`.
- **Report (PDF)**: exige a lib nativa **`libfontconfig1`+`libfreetype6`** no container do smartview-agent
  (DevExpress/SkiaSharp) — sem ela, `designer-model` dá 500. Instalar + reiniciar o agent. Layout do
  Report monta-se no designer (arrastar o BO/campos para a banda Detail). Detalhes em `references/recipe.md`.

### 5. Verificar de forma independente (anti-falso-positivo)
SEMPRE confirme o render por um canal próprio (não só pelo agente Playwright): `viewer-data` via API
para Grid/Pivot; para Report, ler o screenshot do viewer. "Existir" ≠ "renderizar dado".

### 6. Da geração ao uso (chamar do Protheus)
- **Amarração:** registrar o recurso no Protheus via Configurador > **Integração Smart View** (grava a amarração no dicionário), senão o recurso não aparece no menu do módulo.
- **Chamar:** classe `totvs.framework.smartview.callSmartView():new(cId, cType)` (`report`/`pivot-table`/`data-grid`) → `setParam` / `executeSmartView` / `getError`. Substitui `callTReports` (depreciada, LIB 20240226+).
- **Permissões:** o **Grupo Default nega TODOS os BOs** — após publicar, criar privilégio explícito por BO/usuário no Configurador; liberar também os lookups/combos dos parâmetros.

## Falhas comuns (troubleshooting — casos reais de suporte)
| Erro / sintoma | Causa | Fix |
|---|---|---|
| `connectors.native.failed-to-deserialize` / "conteúdo não condiz com o padrão esperado" | Campo ambíguo no JOIN; ou apóstrofo (`'`) no dado quebrando Pergunte/Profile | Qualificar campos; limpar caractere especial; aplicar patch |
| `connectors.native.internal-server-error` após incluir campos | Ambiguidade de campo (ex.: `D3_EMISSAO`) | Qualificar `alias.campo` |
| "Não foi possível encontrar o objeto de negócio no conector" | Vínculo BO↔conector perdido (SaaS) | Refazer conector; patches 12.1.2507.14 / 2511.8 / 2603.2 (fix 2607) |
| "Usuário não possui acesso ao objeto de negócio" | Grupo Default nega tudo; `[REPORTSERVICE]` no INI | Criar privilégio por BO; conferir `[REPORTSERVICE]` |
| "400 BadRequest" / conectores/relatórios não abrem / "Falha ao recuperar a estrutura" | URL externa do SmartView não liberada nas máquinas dos usuários | Infra libera a URL; relatório apontando `servidor.local` → usar IP |
| "Servidor não está respondendo" (grande volume, >1h) | Paginação/buffer/timeout | `setPageSize` + `setHasNext` corretos; filtros de período curtos |
| Datas / "visão retroativa" divergentes | `MV_HVERAO` distorce `FwTimeStamp` | Desativar `MV_HVERAO` |
| Erros intermitentes de estrutura/profile | Profile do relatório corrompido | Apagar/recriar o profile (não precisa dropar tabelas) |

> Personalização de campos em BO nativo (via Configurador) exige **Porta Multiprotocolo + Interface PO UI** ativas.

## Regras de modelo (TBC)
- Tarefas com **Playwright** (montar artefato na UI, screenshots) → SEMPRE `model: sonnet`.
- Geração de código/scaffolding → `haiku`.

## Recursos
- `scripts/generate_bo.py` + `scripts/templates/integratedprovider.tlpp.j2` — gerador do BO.
- `scripts/smartview_client.py` — cliente da API SmartView (auth Basic→Bearer, find-BO, viewer-data, import/rebind/export).
- `scripts/compile_bo.sh` — compila o `.tlpp` remoto via advpls.
- `assets/VENDASIA.tlpp` — BO de exemplo (dados literais) que renderiza.
- `references/recipe.md` — receita detalhada do ambiente (portas, credenciais por env, gotchas, endpoints).
