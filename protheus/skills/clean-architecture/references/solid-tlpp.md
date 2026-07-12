# SOLID em TLPP — os 5 princípios com exemplos ADVPL/TLPP

Referência da skill `/protheus:clean-architecture`. Cada princípio com o sintoma típico em
código Protheus e o refactor mínimo.

## S — Single Responsibility (um motivo para mudar)

**Sintoma:** a `User Function` de 400 linhas que valida, calcula, grava e imprime — mexer no
layout do e-mail arrisca quebrar o cálculo do imposto.

```tlpp
// ANTES: U_CALCFRETE valida cliente, monta SQL, calcula frete, grava ZF1 e envia e-mail
// DEPOIS: cada responsabilidade em um lugar
oFrete    := CalculoFrete():New()          // regra pura: só matemática de frete
oFreteRepo:= FreteRepo():New()             // só persistência ZF1
oNotifica := NotificaFrete():New()         // só e-mail/workflow
oCasoUso  := RegistrarFrete():New(oFreteRepo, oNotifica)  // orquestra
```

Heurística: descreva a função em uma frase sem usar "e". Se precisar de "e", divida.
Limite orientativo: ~60 linhas ou 3 níveis de aninhamento → candidata a extração.

## O — Open/Closed (aberto a extensão, fechado a modificação)

**Sintoma:** cada transportadora nova exige editar o mesmo `Do Case` em 5 funções diferentes.

```tlpp
// ANTES — toda transportadora nova = editar esta função (e as outras 4)
Do Case
    Case cTransp == "001" ; nFrete := nPeso * 1.2
    Case cTransp == "002" ; nFrete := nPeso * 0.9 + 50
    // ...
EndCase

// DEPOIS — transportadora nova = classe nova; quem calcula não muda
Interface ICalculaFrete
    Method Calcular(nPeso, nDistancia)
EndInterface

Class FreteTransportadoraA From ICalculaFrete
    Method Calcular(nPeso, nDistancia) ; Return nPeso * 1.2
EndClass

// resolução única (factory) — o único lugar que conhece os códigos
Static Function FreteFactory(cTransp)
Return Iif(cTransp == "001", FreteTransportadoraA():New(), FreteTransportadoraB():New())
```

Um `Do Case`/factory **num único lugar** é aceitável; o problema é o mesmo `Do Case`
duplicado em N pontos.

## L — Liskov Substitution (subclasse honra o contrato)

**Sintoma:** `Class FreteRetirada From ICalculaFrete` cujo `Calcular()` lança `UserException`
"não se aplica". Quem itera a lista de fretes agora precisa saber qual subclasse é — o
polimorfismo morreu.

Regra: se a subclasse não consegue cumprir o contrato da base (mesmos parâmetros aceitos,
mesmo tipo de retorno, sem novas exceções), ela **não deve herdar** — modele diferente
(retirada devolve frete `0`, ou a interface ganha `Aplicavel()` consultado antes).

## I — Interface Segregation (interfaces pequenas, por papel)

**Sintoma:** `IIntegracaoERP` com 14 métodos; a classe de consulta de estoque implementa 13
`UserException("não implementado")`.

```tlpp
// DEPOIS — cada consumidor depende só do que usa
Interface IConsultaEstoque
    Method SaldoDisponivel(cProduto, cLocal)
EndInterface

Interface IReservaEstoque
    Method Reservar(cProduto, cLocal, nQtd)
EndInterface
```

Uma classe pode implementar as duas (`From IConsultaEstoque, IReservaEstoque`) — o ganho é
que o caso de uso de consulta não enxerga (nem quebra com) os métodos de escrita.

## D — Dependency Inversion (dependa da abstração)

**Sintoma:** o caso de uso instancia `ContratoRepoSQL():New()` internamente — impossível
testar sem banco, impossível trocar a fonte de dados.

```tlpp
// ANTES — acoplamento concreto escondido
Method Executar() Class AprovarDesconto
    Local oRepo := ContratoRepoSQL():New()   // ← preso ao SQL para sempre

// DEPOIS — a dependência entra pelo construtor
Method New(oContratoRepo) Class AprovarDesconto
    ::oContratoRepo := oContratoRepo         // ← qualquer IContratoRepo serve
```

No teste unitário (ex.: PROBAT, do tlppCore), injeta-se um dublê:

```tlpp
Class ContratoRepoFake From IContratoRepo
    Data oResposta As Object
    Method BuscarVigente(cCliente, cLoja) ; Return ::oResposta
EndClass

@Test('desconto respeita teto de 15% mesmo com contrato de 20%')
Method TesteTeto() Class TestAprovarDesconto
    Local oFake := ContratoRepoFake():New()
    // ... oFake:oResposta com perc=20 → assertEquals(150, resultado de 1000)
```

Quem escolhe a implementação concreta é a **borda** (endpoint, PE, main function) — o
"composition root". Camadas internas só conhecem interfaces.

## Anti-checklist (o que NÃO fazer em nome do SOLID)

- Interface com **uma única implementação e sem teste que injete dublê** = cerimônia inútil.
  Crie a interface quando o segundo consumidor/implementação (ou o teste) aparecer.
- Quebrar uma função coesa de 30 linhas em 6 micro-funções de 5 = piora a leitura.
- Herança para reuso de código (herde por contrato, componha por reuso).
- Aplicar tudo isso num PE de 15 linhas — ver a tabela "Quando aplicar" no SKILL.md.
