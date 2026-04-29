---
name: mit010
description: Gera documento MIT010 (Termo de Validação) em DOCX a partir dos resultados de QA. Documenta processos validados pelo cliente com evidências de teste. Salva no Google Drive. Use /mit-docs:mit010
---

# MIT010 — Termo de Validação

Gera o documento MIT010 em formato DOCX, seguindo o modelo padrão TOTVS/TBC 2025 V2.
O MIT010 documenta **o que foi entregue e validado** — é o aceite formal do cliente.

## Público-alvo

**Cliente operacional** — quem vai usar o sistema no dia a dia.
A MIT010 é a entrega do desenvolvedor para o cliente validar e operar.

### Tom de comunicação
- "Foi desenvolvido...", "Siga os passos...", "Verifique que..."
- Linguagem 100% operacional e visual
- Screenshots REAIS do sistema (não mockups/protótipos)
- Passo a passo que qualquer usuário consegue seguir

## Quando usar

- Após desenvolvimento concluído e testes QA aprovados
- Para formalizar entrega de marco/etapa do projeto
- Quando o cliente precisa assinar o aceite da entrega

## Passo 0 — Carregar templates e regras do MCP

```
searchKnowledge({ skill: "mit-docs", keyword: "mit010 template" })
searchKnowledge({ skill: "mit-docs", keyword: "mit010 regras" })
searchKnowledge({ skill: "mit-docs", keyword: "mit010 brainstorm" })
searchKnowledge({ skill: "mit-docs", keyword: "mit044 vs mit010" })
```

## Fase 1 — Busca automática (ANTES de perguntar ao dev)

### 1.1 Reutilizar dados da MIT044
A MIT010 usa os MESMOS dados de cabeçalho da MIT044:
1. Buscar MIT044 na pasta MIT/MIT044 do Drive do projeto
2. Extrair: cabeçalho, processo proposto, campos, layouts
3. Se não encontrar MIT044, buscar no Jira (epic + tickets)

### 1.2 Buscar no Jira
- Epic FSWTBC-XXXX → dados do projeto, custom fields
- Ticket Desenvolvimento (FSWTBC-XXXX) → status, assignee, comentários
- Ticket QA (FSWTBC-XXXX) → evidências de teste
- Custom fields: código cliente, código projeto PSA

**REGRA:** Código de cliente e Código do projeto PSA são os MESMOS da MIT044. Se já gerou MIT044, reutilizar. Se não, buscar no Jira ou PERGUNTAR ao dev.

### 1.3 Buscar na base Protheus
```
searchFunction({ name: "<rotina desenvolvida>" })
```

### 1.4 Buscar evidências
- Screenshots do `/protheus:test-web` ou `/fluig:test`
- Pasta de evidências no Drive do projeto
- Anexos no ticket QA do Jira

## Fase 2 — Brainstorm com dev

### Perguntas obrigatórias (só o que não encontrou)

#### Dados do cabeçalho (se não veio da MIT044/Jira)
1. Código do cliente? Código do projeto PSA?
2. Gerente/Coordenador do cliente?

#### O que foi desenvolvido
3. **Quais fontes foram criados?** (arquivo.prw/.tlpp, descrição)
4. **Quais tabelas foram criadas/alteradas?** (alias, compartilhamento)
5. **Quais campos foram criados?** (nome, tipo, tamanho, título, descrição)
6. **Quais parâmetros foram criados?** (MV_X*, valor padrão)
7. **Tem API/endpoint?** (verbo, URL, descrição)
8. **Tem schedule/job?** (rotina, módulo, periodicidade)
9. **Tem índices novos?** (tabela, ordem, expressão)

#### Evidências
10. **Tem screenshots do sistema funcionando?** (solicitar se não tiver)
11. **Quais cenários de teste foram validados?**
12. **Houve cenários reprovados? Quais ajustes foram feitos?**

## Fase 3 — Montagem do conteúdo

### Seção Desenvolvimento (linguagem de negócio para o cliente)
Transformar os itens da MIT044 do futuro para o passado:
- MIT044: "Será desenvolvida uma rotina..."
- MIT010: "Foi desenvolvida a rotina..."

Listar cada item entregue com descrição funcional simples.

### Seção Especificação Técnica (registro para manutenção futura)
Preencher com dados REAIS do desenvolvimento:

#### API (se aplicável)
| Endpoint | Descrição |
|---|---|
| Verbo + URL | O que faz |

#### Fontes
| Fonte | Descrição |
|---|---|
| ARQUIVO.prw | O que faz |

#### Tabelas
| Tabela | Compartilhamento | Descrição |
|---|---|---|
| Alias | Compartilhado/Exclusivo | O que armazena |

