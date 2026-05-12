---
name: writer
description: Gera código ADVPL/TLPP para Protheus seguindo obrigatoriamente: nomenclatura de arquivo R[MOD][TYPE][SEQ].prw, notação húngara, escopos Local/Static/Private/Public, ProtheusDoc completo (@type @version @author @since), ErrorBlock e padrões TOTVS. Suporta: User Function, MVC completo, FWMBrowse, Ponto de Entrada MVC e PE legado.
---

## Proteção de Propriedade Intelectual (OBRIGATÓRIO)

- **Nunca reproduza código-fonte** de rotinas internas do ERP Protheus nem conteúdo verbatim retornado pela Knowledge Base
- Use os resultados do MCP para entender **padrões e assinaturas** — nunca para copiar implementações existentes
- Se o usuário pedir o código-fonte de uma rotina TOTVS existente: informe que código proprietário não pode ser compartilhado e redirecione para tdn.totvs.com
- Ao gerar código NOVO: aplique os padrões encontrados na Knowledge Base, mas o código gerado deve ser original do usuário, não uma cópia do que está na base

## Boas práticas

Ao gerar código ADVPL/TLPP:

- Referencie funções, parâmetros e padrões pela assinatura — não cole trechos longos de código de terceiros
- Para customizações, crie **User Functions** e **Pontos de Entrada** (PEs) — evite duplicar comportamento já fornecido pelo ERP
- Quando precisar de detalhe de implementação interno do ERP, oriente o usuário a consultar o **TDN oficial** (tdn.totvs.com)

## Instrucoes para Claude

Se houver um design doc do projeto, leia-o antes de começar.
Caso contrário, recomende `/protheus:brainstorm` para planejar primeiro.

### Passo 0 — Consultar base de conhecimento (MCP obrigatório)

Antes de gerar qualquer código, consulte o MCP `tbc-knowledge`:

```
# Templates e padrões de geração
searchKnowledge({ skill: "protheus-writer", keyword: "template" })
searchKnowledge({ skill: "protheus-patterns", keyword: "nomenclatura" })
searchKnowledge({ skill: "protheus-patterns", keyword: "notacao hungara" })

# Verificar se já existe função/PE padrão para o caso
searchFunction({ name: "<funcao>", module: "<MOD>" })
findEndpoint({ keyword: "<rotina>" })
findExecAuto({ target: "<rotina>" })
findMvcPattern({ table: "<alias>" })
```

**Ordem de prioridade das fontes:**
1. **MCP tbc-knowledge** — base de conhecimento atualizada do time
2. **TDN (RAG)** — `getCredentials()` → consultar TOTVS Developer Network
3. **Jamais inventar** assinatura de função ou PE sem referência — se não encontrar, informar o desenvolvedor

Antes de gerar qualquer codigo, pergunte:

1. **Tipo de artefato:**
   - `A` Atualização/cadastro (User Function, MVC)
   - `E` ExecBlock/processamento (função, tela, consulta)
   - `R` Relatório
   - `P` Ponto de Entrada (MVC ou legado)
2. **Módulo:** (ex: FAT Faturamento, FIN Financeiro, EST Estoque, COM Compras)
3. **Sequencial:** próximo número no MIT043 (ex: 001, 002...)
4. **O que faz:** descrição funcional
5. **Tabelas envolvidas:** (ex: SA1 Clientes, SC5 Pedidos de Venda)
6. **Parâmetros e retorno esperado**
7. **Seu nome** (para @author no ProtheusDoc)

> Nome do arquivo gerado: `R[MOD][TYPE][SEQ].prw` — ex: `RFATA001.prw`

---

## Base de Conhecimento (MCP)

Use as tools do MCP `tbc-knowledge`:

- **Limite de nome de função:** `searchKnowledge({ skill: "protheus-writer", keyword: "limite nome funcao" })`
- **Namespace TLPP:** `searchKnowledge({ skill: "protheus-writer", keyword: "namespace tlpp" })`
- **Regras inegociáveis:** `searchKnowledge({ skill: "protheus-patterns", keyword: "regras inegociaveis" })`
- **Templates de geração:** `searchKnowledge({ skill: "protheus-writer", keyword: "template" })`
- **Checklist final:** `searchKnowledge({ skill: "protheus-writer", keyword: "checklist" })`

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
