# DDD tático no Fluig — building blocks com código e um exemplo ponta a ponta

Referência da skill `/fluig:ddd`.

## Value Objects — em TS no widget, validados no server

```typescript
// widget: shared/domain/percentual.ts — imutável, valida ao nascer
export class Percentual {
  private constructor(readonly valor: number) {}
  static de(valor: number): Percentual {
    if (valor < 0 || valor > 100) throw new Error(`Percentual inválido: ${valor}`);
    return new Percentual(valor);
  }
  maiorQue(outro: Percentual): boolean { return this.valor > outro.valor; }
}
```

No formulário (client) o VO vira máscara + validação de UX; no evento server a **mesma
regra** valida de novo (o server é a autoridade — client-side é contornável):

```javascript
// Util/UtilsHandler.js e/ou evento — a mesma tabela de validação
function percentualValido(valor) { return !isNaN(valor) && valor >= 0 && valor <= 100; }
```

Candidatos: `Cnpj`, `Dinheiro` (valor+moeda, aritmética com arredondamento único),
`Vigencia`, `Percentual`, `Matricula`.

## Entidade e identidade

A identidade é **de negócio** (número da solicitação, código do contrato). `documentid`,
`cardId` e `WKNumProces` são detalhes da plataforma: úteis para a infra, proibidos como
identidade no modelo (mudam em migração/reabertura e não significam nada para o key-user).

## Agregado — o documento do processo

O agregado natural do Fluig é o **card**: formulário pai + tabelas filhas (pai×filho).
A plataforma já o trata como unidade (salva junto, versiona junto) — o DDD adiciona o que
falta: **invariantes explícitas garantidas na raiz**.

**Invariante em uma frase** (exemplo): *"Uma solicitação nunca avança da atividade de
elaboração com percentual acima da alçada sem justificativa preenchida."*

```javascript
// events/validateForm.js — client: UX imediata (a mesma tabela de decisão)
function validateForm(form) {
    var perc  = parseFloat(form.getValue("percentualNegociado"));
    var teto  = parseFloat(form.getValue("tetoAlcada"));
    if (perc > teto && isBlank(form.getValue("justificativa"))) {
        throw "Percentual acima da alçada exige justificativa.";
    }
}

// wf_solicitacao_desconto.beforeTaskSave.js — server: a AUTORIDADE
function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    var perc = parseFloat(hAPI.getCardValue("percentualNegociado"));
    var teto = parseFloat(hAPI.getCardValue("tetoAlcada"));
    if (perc > teto && isBlank(hAPI.getCardValue("justificativa"))) {
        throw "Percentual acima da alçada exige justificativa."; // trava a movimentação
    }
}
```

Regras:
1. **Filhas mudam pelas regras da raiz**: total das filhas × limite do pai é invariante do
   agregado — valide o conjunto, não linha a linha isolada.
2. **Referência por identidade**: o form guarda `codigoCliente`; nome/limite/endereço são
   **consultados** via dataset quando exibidos — nunca copiados em massa para o card.
3. **1 processo = 1 agregado**: se um fluxo precisa mexer em dois agregados, são dois
   processos (ou processo + integração), não um form híbrido.

## Repositórios — datasets com papel de coleção

- Leitura: `ds_[acao]_[entidade]` devolve **linhas na língua do processo** (a ACL já
  traduziu o ERP). O widget consome o dataset como se fosse uma coleção do domínio.
- Escrita externa: função de infra única (`gravarPedidoProtheus(dadosPedido)`) chamada de
  **um** ponto do fluxo, com idempotência (confere chave de negócio antes de gravar).
- O card em si é persistido pela plataforma — não construa "repositório de card".

## Serviço de domínio — a regra compartilhada client/server

Regra que cruza dados de fontes diferentes (`decidirDesconto(negociado, alcada, vigente)`)
vive como **função pura** com a mesma assinatura nos dois lados (TS no widget, JS no
evento/Util) e uma única tabela de decisão documentada no design. O spec Jasmine do lado
TS é o teste da tabela; o E2E do processo confirma o server.

## Eventos de domínio — a movimentação É o evento

| Conceito | No Fluig |
|---|---|
| "SolicitacaoAprovada" | Transição para a atividade pós-aprovação |
| Reação interna | `afterStateEntry` da atividade destino (um lugar, não N) |
| Reação externa (ERP, e-mail, outro processo) | Disparada nesse mesmo evento, via função de infra, com falha visível |

Antipadrão: gravar no ERP "um pouquinho em cada atividade". O evento de domínio define
**o** momento da integração; antes dele, o processo é rascunho reversível.

## Exemplo ponta a ponta — "Solicitação de Desconto"

| Building block | Elemento |
|---|---|
| Contexto | Processo "Solicitação de Desconto" (form + eventos + datasets + widget painel) |
| Linguagem | Glossário: solicitação, alçada, liberação pela supervisão, contrato vigente |
| Agregado | Card: form pai (solicitação) + filha (itens do pedido) |
| Invariantes | (1) acima da alçada ⇒ justificativa; (2) soma dos itens = valor da solicitação |
| VOs | `Percentual`, `Dinheiro` (TS no widget; validação espelhada no server) |
| Serviço de domínio | `decidirDesconto()` — TS (spec Jasmine) + JS (eventos) |
| Repositórios/ACL | `ds_consulta_contratos_vigentes` (lê ERP), `gravarDescontoProtheus()` (escreve, 1 ponto) |
| Evento de domínio | Transição "Liberada" → `afterStateEntry` grava no ERP + notifica vendedor |
| Fora do modelo | Consulta gerencial (widget de leitura direto no dataset), anexos, histórico padrão |

## Checklist de brainstorm DDD-Fluig (copiar para o design)

- [ ] Glossário validado pelo key-user; diagrama BPM nomeado por ele
- [ ] 1 processo = 1 contexto; widgets mapeados para seus contextos
- [ ] Invariantes do agregado escritas em frases; cada uma com validação client (UX) **e** server (autoridade)
- [ ] Integrações no mapa: cada recurso externo com sua ACL única e ponto único de escrita
- [ ] Falha de integração modelada (status/pendência/retry — nunca catch vazio)
- [ ] Regras compartilhadas client/server com tabela de decisão única e spec no lado TS
- [ ] Lista explícita do que fica fora do modelo tático
