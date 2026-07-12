# Lado plataforma — datasets, eventos de workflow e formulários em camadas

Referência da skill `/fluig:clean-architecture`. O server-side do Fluig (Rhino/JS) não tem
módulos nem DI — as camadas viram **disciplina de organização dentro do arquivo**: adaptador
fino em cima, regra pura no meio, acesso a dados isolado embaixo.

## O antipadrão nº 1: o god-dataset

```javascript
// ❌ ANTES — ds_aprovacao_pedidos.js: 300 linhas em uma função
function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    // ... 30 linhas parseando constraints ...
    // ... 60 linhas chamando REST do Protheus com URL hardcoded ...
    // ... 80 linhas de regra: calcula desconto, decide alçada, formata ...
    // ... 40 linhas montando colunas/linhas ...
    // try/catch gigante englobando tudo
}
```

Sintomas: impossível testar a regra sem plataforma; a URL do Protheus aparece em 5 datasets;
mudar a regra de alçada exige reler 300 linhas.

## DEPOIS — três seções no mesmo arquivo (Rhino não importa módulos)

```javascript
// ds_aprovacao_pedidos.js
// ============ 1. ADAPTADOR (entrada/saída da plataforma) ============
function defineStructure() {
    addColumn("numero"); addColumn("percentual"); addColumn("requerSupervisao");
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    try {
        log.info("ds_aprovacao_pedidos: inicio");
        var filtros   = extrairFiltros(constraints);          // adaptador
        var pedidos   = buscarPedidosProtheus(filtros);       // infra
        var alcada    = buscarAlcada(filtros.usuario);        // infra
        for (var i = 0; i < pedidos.length; i++) {
            var decisao = decidirDesconto(pedidos[i].percentual, alcada,
                                          pedidos[i].contratoVigente);   // REGRA PURA
            dataset.addRow([pedidos[i].numero, decisao.percentual, decisao.requerSupervisao]);
        }
    } catch (e) {
        log.error("ds_aprovacao_pedidos: " + e);
        dataset.addRow(["ERRO", 0, false]);   // erro estruturado, nunca catch vazio
    }
    return dataset;
}

// ============ 2. REGRA PURA (testável fora da plataforma) ============
function decidirDesconto(percentualNegociado, tetoAlcada, contratoVigente) {
    if (!contratoVigente) return { percentual: 0, requerSupervisao: false };
    return {
        percentual: percentualNegociado,
        requerSupervisao: percentualNegociado > tetoAlcada
    };
}

// ============ 3. INFRA (todo acesso externo confinado aqui) ============
function buscarPedidosProtheus(filtros) {
    // fluigAPI/DatasetFactory/REST — a URL/serviço aparece SÓ aqui
}
```

Ganhos: `decidirDesconto` é a **mesma função** do domínio do widget (TS) — uma fonte da
regra por lado, com a mesma tabela de decisão testada nos dois; a integração Protheus tem
um único ponto de mudança; o try/catch do adaptador loga e devolve erro estruturado.

## Eventos de workflow — evento é adaptador

```javascript
// ❌ regra inline no evento
function afterStateEntry(sequenceId) {
    if (hAPI.getCardValue("percentual") > 15) { /* ...40 linhas... */ }
}

// ✅ evento delega (mesma regra do PE no Protheus: lógica em função externa)
function afterStateEntry(sequenceId) {
    try {
        var decisao = decidirDesconto(
            parseFloat(hAPI.getCardValue("percentual")),
            buscarAlcada(getValue("WKUser")),
            hAPI.getCardValue("contratoVigente") === "sim"
        );
        if (decisao.requerSupervisao) {
            encaminharParaSupervisao(decisao);   // infra: setTaskUser/notificação
        }
    } catch (e) {
        log.error("wf_aprovacao.afterStateEntry: " + e);
        throw e;   // workflow DEVE falhar visivelmente, não seguir corrompido
    }
}
```

- `hAPI`/variáveis `WK*` só aparecem no evento (adaptador) — a regra recebe valores.
- Regra duplicada entre `validateForm` (client) e evento (server)? O client valida para
  **UX**; o server é a **autoridade**. A tabela de decisão é a mesma (documente no design).

## Formulários — events/ e Util/ com papel definido

| Arquivo | Camada | Pode | Não pode |
|---|---|---|---|
| `events/validateForm.js` | adaptador de validação | ler campos, chamar regra, montar mensagem | conter a regra inline se ela também vive no server |
| `events/enableFields.js`, `displayFields.js` | apresentação | mostrar/ocultar/habilitar | decisão de negócio (chame a função de regra) |
| `Util/UtilsHandler.js` | regra + helpers | funções puras nomeadas pela linguagem do negócio | acesso a dataset misturado com regra na mesma função |

## Checklist de review (plataforma)

- [ ] `createDataset`/evento com < ~40 linhas — o resto em funções nomeadas
- [ ] Regra de negócio em função pura (sem `hAPI`, `DatasetFactory`, `log`, `WK*`)
- [ ] Integração externa (REST/SQL) confinada em funções `buscar*`/`gravar*` — URL num só lugar
- [ ] try/catch loga com contexto (`nome_do_fonte: erro`) e devolve/propaga erro estruturado
- [ ] Nenhum catch vazio; workflow lança erro em falha (não segue silenciosamente)
- [ ] SQL dinâmico validado contra injection (regra do `/fluig:dataset`)
- [ ] Mesma regra client/server: tabela de decisão única documentada, server é autoridade
