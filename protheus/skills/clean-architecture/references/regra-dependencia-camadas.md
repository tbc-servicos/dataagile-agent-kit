# Regra de Dependência e camadas — esqueleto ADVPL/TLPP

Referência de implementação da skill `/protheus:clean-architecture`. Mostra **como cada
camada é escrita** em TLPP e como as dependências ficam apontando para dentro.

## O princípio em uma frase

> Nada numa camada interna pode citar (usar, incluir, conhecer o nome de) algo de uma camada
> externa. Regra de negócio não sabe que existe REST, tela, SX3 ou o banco homologado.

Consequência prática no Protheus: quem muda com o cliente (regra) fica protegido de quem muda
com a TOTVS (framework, release, banco homologado).

## Camada 1 — Domínio (regra de negócio pura)

Classe TLPP (ou Static Function) que **calcula e decide**. Não lê banco, não lê parâmetro,
não mostra mensagem. Tudo que precisa **entra por argumento**; a resposta **sai no retorno**.

```tlpp
namespace cliente.faturamento

Class DescontoContrato
    Public Method New() Constructor
    Public Method Calcular(nValorPedido, nPercContrato, dVencContrato, dEmissao)
EndClass

Method New() Class DescontoContrato
Return Self

// Regra: desconto do contrato só vale dentro da vigência e é limitado a 15%
Method Calcular(nValorPedido, nPercContrato, dVencContrato, dEmissao) Class DescontoContrato
    Local nPercAplicado := 0

    If dEmissao <= dVencContrato
        nPercAplicado := Min(nPercContrato, 15)
    EndIf
Return Round(nValorPedido * (nPercAplicado / 100), 2)
```

Por que assim:
- **Testável por unidade sem banco**: `oDesc:Calcular(1000, 20, dVenc, dEmis)` → assert no valor.
- A data de emissão e o percentual vêm de fora — a regra não sabe se vieram de SC5, de um JSON
  ou de um teste.
- Parâmetro de sistema? O caso de uso lê `SuperGetMV("XX_MAXDESC")` e **passa** o valor.
  A regra recebendo `15` hardcoded acima seria o próximo refactor: receber o teto por argumento.

## Camada 2 — Repositório (persistência isolada)

Todo SQL e toda escrita vivem aqui. O caso de uso conhece só a **interface** — Dependency
Inversion na prática, e o que permite dublê nos testes.

```tlpp
namespace cliente.faturamento

Interface IContratoRepo
    Method BuscarVigente(cCliente, cLoja)
EndInterface

Class ContratoRepoSQL From IContratoRepo
    Public Method New() Constructor
    Public Method BuscarVigente(cCliente, cLoja)
EndClass

Method New() Class ContratoRepoSQL
Return Self

// Devolve JsonObject com os dados do contrato — o chamador não sabe que veio de SQL
Method BuscarVigente(cCliente, cLoja) Class ContratoRepoSQL
    Local oContrato := Nil
    Local cAlias    := GetNextAlias()

    BeginSQL Alias cAlias
        SELECT ZC1_PERC, ZC1_DTVENC
          FROM %Table:ZC1% ZC1
         WHERE ZC1.ZC1_FILIAL  = %xFilial:ZC1%
           AND ZC1.ZC1_CLIENTE = %Exp:cCliente%
           AND ZC1.ZC1_LOJA    = %Exp:cLoja%
           AND ZC1.%NotDel%
    EndSQL

    If !(cAlias)->(Eof())
        oContrato := JsonObject():New()
        oContrato["perc"]  := (cAlias)->ZC1_PERC
        oContrato["venc"]  := SToD((cAlias)->ZC1_DTVENC)
    EndIf
    (cAlias)->(DbCloseArea())
Return oContrato
```

Escrita em **tabela padrão** TOTVS: o repositório encapsula o `ExecAuto` (nunca `RecLock`
direto — pula as validações do dicionário e da rotina):

```tlpp
Class PedidoRepoExecAuto From IPedidoRepo
    Public Method Incluir(oPedido)   // monta aCab/aItens e chama MSExecAuto MATA410
EndClass
```

## Camada 3 — Caso de uso (aplicação)

Uma classe por operação de negócio. Recebe as dependências no construtor (DIP), valida a
entrada, orquestra, controla a transação, devolve resultado estruturado.

```tlpp
namespace cliente.faturamento

Class IncluirPedidoComDesconto
    Data oContratoRepo As Object
    Data oPedidoRepo   As Object
    Public Method New(oContratoRepo, oPedidoRepo) Constructor
    Public Method Executar(oDadosPedido)
EndClass

Method New(oContratoRepo, oPedidoRepo) Class IncluirPedidoComDesconto
    ::oContratoRepo := oContratoRepo
    ::oPedidoRepo   := oPedidoRepo
Return Self

Method Executar(oDadosPedido) Class IncluirPedidoComDesconto
    Local oResult   := JsonObject():New()
    Local oContrato := Nil
    Local oDesconto := DescontoContrato():New()
    Local nDesconto := 0

    // 1. validação de entrada (guard clauses)
    If Empty(oDadosPedido["cliente"])
        oResult["ok"]   := .F.
        oResult["erro"] := "Cliente não informado"
        Return oResult
    EndIf

    // 2. busca dados (repositório) e aplica regra (domínio)
    oContrato := ::oContratoRepo:BuscarVigente(oDadosPedido["cliente"], oDadosPedido["loja"])
    If oContrato != Nil
        nDesconto := oDesconto:Calcular(oDadosPedido["total"], oContrato["perc"],;
                                        oContrato["venc"], dDataBase)
    EndIf

    // 3. persiste — transação é responsabilidade DESTA camada
    oDadosPedido["desconto"] := nDesconto
    oResult := ::oPedidoRepo:Incluir(oDadosPedido)
Return oResult
```

## Camada 4 — Adaptadores (REST, MVC, PE, job)

Só tradução. O endpoint abaixo **não tem** SQL, regra nem transação:

```tlpp
#include "tlpp-core.th"
namespace cliente.faturamento.api

@Post("/api/v1/pedidos")
Function IncluirPedido()
    Local oBody   := JsonObject():New()
    Local oCasoUso
    Local oResult

    oBody:FromJson(oRest:GetBodyRequest())

    // composição: aqui (e só aqui) as implementações concretas são escolhidas
    oCasoUso := IncluirPedidoComDesconto():New(ContratoRepoSQL():New(), PedidoRepoExecAuto():New())
    oResult  := oCasoUso:Executar(oBody)

    If oResult["ok"]
        oRest:SetResponse(oResult:ToJson())
    Else
        SetRestFault(400, oResult["erro"])
    EndIf
Return .T.
```

Ponto de Entrada segue o mesmo padrão que o plugin já exige: o PE chama o caso de uso e
retorna — a lógica nunca mora no PE.

## Sinais de violação (para o reviewer)

| Sinal | Violação | Correção |
|---|---|---|
| `BeginSQL` e cálculo de negócio na mesma função | mistura domínio × persistência | extrair repositório |
| Endpoint/PE com `RecLock`/`ExecAuto` inline | adaptador pulando o caso de uso | criar classe de caso de uso |
| Regra lendo `SuperGetMV`/`xFilial` internamente | domínio acoplado ao framework | receber por argumento |
| `BeginTran` dentro do repositório ou da regra | transação fora do caso de uso | subir para o caso de uso |
| `Do Case` sobre "tipo" repetido em N funções | falta de polimorfismo (OCP) | classe por variação |
| Teste da regra precisa de banco populado | domínio não é puro | inverter dependências |
