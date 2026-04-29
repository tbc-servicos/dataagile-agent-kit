---
name: mit044
description: Gera documento MIT044 (Especificação de Personalização) em DOCX via brainstorm colaborativo com o dev. Analisa requisitos do cliente, faz perguntas para clarificar escopo, propõe processo atual vs proposto, e gera documento com linguagem híbrida (negócio + artefatos técnicos). Salva no Google Drive. Use /mit-docs:mit044
---

# MIT044 — Especificação da Customização

Gera o documento MIT044 em formato DOCX, seguindo o modelo padrão TOTVS/TBC 2025V1.
O MIT044 documenta **o que será desenvolvido** — é o contrato entre TBC e cliente.

<HARD-GATE>
Não gere o DOCX antes de completar o brainstorm e obter aprovação do dev sobre o conteúdo.
O documento só é gerado após consenso sobre todas as seções.
</HARD-GATE>

## Passo 0 — Carregar templates e regras do MCP

Antes de qualquer interação, consultar a base de conhecimento:

```
searchKnowledge({ skill: "mit-docs", keyword: "mit044 template" })
searchKnowledge({ skill: "mit-docs", keyword: "mit044 formatacao" })
searchKnowledge({ skill: "mit-docs", keyword: "mit044 regras conteudo" })
searchKnowledge({ skill: "mit-docs", keyword: "mit044 brainstorm" })
searchKnowledge({ skill: "mit-docs", keyword: "mit044 checklist" })
searchKnowledge({ skill: "mit-docs", keyword: "mit044 erros" })
```

Os templates, regras de formatação, checklist e erros comuns vivem no MCP — **não hardcoded**.

## Público-alvo do documento

O MIT044 tem **dois leitores** e deve ser escrito em **camadas**:

### Camada 1 — Negócio (cliente lê)
- **Processo Atual + Processo Proposto**: linguagem 100% acessível
- SEM jargão técnico: sem aliases (SF1, SD1), sem nomes de variáveis, sem sintaxe de código
- Descrever O QUE será feito e POR QUE, com fluxo passo a passo
- Protótipos de tela (imagens)
- Premissas e restrições em linguagem de negócio

### Camada 2 — Técnica (dev lê)
- **Parametrizações + Execução + Customizações**: começar com descrição funcional, depois detalhar
- Tabelas de campos com alias Protheus, sintaxe ExecAuto, links TDN
- Layouts de arquivo com campo correspondente no ERP
- Referências de fontes existentes na base TBC
- O cliente pode pular; o dev mergulha

### Regra de linguagem
- Corpo do texto: linguagem de **negócio** — sem jargão
- Seções técnicas: **artefatos técnicos** acompanhados de descrição funcional
- Nunca mostrar código-fonte no MIT044

## Fase 1 — Busca automática (ANTES de perguntar ao dev)

### 1.1 Buscar no Jira
Localizar o epic e tickets filhos:
- Epic FSWTBC-XXXX → summary, assignee (coordenador), custom fields
- Ticket SD FSWTBCSD-XXX → reporter, custom fields (código cliente, código projeto PSA)
- Tickets filhos → horas por fase (Documentação, Desenvolvimento, QA, Entrega, Garantia)

**REGRA:** Código de cliente e Código do projeto PSA são custom fields do Jira — NÃO inventar. Se não encontrar, PERGUNTAR ao dev.

### 1.2 Buscar no Google Drive
- Pasta Arquiteturas_FSW/SV-XXXX → planilha de estimativa + levantamento de requisitos
- Pasta do cliente → proposta comercial, contrato
- Pasta MIT/MIT044 → modelo 2025V1

### 1.3 Buscar na base de conhecimento Protheus
```
searchFunction({ name: "<rotina>" })
findExecAuto({ target: "<rotina>" })
searchByTable({ table: "<alias>" })
searchKnowledge({ keyword: "<funcionalidade>" })
```

### 1.4 Ler documentos do dev
Se o dev informar documentos (email, ata, requisitos, PDF, planilha):
1. Ler TODOS antes de fazer perguntas
2. Extrair: funcionalidade, regras de negócio, processos impactados
3. Apresentar resumo do que foi extraído
4. Identificar lacunas e ambiguidades

## Fase 2 — Brainstorm de escopo

Objetivo: preencher o que NÃO foi encontrado automaticamente. Fazer **uma pergunta por vez**, usando múltipla escolha quando possível.

### Dados do cabeçalho (se não veio do Jira)
1. Código do cliente? (ex: TFDFGB00)
2. Código do projeto PSA? (ex: D000079710001)
3. Proposta comercial? (ex: AAQCCA - Banco de Horas)
4. Gerente/Coordenador do cliente?

### Escopo funcional (se documentos não cobrem)
5. Qual o problema/dor do cliente hoje? (processo atual)
6. O que o cliente espera como resultado? (processo proposto)
7. Quais rotinas/telas são impactadas?
8. Existem integrações com outros sistemas?
9. Existem regras de negócio específicas?

### Decisões técnicas (confirmar com dev)
10. Abordagem técnica correta? (ExecAuto, MVC, Wizard, API, etc.)
11. Rotina de saída: MATA467N (NF Manual avulsa) ou MATA460 (pedido)?
12. Campos e parâmetros completos?
13. Restrições adicionais?

