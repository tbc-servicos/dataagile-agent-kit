---
name: ddd
description: Aplica Domain-Driven Design (baseado em Implementing DDD, de Vaughn Vernon) ao desenvolvimento Protheus — linguagem ubíqua com o cliente, bounded contexts para organizar customizações, context mapping para integrações, e padrões táticos em TLPP (entidades, value objects, agregados, repositórios, serviços e eventos de domínio). Use quando o dev pedir para "modelar o domínio", "aplicar DDD", "definir bounded context", "organizar uma customização grande por contexto", "modelar integração entre sistemas", "criar value object/agregado", ou no brainstorm de desenvolvimentos com regra de negócio rica.
---

# Domain-Driven Design aplicado a Protheus

Destilação prática de *Implementing Domain-Driven Design* (Vaughn Vernon) para o mundo
ADVPL/TLPP. DDD responde **o que construir e como falar sobre isso com o cliente**;
a skill irmã `/protheus:clean-architecture` responde **como organizar o código**. Use as
duas juntas em desenvolvimentos com regra de negócio rica.

> Regra de ouro do livro: DDD vale a pena onde a **complexidade está no negócio** (regras,
> exceções comerciais, fluxos do cliente) — não em CRUD. Um cadastro simples via MVC padrão
> não precisa de agregado; a política de crédito com 12 exceções comerciais precisa.

## Parte estratégica (começa aqui, não no código)

### 1 — Linguagem ubíqua

Um vocabulário único, **do negócio do cliente**, usado em conversa, especificação, nome de classe,
método e teste. No Protheus a tentação é falar "o ZC1", "o campo ZC1_PERC" — a linguagem
ubíqua exige `ContratoComercial`, `PercentualNegociado`.

- Construa o **glossário no brainstorm** (termo do cliente → significado → tabela/campo que o
  materializa) e mantenha na especificação. Detalhe: `references/estrategico.md`.
- Código nomeado pela linguagem: `Class ContratoComercial`, `Method EstaVigente()`.
  O nome da tabela (ZC1) aparece **só no repositório**.
- Teste de sanidade: leia o método em voz alta para o key-user. Se ele não reconhece o termo,
  o nome está errado (ou o modelo está).

### 2 — Bounded Contexts

Um modelo vale dentro de uma fronteira explícita. "Produto" no contexto **Vendas** (preço,
tabela de desconto) não é o mesmo "Produto" de **Estoque** (endereçamento, lote) — e forçar
um modelo único gera o God-fonte com 30 parâmetros.

No Protheus, as fronteiras naturais: o módulo (SIGAFAT/SIGAEST/SIGAFIN), o processo do
cliente, o time que responde. Regras práticas:
- **1 contexto = 1 namespace TLPP** (`cliente.vendas`, `cliente.logistica`) e 1 pasta de fontes.
- Customização não cruza contexto por variável `Private`/tabela compartilhada — cruza por
  contrato explícito (ver context mapping).
- Sinal de fronteira violada: a mesma classe/função precisa de `If` por módulo chamador.

### 3 — Context Mapping (integrações)

Todo desenvolvimento Protheus integra com algo — ERP padrão, Fluig, e-commerce, legado.
O mapa de contextos torna explícito **quem manda no modelo** (upstream) e **quem se adapta**
(downstream). O padrão mais importante para o dia a dia:

- **ACL — Anticorruption Layer**: uma camada sua que traduz o modelo alheio para o seu.
  O JSON do e-commerce ou o retorno do ExecAuto **não circulam cru** pelo seu domínio —
  são convertidos na borda. Padrões, exemplos e tabela de decisão: `references/estrategico.md`.

## Parte tática (os building blocks em TLPP)

Detalhes e código completo em `references/tatico-tlpp.md`. O essencial:

| Padrão | O que é | No Protheus/TLPP |
|---|---|---|
| **Value Object** | Valor imutável definido pelos atributos, com validação no construtor | `Class Cnpj`, `Class Dinheiro`, `Class Vigencia` — TLPP class que valida ao nascer e não tem setter |
| **Entidade** | Tem identidade que persiste no tempo | `ContratoComercial` (id = número); a identidade **não** é o R_E_C_N_O_ |
| **Agregado** | Conjunto entidade-raiz + filhos que muda **numa transação só**, invariantes garantidas pela raiz | Pedido (SC5+SC6): itens só mudam via métodos da raiz; persistência = 1 ExecAuto = 1 transação |
| **Repositório** | Coleção que esconde a persistência, **um por agregado** | `IPedidoRepo` (interface) + implementação BeginSQL/ExecAuto |
| **Serviço de domínio** | Regra que não pertence a uma entidade (envolve várias) | `PoliticaCredito:Avaliar(oCliente, oPedido, oHistorico)` |
| **Serviço de aplicação** | Caso de uso: orquestra, transaciona, não contém regra | = camada "caso de uso" da `/protheus:clean-architecture` |
| **Evento de domínio** | Fato ocorrido que outros contextos consomem | "PedidoFaturado" → grava em tabela de eventos/fila; workflow Fluig e integrações reagem sem acoplar |

Regras de agregado que evitam os erros clássicos (Vernon insiste nelas):
1. **Agregados pequenos** — modele a menor fronteira que protege a invariante real.
2. **Referencie outros agregados por identidade** (código do cliente), não por objeto.
3. **1 transação = 1 agregado**; consistência entre agregados é **eventual** (eventos),
   não um `BeginTran` gigante em 5 tabelas de contextos diferentes.

## Fluxo de uso

1. **Brainstorm** (`/protheus:brainstorm`): monte glossário (linguagem ubíqua), identifique
   os contextos envolvidos e desenhe o context map (quem é upstream? precisa de ACL?).
   Anexe à especificação aprovada.
2. **Modelagem tática**: para cada contexto, liste agregados (com invariantes!), value
   objects e serviços. Gabarito completo: `references/exemplo-modelagem.md`.
3. **Implementação**: estruture com `/protheus:clean-architecture` (o domínio DDD é a camada
   interna); gere com `/protheus:writer`/`/protheus:implement`.
4. **Teste**: invariantes de agregado e value objects são os melhores alvos de teste unitário (ex.: PROBAT, do tlppCore) —
   puros, sem banco.

## Regras inegociáveis

- Glossário de linguagem ubíqua antes de nomear classes em desenvolvimento com regra rica.
- Nome de tabela/campo (ZC1, C5_DESC) não aparece fora de repositório e dicionário.
- 1 bounded context = 1 namespace; comunicação entre contextos só por contrato (ACL/evento).
- Invariante de agregado protegida na raiz — nunca "cada tela valida por si".
- 1 transação por agregado; nada de `BeginTran` atravessando contextos.
- DDD tático só onde há regra de negócio rica — CRUD segue MVC padrão (`/protheus:mvc-generator`).
