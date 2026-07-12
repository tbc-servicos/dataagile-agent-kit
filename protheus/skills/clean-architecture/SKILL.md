---
name: clean-architecture
description: Aplica os princípios de Clean Architecture (livro de Robert Martin, o Uncle Bob) ao desenvolvimento ADVPL/TLPP — regra de dependência, separação em camadas (domínio, caso de uso, adaptador, framework Protheus), SOLID em TLPP OO e organização de fontes por domínio. Use quando o dev pedir para "organizar em camadas", "desacoplar regra de negócio", "aplicar clean architecture", "aplicar SOLID", "onde colocar essa regra", "separar SQL da regra", "estruturar um desenvolvimento grande" ou quando o brainstorm/plan/reviewer precisar de critério estrutural de design.
---

# Clean Architecture aplicada a ADVPL/TLPP

Destilação prática dos princípios do livro *Clean Architecture* para o ecossistema Protheus.
O objetivo não é academicismo: é que a **regra de negócio do cliente sobreviva** a troca de
tela, de banco, de release e de dev — e seja **testável por unidade, sem subir tela nem
depender de massa de dados**.

> Skills irmãs: `/protheus:ddd` (modelagem do domínio — *o que* construir),
> esta skill (estrutura — *como organizar*), `/protheus:migrate` (procedural → TLPP OO) e
> `/protheus:refactor-method-complexity-reduce` (extração de métodos em função complexa).

## A Regra de Dependência (o coração do livro)

**Dependências de código apontam sempre para dentro — da infraestrutura para o domínio,
nunca o contrário.** A regra de negócio não conhece tela, endpoint, tabela nem framework.

```
[ REST @Get/@Post · ModelDef/ViewDef · Ponto de Entrada · Schedule ]   ← entrada/saída
        ↓ chama
[ Caso de uso: orquestra, valida entrada, controla transação ]        ← aplicação
        ↓ chama                     ↓ chama
[ Regra de negócio pura ]    [ Repositório / ExecAuto wrapper ]        ← domínio · persistência
   (sem SQL, sem tela)          (todo SQL/RecLock vive AQUI)
```

Teste rápido de violação: **se a função tem `BeginSQL`/`RecLock` E um cálculo de negócio
E monta JSON/tela, ela está em três camadas ao mesmo tempo** — dividir.

## Mapa de camadas → artefatos Protheus

| Camada (livro) | No Protheus | Regra |
|---|---|---|
| Entidades / regras de negócio | Classes TLPP ou Static Functions **puras**: cálculo, validação, decisão | Zero SQL, zero tela, zero `RecLock`. Recebe dados, devolve resultado. Filial/parâmetros (`SuperGetMV`) entram **por argumento**, não são lidos dentro |
| Casos de uso | Uma classe/função de aplicação por operação (`IncluirPedido`, `AprovarDesconto`) | Orquestra: valida entrada → chama regra → chama repositório/ExecAuto → devolve resultado tipado. É a **única** camada que controla transação (`BeginTran`) |
| Adaptadores de interface | Endpoint REST TLPP, `ModelDef`/`ViewDef`, Ponto de Entrada, job/Schedule | Só traduz: parseia entrada, chama o caso de uso, formata a resposta. **PE nunca contém a regra** — delega para função externa (regra que o plugin já exige) |
| Frameworks & drivers | Dicionário SX*, FWFormModel, ExecAuto, DBAccess, BeginSQL | Acessados somente via repositórios/wrappers. `ExecAuto` é a "porta oficial" de escrita em tabela padrão — nunca `RecLock` direto em SA1/SC5/etc. |

## SOLID em TLPP — resumo operacional

- **S**RP — um fonte/classe/função = um motivo para mudar. Função > ~60 linhas ou que mistura
  camadas → extrair (a skill `/protheus:refactor-method-complexity-reduce` automatiza a
  extração). Detalhes e exemplos: `references/solid-tlpp.md`.
- **O**CP — variações de comportamento por **classe/bloco injetado**, não por `Do Case` de tipo
  espalhado em N funções.
- **L**SP — subclasse TLPP honra o contrato da base (mesmos pré/pós-requisitos; não "lança erro
  se for do tipo X").
- **I**SP — interfaces TLPP pequenas por papel (`ICalculaFrete`), não uma `IUtils` gorda.
- **D**IP — caso de uso depende de **interface** de repositório; a implementação concreta
  (BeginSQL/ExecAuto) é injetada no construtor. É isso que permite testar a regra com dublê.

## Organização de fontes (screaming architecture)

O diretório grita **o domínio**, não a tecnologia: agrupe por assunto de negócio
(`faturamento/`, `estoque/`), não por tipo (`apis/`, `queries/`, `telas/`). Dentro de cada
assunto, os sufixos de camada dizem o papel: `*Service` (caso de uso), `*Repo` (persistência),
regra pura sem sufixo. A nomenclatura de arquivo segue a convenção do projeto; a organização
é por pasta e namespace TLPP (`namespace cliente.faturamento`).

## Quando aplicar (pragmatismo)

| Tamanho da mudança | Estrutura mínima |
|---|---|
| PE trivial, ajuste de 1 função | Só a regra de sempre: PE delega para User Function |
| Rotina nova média (1–3 fontes) | Separar ao menos **regra pura** × **acesso a dados** (2 funções/classes) — o suficiente para testar a regra por unidade, sem banco |
| Desenvolvimento grande (módulo, integração, N fontes) | Camadas completas: adaptador → caso de uso → domínio + repositórios, 1 namespace por contexto |

Sobre-engenharia também é dívida: **não** crie interface + repositório + service para
encapsular um `Posicione()`. O critério é: a regra de negócio merece viver isolada e testada.

## Fluxo de uso

1. **No design** (`/protheus:brainstorm` / `/protheus:plan` / `/protheus:advpl-tlpp-sdd`):
   para cada caso de uso da especificação, defina os artefatos por camada (tabela acima)
   antes de codar. Liste que regra é pura (testável por unidade) e que acesso a dados vira
   repositório/ExecAuto.
2. **Na implementação** (`/protheus:writer` / `/protheus:implement`): siga
   `references/regra-dependencia-camadas.md` (esqueleto de cada camada com código) e valide
   contra os sinais de violação.
3. **No review** (`/protheus:reviewer` / `/protheus:code-review`): aplique o checklist
   estrutural de `references/refatoracao-exemplo.md` — o exemplo before/after mostra o
   monólito típico (endpoint que faz tudo) e a versão em camadas.
4. **Testes**: a recompensa da separação — regra pura testada por unidade (ex.: PROBAT, o
   framework de testes do tlppCore) sem fixture de banco; o E2E de tela fica com
   `/protheus:tir-test-generator`.

## Regras inegociáveis

- Regra de negócio **nunca** contém `BeginSQL`, `RecLock`, `MsMessage` ou montagem de JSON.
- Endpoint REST / PE / ViewDef **nunca** acessa tabela diretamente — sempre via caso de uso.
- Escrita em tabela padrão TOTVS = **ExecAuto** (encapsulado em repositório), nunca `RecLock`
  direto (pula validações do dicionário).
- Transação (`BeginTran`/`EndTran`) pertence ao caso de uso — nem à regra, nem ao repositório.
- Todo caso de uso novo nasce com teste unitário da(s) regra(s) pura(s) que orquestra.
