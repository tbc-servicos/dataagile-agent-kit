# Exemplo de modelagem DDD ponta a ponta — "Desconto por contrato comercial"

Referência da skill `/protheus:ddd`. Um caso realista, modelado do levantamento
ao esqueleto de código, para servir de gabarito no brainstorm.

## O pedido do cliente (como chega)

> "Quando o vendedor incluir o pedido, se o cliente tiver contrato vigente, aplica o
> desconto do contrato — mas tem teto pela alçada do vendedor, e acima disso bloqueia
> pra supervisão liberar. E o e-commerce também vai mandar pedido, tem que valer lá."

## Passo 1 — Linguagem ubíqua (15 min com o key-user)

| Termo | Significado acordado | Materialização |
|---|---|---|
| Contrato comercial | % de desconto negociado com cliente, com vigência | ZC1 (específica) |
| Alçada do vendedor | Teto de % que o vendedor aprova sozinho | ZC2 ou parâmetro por perfil |
| Pedido bloqueado para supervisão | Pedido gravado, aguardando liberação de desconto | SC5 + status próprio |
| Liberação de desconto | Ato do supervisor aprovar/reprovar o excedente | novo fluxo |

Descoberta que só a conversa revela: "bloqueado para supervisão" ≠ "bloqueado por crédito"
(financeiro). Dois conceitos, dois termos — evitou-se sobrecarregar C5_LIBEROK.

## Passo 2 — Contextos e mapa

- Contexto **Vendas** (dono do modelo): contrato, alçada, bloqueio de supervisão.
- Upstream: **ERP padrão** (MATA410 grava pedido) → ACL = repositório ExecAuto.
- Upstream: **E-commerce** (manda JSON próprio) → ACL = tradutor na borda.
- Downstream: **Fluig** (workflow de liberação) → consome evento `PedidoBloqueadoParaSupervisao`.

```
[E-commerce] --JSON--> (ACL tradutor) ┐
[Tela MATA410 / PE]  -----------------┼--> [Contexto VENDAS] --evento--> [Fluig workflow]
                                      │      dominio/aplicacao
                                      └--> (ACL ExecAuto) --> [ERP padrão]
```

## Passo 3 — Modelagem tática do contexto Vendas

**Invariante central** (a frase que define o agregado): *"Um pedido nunca fica gravado com
desconto acima da alçada sem estar bloqueado para supervisão."*

| Building block | Elemento | Responsabilidade |
|---|---|---|
| Value Object | `Percentual` | 0–100, aritmética segura |
| Value Object | `Vigencia` | início/fim, `Contem(dData)` |
| Entidade | `ContratoComercial` | `PercentualNegociado()`, `EstaVigente(dData)` |
| Agregado | `Pedido` (raiz) + itens | invariante do bloqueio ao aplicar desconto |
| Serviço de domínio | `PoliticaDesconto` | cruza contrato × alçada × pedido → decisão |
| Serviço de aplicação | `IncluirPedidoHandler` | orquestra, transaciona, publica evento |
| Repositórios | `IContratoRepo`, `IPedidoRepo` | ZC1 (SQL) e SC5/SC6 (ExecAuto) |
| Evento | `PedidoBloqueadoParaSupervisao` | outbox ZEV → job dispara Fluig |

Decisão de modelagem discutível (e documentada): alçada ficou **fora** do agregado Pedido —
é dado de outro agregado (Vendedor); a `PoliticaDesconto` recebe os dois. Alternativa de
colocar a alçada dentro do Pedido criaria acoplamento e transação cruzada.

## Passo 4 — A decisão em código (o coração, 100% testável sem banco)

```tlpp
namespace cliente.vendas

Class PoliticaDesconto
    Public Method New() Constructor
    Public Method Decidir(oContrato, oAlcadaVendedor, dEmissao)
EndClass

// → JsonObject { percAplicar, bloquearSupervisao, motivo }
Method Decidir(oContrato, oAlcadaVendedor, dEmissao) Class PoliticaDesconto
    Local oDecisao := JsonObject():New()
    Local nNegociado := 0

    oDecisao["percAplicar"]        := 0
    oDecisao["bloquearSupervisao"] := .F.

    If oContrato == Nil .Or. !oContrato:EstaVigente(dEmissao)
        oDecisao["motivo"] := "Sem contrato vigente"
        Return oDecisao
    EndIf

    nNegociado := oContrato:PercentualNegociado():Valor()
    oDecisao["percAplicar"] := nNegociado

    If nNegociado > oAlcadaVendedor:Teto():Valor()
        oDecisao["bloquearSupervisao"] := .T.
        oDecisao["motivo"] := "Negociado excede alçada — requer supervisão"
    EndIf
Return oDecisao
```

Testes unitários diretos da tabela de decisão (feliz, sem contrato, vencido, acima da alçada) —
quatro `@Test` sem nenhum fixture de banco. O key-user valida lendo as descrições.

## Passo 5 — O que NÃO foi modelado (pragmatismo registrado)

- Cadastro do contrato (ZC1): CRUD simples → MVC padrão via `/protheus:mvc-generator`.
  Nada de agregado para um cadastro.
- Consulta "pedidos bloqueados por supervisor" (tela do gestor): query direta → DTO,
  sem hidratar agregados.
- O evento usa outbox + Schedule (sem broker): suficiente para o volume; trocar o transporte
  depois não toca o domínio.

## Checklist do brainstorm DDD (copiar para a especificação)

- [ ] Glossário com ≥ os termos que aparecem no fluxo principal (validado pelo key-user)
- [ ] Contextos identificados + mapa (quem é upstream? onde tem ACL?)
- [ ] Por agregado: **a invariante escrita em uma frase** (se não há invariante, não é agregado)
- [ ] Referências entre agregados por identidade; 1 transação = 1 agregado
- [ ] Eventos nomeados no passado, na linguagem ubíqua
- [ ] Lista explícita do que fica FORA do modelo tático (CRUDs, consultas)
