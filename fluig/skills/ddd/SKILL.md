---
name: ddd
description: Aplica Domain-Driven Design (baseado em Implementing DDD, de Vaughn Vernon) ao desenvolvimento Fluig — linguagem ubíqua em processos BPM, formulários e widgets; bounded contexts entre processos; context mapping com ACL nas integrações (Protheus/terceiros); e padrões táticos adaptados (value objects em TypeScript, o documento do processo como agregado, invariantes validadas no servidor, eventos de domínio via movimentação do workflow). Use quando o dev pedir para "modelar o processo", "aplicar DDD", "definir os contextos", "organizar integração com Protheus", "modelar formulário complexo" ou no brainstorm de processos com regra de negócio rica.
---

# Domain-Driven Design aplicado ao Fluig

Destilação prática de *Implementing Domain-Driven Design* (Vaughn Vernon) para o Fluig.
O Fluig é uma **plataforma de processos** — o domínio aqui é literalmente o processo de
negócio do cliente, o que torna DDD mais natural que em qualquer outro lugar: o diagrama
BPM, o formulário e o widget **são** o modelo, visível para o key-user.

> Skill irmã: `/fluig:clean-architecture` (estrutura de código). No plugin protheus:
> `/protheus:ddd` (mesmos princípios; lá o agregado casa com ExecAuto, aqui com o
> documento do processo).

## Consulta MCP (antes de modelar)

- `searchFluigPatterns({ category: "conventions" })` — convenções do plugin de naming/estrutura.
- MCP do PO-UI (`get_component_docs`) e do Angular CLI (`get_best_practices`) na hora de
  materializar o modelo em widget — versões **nunca fixas**, leia o `package.json`.
- No Fluig Voyager 2.0+, o editor de processos web e os recursos de IA geram diagramas e
  formulários — o papel do DDD continua o mesmo: **garantir que os nomes e fronteiras
  gerados falem a língua do negócio** antes de aprovar.

## Parte estratégica

### 1 — Linguagem ubíqua (o BPM é o lugar dela)

No Fluig a linguagem ubíqua tem materialização direta: **nome do processo, das atividades,
dos campos do formulário e das colunas do dataset**. O key-user lê o diagrama — se a
atividade se chama "Atv_02" ou o campo se chama `txt_val1`, a linguagem morreu.

- Glossário no brainstorm (termo do cliente → significado → campo/atividade/dataset).
- Atividades nomeadas como o negócio fala: "Liberação de desconto pela supervisão",
  não "Aprovação 2".
- Campos de formulário com nome de negócio (`percentualNegociado`), datasets idem
  (`ds_consulta_contratos_vigentes` — a convenção `ds_[acao]_[entidade]` do plugin já
  empurra para isso).
- Detalhes e tabela de glossário: `references/estrategico-fluig.md`.

### 2 — Bounded Contexts

Cada **processo BPM** (com seu formulário, eventos e datasets) é naturalmente um contexto:
"Aprovação de Desconto" ≠ "Admissão de Colaborador" — mesmo que ambos falem de "aprovação".

- 1 processo = 1 modelo. Não reutilize o formulário de um processo em outro "porque é
  parecido" — é assim que nasce o form com 40 campos condicionais.
- Widgets são a **janela** de um contexto: um widget por contexto/finalidade, não um
  God-widget com abas para 5 processos.
- Sinal de fronteira violada: evento de workflow com `if` sobre "de qual processo veio".

### 3 — Context Mapping (o Fluig é o integrador-mor)

Quase todo processo Fluig conversa com o ERP — e o Fluig é **downstream** do Protheus:
o modelo do ERP muda no ritmo da TOTVS, não no seu.

- **ACL (Anticorruption Layer)**: o dataset de integração é a sua ACL natural — ele traduz
  o retorno do Protheus (REST/SQL) para as colunas **na língua do seu processo**. O JSON
  do ERP não circula cru pelo formulário/widget.
- Eventos de processo que gravam no ERP: confine a chamada (formato, rota, payload) numa
  função de infra — quando o endpoint do Protheus mudar, um lugar muda.
- Padrões completos (conformista, cliente-fornecedor, host aberto): `references/estrategico-fluig.md`.

## Parte tática (adaptada ao Fluig)

Detalhes e código: `references/tatico-fluig.md`. O essencial:

| Padrão | No Fluig |
|---|---|
| **Value Object** | Classe/`type` TS no widget (`Cnpj`, `Dinheiro`, `Vigencia`) com validação na criação; no form, máscara + validação client é UX — a validação de verdade repete no evento server |
| **Entidade** | Registro com identidade de negócio (número do contrato) — não o `documentid`/`cardId`, que é detalhe da plataforma |
| **Agregado** | O **documento do processo** (formulário pai + tabelas filhas) é o agregado: muda junto, valida junto. A raiz é o formulário; as invariantes são checadas no `validateForm` (UX) e **garantidas** nos eventos server (`beforeTaskSave`/`afterStateEntry`) |
| **Repositório** | Datasets de consulta (`ds_*`) e serviços de gravação — a plataforma esconde a persistência do card; para dados externos, o dataset-ACL |
| **Serviço de domínio** | Função pura de regra compartilhada entre widget (TS) e eventos (JS) — mesma tabela de decisão nos dois lados |
| **Evento de domínio** | A movimentação do workflow **é** o evento ("pedido aprovado" = transição). Consumidores externos: notificação/integração disparada no `afterStateEntry` da atividade correspondente — nunca espalhada por várias atividades |

Regras de agregado no contexto Fluig:
1. **1 processo = 1 agregado principal** (o documento). Precisa de dados de outro
   agregado (cliente, contrato)? Referencie por **código** e consulte via dataset — não
   copie 20 campos do cliente para dentro do form (cópia desatualiza; consulta não).
2. Invariante escrita em uma frase e **garantida no servidor** — client valida para UX,
   evento server é a autoridade.
3. Consistência com o ERP é **eventual e explícita**: o processo grava no Protheus num
   ponto definido do fluxo (uma atividade de sistema/evento), com tratamento de falha
   visível (pendência/retry), nunca "gravação escondida" em cada passo.

## Fluxo de uso

1. **Brainstorm** (`/fluig:brainstorm`): glossário + contextos + mapa de integrações
   (onde tem ACL?). O diagrama BPM nasce da linguagem ubíqua.
2. **Modelagem**: identifique o agregado (form + filhas), escreva as invariantes,
   liste VOs e a tabela de decisão de cada regra. Gabarito: `references/tatico-fluig.md`.
3. **Implementação**: estruture com `/fluig:clean-architecture`; gere com
   `/fluig:form`, `/fluig:workflow`, `/fluig:dataset`, `/fluig:widget`.
4. **Teste** (`/fluig:test`): as invariantes e a tabela de decisão são os specs Jasmine
   do domínio; o E2E cobre o caminho feliz do processo.

## Regras inegociáveis

- Glossário antes de nomear processo, atividades, campos e datasets.
- Nome técnico da plataforma (`documentid`, `cardId`, `WKNumProces`) não vaza para
  conversa com key-user nem para nome de campo de negócio.
- 1 processo = 1 contexto = 1 modelo; nada de form/dataset "multiuso" entre processos.
- Invariante de agregado garantida em evento server — validação client é só UX.
- Integração com ERP: ACL (dataset/função de infra) única por recurso; falha de
  integração é visível no processo, nunca engolida em catch.
- DDD tático onde há regra rica — processo CRUD simples segue os templates padrão do plugin.
