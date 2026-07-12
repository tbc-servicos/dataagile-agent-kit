# Refatoração guiada — do endpoint-monólito às camadas

Referência da skill `/protheus:clean-architecture`. Exemplo completo **antes/depois** do
antipadrão mais comum em REST TLPP: o endpoint que faz tudo. Use como gabarito de review
e como roteiro de refatoração incremental.

## ANTES — o monólito típico (~1 função, 4 responsabilidades)

```tlpp
// ❌ ANTIPADRÃO — não copiar. Parsing + SQL + regra + resposta na mesma função.
@Post("/api/v1/pedidos")
Function ZPostPed()
    Local oBody := JsonObject():New()
    Local cQuery, cAlias, nDesc, aCab := {}, aItens := {}
    Private lMsErroAuto := .F.

    oBody:FromJson(oRest:GetBodyRequest())

    // parsing + validação misturados
    If Empty(oBody["cliente"])
        SetRestFault(400, "cliente obrigatório") ; Return .F.
    EndIf

    // SQL inline no endpoint (e com concatenação de dialeto específico)
    cAlias := GetNextAlias()
    cQuery := "SELECT ZC1_PERC, ZC1_DTVENC FROM " + RetSqlName("ZC1") + ;
              " WHERE ZC1_CLIENTE = '" + oBody["cliente"] + "'"      // ← injeção + dialeto
    // ... DbUseArea ...

    // regra de negócio enterrada no meio
    If SToD((cAlias)->ZC1_DTVENC) >= dDataBase
        nDesc := Min((cAlias)->ZC1_PERC, 15)
    EndIf

    // escrita direto na tabela padrão, sem ExecAuto
    RecLock("SC5", .T.)                                              // ← pula validações
    // ... Replace ...
    MsUnlock()

    oRest:SetResponse('{"ok": true}')
Return .T.
```

Problemas (todos pegáveis em review): injeção de SQL e dialeto MSSQL-only; `RecLock` direto
em SC5 pulando MATA410; regra de desconto intestável (precisa de HTTP + banco para exercitar
um `Min()`); qualquer mudança em qualquer aspecto passa por esta função.

## DEPOIS — os 4 artefatos

A versão em camadas está detalhada em `regra-dependencia-camadas.md`; o resumo do mapeamento:

| Trecho do monólito | Vira | Artefato |
|---|---|---|
| parsing/`SetRestFault` | Adaptador | `@Post` enxuto (só traduz e delega) |
| validação + orquestração + transação | Caso de uso | `IncluirPedidoComDesconto` |
| `Min(perc, 15)` na vigência | Domínio (puro) | `DescontoContrato:Calcular()` |
| query ZC1 | Repositório de leitura | `ContratoRepoSQL` (BeginSQL com `%Exp:%`) |
| `RecLock` em SC5 | Repositório de escrita | `PedidoRepoExecAuto` (MSExecAuto MATA410) |

Ganhos concretos e verificáveis:
- `DescontoContrato` testado por unidade com 3 asserts, **sem banco** (feliz + teto + vencido).
- Trocar MSSQL→PostgreSQL não toca regra nem endpoint (só o repositório — que já usa
  `BeginSQL` com binds, então provavelmente nem ele).
- O PE `M410STTS`, um job noturno e o endpoint REST podem **reusar o mesmo caso de uso**.

## Roteiro de refatoração incremental (para código legado)

Não reescreva tudo. Ordem de extração com menor risco, um passo por PR:

1. **Extrair a regra pura primeiro** (maior valor, menor risco): ache o cálculo/decisão,
   mova para classe/função que recebe tudo por argumento. Escreva o teste unitário **antes**
   de mover (caracterização) e rode depois — mesmo resultado, verde.
2. **Extrair o repositório**: mova SQL/ExecAuto para uma classe. A função original vira
   orquestradora chamando os dois.
3. **Inverter a dependência** quando o segundo consumidor ou o teste com dublê aparecer:
   interface + injeção via construtor.
4. **Enxugar o adaptador** por último: endpoint/PE fica só com tradução.

Critério de parada: cada camada com um motivo de mudança; regra coberta por teste unitário.

## Checklist de review estrutural (usar no `/protheus:reviewer`)

- [ ] Nenhuma função com SQL + regra de negócio + formatação de saída juntas
- [ ] Endpoint/PE/ViewDef sem acesso direto a tabela (nem leitura via `Posicione` para regra)
- [ ] Escrita em tabela padrão só via ExecAuto (encapsulado em repositório)
- [ ] Regra de negócio testável sem banco (se não é, apontar o acoplamento)
- [ ] `BeginTran` apenas na camada de caso de uso
- [ ] SQL com binds (`%Exp:%`) e sem função de dialeto fora do `%...%` (ver `/protheus:query-builder`)
- [ ] Função > ~60 linhas ou > 3 níveis de aninhamento → sugerir extração (AVISO)
- [ ] Mesmo `Do Case` de tipo em 2+ lugares → sugerir polimorfismo/factory (AVISO)