### Estimativa e aprovação
14. Horas estimadas? (buscar planilha Arquiteturas_FSW)
15. Criticidade? Alto / Médio / Baixo impacto
16. Quem aprova pelo cliente?
17. Quem aprova pela TOTVS? (geralmente coordenador FSW do epic)

### Enriquecimento via MCP
Durante o brainstorm, consultar conhecimento técnico:
```
# Se Protheus
searchFunction({ name: "<rotina>", limit: 5 })
findExecAuto({ target: "<rotina>" })
searchByTable({ table: "<alias>" })

# Se Fluig
searchFluigApi({ keyword: "<funcionalidade>" })
searchFluigPatterns({ keyword: "<padrão>" })

# Geral
searchKnowledge({ keyword: "<funcionalidade>" })
searchDocuments({ keyword: "<módulo>" })
```

A cada 3-4 respostas, **apresentar resumo parcial**.

## Fase 3 — Revisão do conteúdo

Apresentar conteúdo completo em Markdown para revisão antes de gerar DOCX.
Verificar contra o checklist:
```
searchKnowledge({ skill: "mit-docs", keyword: "mit044 checklist" })
```

**REGRA:** Só prosseguir para geração após aprovação explícita do dev.

## Fase 4 — Geração do DOCX via OOXML

**REGRA CRÍTICA:** NUNCA gerar do zero com docx-js. SEMPRE usar o modelo oficial via OOXML.

### Processo:
1. **Modelo:** Copiar `MIT044 - Especificação da Customização - MODELO 2025V1` do Drive
2. **Exportar:** Dev baixa como DOCX (ou buscar na pasta do projeto)
3. **Descompactar:** `python3 ooxml/scripts/unpack.py modelo.docx /tmp/mit044_edit`
4. **Editar XML:** Substituir campos da Ambientação + conteúdo do body
5. **Acentuação:** Usar entities HTML (&#225;=á, &#227;=ã, &#231;=ç, &#233;=é, &#237;=í, &#243;=ó, &#245;=õ)
6. **Espaçamento:** Adicionar w:spacing (before=120 after=120 line=276) nos parágrafos
7. **Recompactar:** `python3 ooxml/scripts/pack.py /tmp/mit044_edit "MIT044 - DEM - Titulo.docx"`
8. **Subir no Drive:** Pasta MIT/MIT044 do projeto

### Estrutura do documento (modelo 2025V1):
```
Página 1: Ambientação (tabela 2 cols) + Dados da Customização + Legenda
Página 2: Sumário
  a. Processo Atual
  b. Processo Proposto
    01. Parametrizações
    02. Execução
    03. Customizações
  Aceite
Página 3+: Especificação da Customização
  Processo Atual (CAMADA 1 - negócio)
  Processo Proposto (CAMADA 1 - negócio)
  Parametrizações (CAMADA 2 - técnica)
  Execução (CAMADA 2 - técnica)
  Customizações (CAMADA 2 - técnica)
Última página: Aceite + tabela Aprovado por / Assinatura / Data
```

### Estilos (modelo 2025V1):
- Default: Tahoma 11pt, cor #363636
- Heading 1: Verdana 16pt bold, cor #00C9EB (ciano)
- Heading 2: Verdana 14pt bold, cor #434343
- Heading 3: Verdana 14pt bold, cor #434343
- Tabelas: header #D9D9D9, alternância #F2F2F2, bordas #000000
- Margens: top/bottom 2.5cm, left 3cm, right 2cm
- Checkboxes: ☐ (U+2610) / ☒ (U+2612) — nunca [x]

## Fase 5 — Salvar e próximos passos

### Salvar no Google Drive
Nome: `MIT044 - {FSWTBC-XXXX} - {Título}.docx`
Pasta: `{Cliente} > {Contrato} > MIT > MIT044`

### Atualizar Jira
- Epic: preencher campo Drive - MIT044 com link
- Tickets filhos: atualizar descrição e horas estimadas

### Próximos passos
Informar ao dev:
- Protheus: `/protheus:specialist` ou `/protheus:writer` para codificar
- Fluig: `/fluig:widget`, `/fluig:dataset`, `/fluig:workflow`
- Assinatura eletrônica: `/tae:totvssign`
- MIT010: será gerada após desenvolvimento (`/mit-docs:mit010`)

### Persistir no MCP
Oferecer salvar resumo na base:
```
kb_insert({
  type: "document",
  title: "MIT044 {DEM} {titulo}",
  content: "<resumo estruturado>",
  platform: "protheus"
})
```

## Regras

- **NUNCA** gerar DOCX sem brainstorm prévio
- **NUNCA** gerar do zero com docx-js — SEMPRE copiar modelo e editar OOXML
- **NUNCA** incluir código-fonte (ADVPL, JavaScript, SQL)
- **NUNCA** inventar códigos de cliente/projeto — buscar no Jira ou perguntar
- **SEMPRE** buscar no Jira/Drive/MCP ANTES de perguntar ao dev
- **SEMPRE** consultar base Protheus para fontes reutilizáveis
- **SEMPRE** linguagem de negócio na Camada 1, técnica na Camada 2
- **SEMPRE** acentuação correta (português formal)
- **SEMPRE** espaçamento entre parágrafos (não pode ficar colado)
- **SEMPRE** incluir Aceite com tabela de aprovação
- Datas DD/MM/YYYY, valores formato brasileiro (1.234,56)
- Checkboxes: ☐ (vazio) / ☒ (marcado)