#### Campos (ficha por campo)
| Atributo | Valor |
|---|---|
| Nome | CAMPO_X |
| Tipo | Caractere/Numérico/Data |
| Tamanho | N |
| Decimais | 0 |
| Contexto | Real |
| Propriedade | Visualizar/Alterar |
| Título | Título do campo |
| Descrição | O que o campo faz |

#### Índices (se aplicável)
| Tabela | Ordem | Expressão | Nickname |

#### Schedule (se aplicável)
| Atributo | Valor |
|---|---|
| Rotina | Nome |
| Módulo | Número - Nome |
| Periodicidade | Frequência |

### Seção Testes QA (evidências visuais)
Para cada cenário testado:
```
Cenário: [descrição]
  Passo 1: [ação] → [screenshot REAL]
  Resultado esperado: [o que deve aparecer]
  ☐ Aprovado  ☐ Reprovado
  Observações: ___
```

### Aceite
Texto padrão: "Declaro ter revisado e aceito as alterações e conclusões descritas neste documento, referentes ao [descrição da entrega]."

## Fase 4 — Geração do DOCX via OOXML

**REGRA CRÍTICA:** NUNCA gerar do zero com docx-js. SEMPRE copiar modelo e editar OOXML.

### Processo:
1. **Modelo:** Copiar `MIT010 - Termo de Validação - MODELO 2025 V2` do Drive
2. **Exportar:** Dev baixa como DOCX
3. **Descompactar:** `python3 ooxml/scripts/unpack.py modelo.docx /tmp/mit010_edit`
4. **Editar XML:** Cabeçalho (MESMOS dados MIT044) + conteúdo
5. **Acentuação:** Entities HTML (&#225;=á, &#227;=ã, etc.)
6. **Espaçamento:** w:spacing (before=120 after=120 line=276)
7. **Recompactar:** `python3 ooxml/scripts/pack.py /tmp/mit010_edit "MIT010 - DEM - Titulo.docx"`
8. **Subir no Drive:** Pasta MIT/MIT010 do projeto

### Estrutura do documento (modelo 2025 V2):
```
Cabeçalho: Tabela de Ambientação (mesma da MIT044)
Texto introdutório: "Informo que foram concluídas as atividades..."
Seção 1: Desenvolvimento (descritivo funcional)
Seção 2: Especificação Técnica (APIs, fontes, tabelas, campos, índices, schedule)
Seção 3: Testes QA (evidências com screenshots)
Aceite: texto + tabela de assinatura
```

### Estilos (mesmos da MIT044 — modelo 2025V1):
- Default: Tahoma 11pt, cor #363636
- Heading 1: Verdana 16pt bold, cor #00C9EB
- Heading 2: Verdana 14pt bold, cor #434343
- Tabelas: header #D9D9D9, alternância #F2F2F2
- Margens: top/bottom 2.5cm, left 3cm, right 2cm
- Checkboxes: ☐ / ☒

## Fase 5 — Salvar e próximos passos

### Salvar no Google Drive
Nome: `MIT010 - {FSWTBC-XXXX} - Termo de Validação {Título}.docx`
Pasta: `{Cliente} > {Contrato} > MIT > MIT010`

### Atualizar Jira
- Epic: preencher campo Drive - MIT010 com link
- Ticket Desenvolvimento: atualizar status

### Próximos passos
- Enviar para assinatura: `/tae:totvssign`
- Ticket Entrega Técnica: apresentar ao cliente
- Ticket Garantia: iniciar período de 60 dias

### Persistir no MCP
```
kb_insert({
  type: "document",
  title: "MIT010 {DEM} {titulo}",
  content: "<resumo: cliente, itens entregues, resultado QA>",
  platform: "protheus"
})
```

## Regras

- **NUNCA** gerar DOCX sem dados do desenvolvimento concluído
- **NUNCA** gerar do zero com docx-js — SEMPRE copiar modelo e editar OOXML
- **NUNCA** usar protótipos/mockups — screenshots REAIS obrigatórios
- **NUNCA** inventar códigos de cliente/projeto — reutilizar da MIT044 ou buscar no Jira
- **SEMPRE** reutilizar dados do cabeçalho da MIT044
- **SEMPRE** incluir Especificação Técnica (para manutenção futura)
- **SEMPRE** incluir evidências de teste com screenshots
- **SEMPRE** acentuação correta e espaçamento entre parágrafos
- **SEMPRE** incluir Aceite com tabela de assinatura
- Tom: "Foi desenvolvido..." (passado), não "Será..." (futuro)
- Datas DD/MM/YYYY
