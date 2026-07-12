---
name: clean-architecture
description: Aplica os princípios de Clean Architecture (livro de Robert Martin, o Uncle Bob) ao desenvolvimento Fluig — regra de dependência e camadas no widget Angular + PO-UI (component → service de aplicação → domínio puro → adapter HTTP/Dataset), datasets server-side e eventos de workflow como adaptadores finos, SOLID em TypeScript com a DI do Angular. Use quando o dev pedir para "organizar o widget em camadas", "desacoplar regra de negócio do componente", "aplicar clean architecture", "aplicar SOLID", "onde colocar essa regra", "dataset está gigante" ou quando o brainstorm/plan/review precisar de critério estrutural de design.
---

# Clean Architecture aplicada ao Fluig

Destilação prática dos princípios de *Clean Architecture* para os dois mundos do Fluig:
o **widget Angular + PO-UI** (front) e o **lado plataforma** (datasets, eventos de
workflow e formulários). Objetivo: regra de negócio que sobrevive a troca de tela, de
endpoint e de versão — e é **testável com Jasmine/Karma sem HTTP nem plataforma no ar**.

> Skills irmãs: `/fluig:ddd` (modelagem — *o que* construir), esta (estrutura — *como
> organizar*). Se o time também usa o plugin protheus, os equivalentes são
> `/protheus:clean-architecture` e `/protheus:ddd` — mesmos princípios, outro stack.

## Consulta MCP (antes de gerar código)

- **Versão do Angular/PO-UI: nunca fixe em código novo.** Leia o `package.json` do projeto;
  para projeto novo, use a versão estável atual do Angular (o PO-UI acompanha o major do
  Angular). Confirme via MCP — não confie na memória do modelo para versão.
- **MCP do Angular CLI** (`npx -y @angular/cli mcp`): `get_best_practices` e
  `search_documentation` antes de decidir padrão (standalone, signals, control flow);
  `list_projects` para entender o workspace; `modernize`/`onpush_zoneless_migration` em
  código legado.
- **MCP do PO-UI** (`@po-ui/mcp`, já configurado no plugin): `list_components` +
  `get_component_docs` antes de escrever qualquer componente visual; `get_guide` para
  temas (acessibilidade, theming).
- **MCP tbc-knowledge**: `searchFluigPatterns({ category: "conventions" })` para as
  convenções do plugin (estrutura de pastas, naming `wg_`/`ds_`/`wf_`).

## A Regra de Dependência

**Dependências apontam para dentro: apresentação → aplicação → domínio ← infraestrutura.**
A regra de negócio não conhece componente, template, HttpClient nem DatasetFactory.

```
[ Component/Page PO-UI · template · evento de form · evento de workflow ]  ← entrada/saída
        ↓ chama
[ Service de aplicação (caso de uso): orquestra, coordena estado ]         ← aplicação
        ↓ chama                          ↓ chama (via interface)
[ Domínio: classes/funções TS puras ]  [ Adapter: HttpClient, DatasetFactory, hAPI ]
```

Teste rápido de violação: **se o mesmo arquivo tem template/HTTP E um cálculo/decisão de
negócio, ele está em duas camadas** — dividir. Vale para `.component.ts` e para `ds_*.js`.

## Mapa de camadas → artefatos Fluig

### No widget (Angular + PO-UI)

| Camada | Artefato | Regra |
|---|---|---|
| Domínio | `domain/` — classes e funções TS **puras** (cálculo, validação, decisão) | Zero import de `@angular/*` ou `@po-ui/*`. Testável com Jasmine puro, sem TestBed |
| Casos de uso | `services/` de aplicação (`aprovacao.service.ts`) | Orquestra: chama domínio + repositórios, expõe estado (signal/observable) para a página |
| Adaptadores de dados | `services/api/` (`pedido-api.service.ts`) | **Só** HTTP/DatasetFactory: monta request, traduz response em modelo do domínio. Nenhum `if` de negócio |
| Apresentação | `components/`, `pages/` | Dumb por padrão: recebe input, emite output, delega ao service. Lógica no template = só exibição |

