# DDD tático em TLPP — building blocks com código

Referência da skill `/protheus:ddd`. Cada padrão tático com implementação TLPP idiomática
(notação húngara, convenções do plugin) e o critério de quando usar.

## Value Object — o padrão mais barato e mais subusado

Valor definido pelos atributos (dois CNPJs iguais SÃO o mesmo CNPJ), **imutável**, com a
validação no construtor — elimina a família de bugs "string crua circulando".

```tlpp
namespace cliente.compartilhado

Class Cnpj
    Private Data cNumero As Character
    Public Method New(cNumero) Constructor
    Public Method Valor()
    Public Method Formatado()
    Public Method IgualA(oOutro)
EndClass

Method New(cNumero) Class Cnpj
    Local cLimpo := StrTran(StrTran(StrTran(cNumero, ".", ""), "/", ""), "-", "")
    If Len(cLimpo) != 14 .Or. !ValidaCnpjDigitos(cLimpo)   // regra do VO, no VO
        UserException("CNPJ inválido: " + cNumero)
    EndIf
    ::cNumero := cLimpo
Return Self

Method Valor() Class Cnpj ; Return ::cNumero
Method IgualA(oOutro) Class Cnpj ; Return ::cNumero == oOutro:Valor()
```

- **Sem setter.** Mudou? Cria outro (`oNovo := Cnpj():New(cOutro)`). Imutabilidade = pode
  passar por qualquer camada sem medo.
- Candidatos naturais no Protheus: `Dinheiro` (valor+moeda, aritmética com arredondamento
  único — mata o bug de `Round` inconsistente), `Vigencia` (início+fim, `Contem(dData)`),
  `Percentual`, `CodigoProduto`.
- Depois que `Cnpj` existe, assinatura `Method Incluir(oCnpj)` **não compila com lixo** —
  a validação aconteceu no nascimento.

## Entidade — identidade acima de atributos

```tlpp
Class ContratoComercial
    Private Data cNumero    As Character   // ← identidade de NEGÓCIO
    Private Data oVigencia  As Object      // VO
    Private Data nPercentual As Numeric
    Public Method New(cNumero, oVigencia, nPercentual) Constructor
    Public Method EstaVigente(dData)
    Public Method Renovar(oNovaVigencia)   // comportamento, não setter
EndClass
```

- A identidade é do **negócio** (número do contrato), nunca `R_E_C_N_O_` (detalhe do banco,
  muda em reprocessamento/migração — fica confinado no repositório).
- Entidade anêmica (só get/set, regra toda fora) é o antipadrão que o livro mais ataca:
  o comportamento mora **junto** dos dados — `oContrato:EstaVigente(dDataBase)`, não
  `U_VldVig(oContrato:Venc)` espalhado em 5 fontes.

## Agregado — a fronteira de consistência

O cluster que precisa estar consistente **ao fim de uma transação**. A raiz é o único ponto
de entrada; os filhos não são alterados por fora.

```tlpp
namespace cliente.vendas

Class Pedido                                    // RAIZ do agregado
    Private Data cNumero  As Character
    Private Data cCliente As Character          // ← REFERÊNCIA POR ID a outro agregado
    Private Data aItens   As Array              // ItemPedido — só via métodos da raiz
    Public Method New(cNumero, cCliente) Constructor
    Public Method AdicionarItem(oCodProduto, nQtd, oPrecoUnit)
    Public Method Total()
    Public Method AplicarDesconto(nPercentual)
EndClass

Method AdicionarItem(oCodProduto, nQtd, oPrecoUnit) Class Pedido
    // INVARIANTE protegida na raiz — vale para tela, REST, job e importação:
    If nQtd <= 0
        UserException("Quantidade deve ser positiva")
    EndIf
    If ::Total():MaisQue(LimiteSemAprovacao()) // exemplo de invariante de agregado
        // ... regra de alçada
    EndIf
    aAdd(::aItens, ItemPedido():New(oCodProduto, nQtd, oPrecoUnit))
Return Self
```

