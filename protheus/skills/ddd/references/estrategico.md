# DDD estratégico no Protheus — linguagem ubíqua, contextos e integrações

Referência da skill `/protheus:ddd`. A parte estratégica decide **antes do código** e é a
de maior retorno — dá para aplicar até em projeto que nunca verá uma classe TLPP.

## Linguagem ubíqua — como construir e manter

No brainstorm/levantamento, monte a tabela do glossário junto com o key-user:

| Termo do negócio (como o cliente fala) | Significado acordado | Materialização técnica |
|---|---|---|
| Contrato comercial | Acordo de % de desconto com vigência, por cliente+loja | ZC1 (tabela específica) |
| Percentual negociado | % do contrato, limitado pela alçada | ZC1_PERC |
| Pedido bloqueado por crédito | Pedido aguardando liberação do financeiro | SC5 com C5_LIBEROK vazio... |

Regras de uso:
- O glossário vive na **especificação do desenvolvimento** e é revisado quando um termo novo aparece em reunião.
- **Uma palavra, um significado por contexto.** Se "liberação" significa coisa diferente para
  o financeiro e para a expedição, são dois termos (ou dois contextos — ver abaixo).
- Código, teste e mensagem de erro usam o termo do glossário:
  `Class ContratoComercial` / `@Test('contrato vencido não concede percentual negociado')` /
  `"Contrato comercial vencido em 12/05"` — o key-user valida o teste lendo a descrição.
- Antipadrão: conversar com o cliente em "ZC1_PERC" ou nomear classe de `ZGeraDesc2New`.
  O custo é real: cada tradução mental entre "língua do dev" e "língua do cliente" é onde
  o requisito se perde.

## Bounded Contexts — critérios de corte

Perguntas que revelam a fronteira (na ordem):
1. **O mesmo termo muda de significado?** ("Produto" de Vendas ≠ "Produto" de Estoque) → contextos diferentes.
2. **Times/key-users diferentes respondem por cada parte?** → provável fronteira.
3. **Os processos mudam por motivos diferentes?** (política comercial muda todo trimestre;
   regra fiscal muda por lei) → separar protege um do outro.

Materialização no Protheus:

```
fontes/
├── vendas/          namespace cliente.vendas       ← contexto Vendas
│   ├── dominio/     ContratoComercial, PoliticaDesconto (regra pura)
│   ├── aplicacao/   AprovarDesconto, IncluirPedido (casos de uso)
│   └── infra/       ContratoRepoSQL, PedidoRepoExecAuto
├── logistica/       namespace cliente.logistica    ← contexto Logística
└── compartilhado/   Cnpj, Dinheiro, Vigencia (shared kernel — MÍNIMO e estável)
```

- O `compartilhado/` (shared kernel) é tentador e perigoso: só entra o que é **realmente**
  idêntico e estável entre contextos (value objects primitivos do negócio). Regra do livro:
  shared kernel pequeno e com dono definido; na dúvida, duplique o conceito em cada contexto
  (duplicação entre contextos é mais barata que acoplamento entre contextos).
- O ERP padrão TOTVS é, ele próprio, um conjunto de contextos (módulos). Sua customização
  é **sempre downstream** do padrão: a TOTVS muda o MATA410 quando quiser — proteja-se
  com ACL (abaixo).

## Context Mapping — padrões de integração e quando usar

| Padrão | Situação | Exemplo Protheus |
|---|---|---|
| **Conformista** | Você aceita o modelo do upstream como é | Customização pequena que usa aCab/aItens do ExecAuto direto — ok para coisa trivial |
| **ACL (Anticorruption Layer)** | O modelo do upstream contaminaria o seu; você traduz na borda | Classe `PedidoEcommerceTradutor` que converte o JSON da loja no SEU `Pedido`; wrapper que converte seu agregado em aCab/aItens do MATA410 |
| **Cliente-Fornecedor** | Downstream negocia necessidades com upstream | Sua API REST consumida pelo Fluig: o workflow pede campos, vocês versionam o contrato |
| **Serviço de Host Aberto / Linguagem Publicada** | Você é upstream de muitos | Endpoint TLPP com contrato estável e documentado (padrão TTALK) — mudanças só aditivas |
| **Caminhos separados** | Integrar custa mais que duplicar | Relatório local que re-deriva um dado em vez de integrar com sistema moribundo |

### ACL na prática (o padrão que mais se usa)

Duas direções, mesma ideia — o modelo alheio para na borda:

```tlpp
// ENTRADA: JSON do e-commerce → SEU modelo (nenhum campo da loja circula cru)
Class PedidoEcommerceTradutor
    Public Method Traduzir(oJsonLoja)   // valida, converte, devolve Pedido (seu agregado)
EndClass

// SAÍDA: SEU agregado → arrays do ExecAuto (o formato MATA410 fica confinado aqui)
Class PedidoRepoExecAuto From IPedidoRepo
    Public Method Incluir(oPedido)      // monta aCab/aItens a partir do agregado e executa
EndClass
```

Quando a TOTVS mudar um campo do MATA410 (release nova), **um arquivo** muda. Quando o
e-commerce v2 trocar o JSON, **um arquivo** muda. Esse é o teste de que a ACL funciona.

### Sinais de context map ruim (para o reviewer)

- JSON de terceiro parseado em 4 fontes diferentes → falta ACL única.
- `If cModulo == "FAT"` dentro de regra compartilhada → dois contextos disfarçados de um.
- Tabela específica lida/escrita por fontes de dois contextos sem contrato → acoplamento
  por banco (o pior: invisível).
- Integração síncrona onde o negócio aceita eventual (job/evento resolveria sem acoplar
  disponibilidade dos dois lados).