- A **DI do Angular já entrega o DIP**: o caso de uso recebe o adapter pelo construtor
  (`inject()`); para testar, provê-se um dublê no `TestBed` — sem `HttpTestingController`
  para testar regra de negócio.
- Componente com `HttpClient` injetado = violação direta (pula duas camadas).

### No lado plataforma (server-side JS)

| Camada | Artefato | Regra |
|---|---|---|
| Adaptador | `createDataset()` / evento (`afterStateEntry`, `validateForm`) | Fino: extrai entrada (constraints, `hAPI`, campos), chama as funções de regra, devolve/grava. try/catch + log aqui |
| Domínio | Funções puras no mesmo arquivo (Rhino não tem import) | Recebem dados, devolvem resultado. Sem `DatasetFactory`, sem `hAPI`, sem `log` |
| Infra | Funções `buscarX()`/`gravarY()` que encapsulam `DatasetFactory`/SQL/REST | Todo acesso a dado externo vive aqui; a URL/serviço do Protheus aparece **num único lugar** |

O antipadrão nº 1 do Fluig é o **god-dataset**: `createDataset()` com 300 linhas fazendo
constraint parsing + REST + regra + montagem de dataset. A refatoração guiada está em
`references/plataforma-datasets-eventos.md`.

## SOLID em TypeScript/Angular — resumo operacional

- **S**RP — um service = um assunto; componente > ~200 linhas ou service que mistura
  HTTP + regra + formatação → dividir.
- **O**CP — variação por estratégia injetada (token de DI + implementações), não `switch`
  de tipo replicado.
- **L**SP — implementações de uma interface honram o contrato (sem `throw "não suportado"`).
- **I**SP — interfaces por papel (`ConsultaPedidos`, `AprovaPedidos`), não um `ApiService` gordo.
- **D**IP — casos de uso dependem de abstração (`abstract class`/token); Angular DI injeta a
  concreta. Detalhes e exemplos: `references/camadas-widget-angular.md`.

## Quando aplicar (pragmatismo)

| Tamanho | Estrutura mínima |
|---|---|
| Dataset de consulta simples, evento trivial | Só a regra de sempre: função extraída se houver decisão de negócio |
| Widget pequeno (1 página, 1 fonte de dados) | `api.service` separado do service de aplicação; domínio se houver cálculo |
| Widget grande / processo com regra rica | Camadas completas + `domain/` com specs próprios |

Não crie `domain/` para um widget que só lista um dataset — sobre-engenharia também é dívida.

## Fluxo de uso

1. **Design** (`/fluig:brainstorm` / `/fluig:plan`): por caso de uso, defina os artefatos
   por camada antes de codar; marque o que é regra pura (testável sem TestBed/plataforma).
2. **Implementação** (`/fluig:widget`, `/fluig:dataset`, `/fluig:workflow`,
   `/fluig:implement`): siga os esqueletos das references.
3. **Review** (`/fluig:review`): checklist estrutural em
   `references/plataforma-datasets-eventos.md` e `references/camadas-widget-angular.md`.
4. **Teste** (`/fluig:test`): a recompensa — domínio com Jasmine puro (rápido, sem TestBed);
   adapter com `HttpTestingController`; componente só com teste de interação.

## Regras inegociáveis

- Componente/página **nunca** injeta `HttpClient` nem chama `DatasetFactory` — sempre via service.
- Regra de negócio **nunca** importa `@angular/*`, `@po-ui/*`, nem toca `hAPI`/`DatasetFactory`.
- Evento de workflow/form delega para função nomeada — a lógica nunca mora inline no evento.
- Integração REST Protheus: URL/rota/parse em **um único** adapter por recurso.
- Toda regra pura nasce com spec Jasmine (o `/fluig:test` cobra cobertura ≥ 70%).
- try/catch + log nos adaptadores server-side (regra do plugin) — mas o catch **não engole**:
  loga e propaga/devolve erro estruturado.