As três regras de Vernon, traduzidas:
1. **Agregado pequeno**: Pedido+Itens (SC5+SC6) sim; Pedido+Cliente+Estoque+Financeiro NÃO —
   isso é o "God-aggregate" que trava tudo numa transação.
2. **Referência por identidade**: `::cCliente` é o código, não o objeto Cliente. Precisa de
   dados do cliente? O caso de uso busca no repositório de Cliente.
3. **1 transação = 1 agregado**: persistir Pedido = 1 `MSExecAuto(MATA410)` (que já é
   atômico e alinha com a invariante do ERP). Reagir no estoque/financeiro = **evento**,
   consistência eventual.

Mapeamento típico: agregado ↔ o que um ExecAuto grava junto. O padrão TOTVS já pensa assim
(aCab+aItens); o DDD dá o vocabulário para VOCÊ desenhar os seus.

## Repositório — um por agregado, interface primeiro

```tlpp
Interface IPedidoRepo
    Method BuscarPorNumero(cNumero)   // devolve o AGREGADO montado (raiz + itens)
    Method Incluir(oPedido)           // persiste o agregado INTEIRO (ExecAuto)
EndInterface
```

- Devolve/recebe **agregados completos**, não linhas de tabela.
- Nada de `AtualizarCampoX()` — quem muda estado é a raiz; o repositório persiste.
- Query de relatório/consulta em massa **não passa pelo agregado**: leitura otimizada
  separada (BeginSQL direto num DTO/JsonObject) é legítima — não hidrate 10 mil agregados
  para somar uma coluna.

## Serviço de domínio × serviço de aplicação (a confusão clássica)

```tlpp
// SERVIÇO DE DOMÍNIO — regra pura que envolve vários agregados. Sem SQL, sem transação.
Class PoliticaCredito
    Public Method Avaliar(oCliente, oPedido, oHistorico)   // → Aprovado/Bloqueado + motivo
EndClass

// SERVIÇO DE APLICAÇÃO — caso de uso: busca, chama a política, persiste, publica evento.
Class IncluirPedidoHandler
    Public Method New(oPedidoRepo, oClienteRepo, oEventos) Constructor
    Public Method Executar(oComando)
EndClass
```

Teste rápido: tem regra de negócio? domínio. Tem repositório/transação/evento? aplicação.
(É a mesma separação da `/protheus:clean-architecture` — caso de uso = serviço de aplicação.)

## Eventos de domínio — desacoplar contextos

Fato passado, nomeado na linguagem ubíqua: `PedidoFaturado`, `ContratoVencido`.

Implementação pragmática no Protheus (sem message broker):
- Tabela específica de eventos (`ZEV`: id, tipo, payload JSON, processado, tentativas) —
  o caso de uso grava o evento **na mesma transação** do agregado (outbox).
- Job/Schedule consome e despacha: chama o workflow Fluig, o endpoint do e-commerce, o
  contexto de estoque. Falhou? Reprocessa — sem derrubar o faturamento.
- O ganho: faturamento não conhece (nem espera por) e-commerce. Novo consumidor = zero
  mudança em quem publica.

## Tabela de decisão — modelagem tática mínima por cenário

| Cenário | Use | Não use |
|---|---|---|
| Cadastro CRUD com validações de campo | MVC padrão (`/protheus:mvc-generator`) + VOs se houver formato rico | Agregado/repositório (cerimônia) |
| Rotina com regra comercial rica (desconto, alçada, comissão) | VOs + entidade com comportamento + serviço de domínio | Lógica em PE gigante |
| Fluxo multi-tabela com invariante (pedido+itens, OP+componentes) | Agregado + repositório ExecAuto | `RecLock` solto por tabela |
| Integração com sistema externo | ACL + eventos (outbox) | JSON alheio circulando no domínio |
| Relatório/consulta pesada | Query direta → DTO (CQRS informal) | Hidratar agregados em loop |
