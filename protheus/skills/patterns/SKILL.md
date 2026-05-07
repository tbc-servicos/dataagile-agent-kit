---
name: patterns
description: Referência de padrões ADVPL/TLPP para Protheus: nomenclatura de arquivos (R[MOD][TYPE][SEQ].prw), notação húngara, dicionário de dados (SZ?, prefixo X, TB_), Pontos de Entrada (MVC e legado), MVC, FWMBrowse, namespaces, estrutura de pastas e Code Analysis.
---

## Nomenclatura de Arquivos Fonte

Padrão obrigatório: `R[MOD][TYPE][SEQ].prw` (ex: `RFATA001.prw`).

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "nomenclatura" })
```

---

## Notacao Hungara (OBRIGATORIA)

Referência de prefixos (c/n/l/d/a/b/o) e exemplos de uso.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "hungara" })
```

---

## Cabecalho ProtheusDoc

Estrutura obrigatória para toda User Function pública (@type, @version, @author, @since, @param, @return).

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "ProtheusDoc" })
```

---

## Estrutura de Programa ADVPL

Includes básicos e estrutura de programa ADVPL/TLPP.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "estrutura" })
```

---

## Tratamento de Erros

Padrões de tratamento: guard clauses, ErrorBlock e try/catch/finally.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "tratamento erros" })
```

---

## Acesso a Banco de Dados

Padrões de busca com MsSeek, gravação com RecLock, commit e rollback.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "banco dados" })
```

---

## Dicionario de Dados — Convencoes

Convenções de naming para tabelas customizadas (SZ?), campos customizados (prefixo X), parâmetros (TB_) e índices.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "dicionario dados" })
```

---

## Pontos de Entrada — Padrao MVC e Legado

Regra de unicidade: 1 PE por arquivo. Padrão MVC e padrão legado com exemplos.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "pontos entrada" })
```

---

## MVC — ModelDef / ViewDef / MenuDef

Estrutura de modelos MVC com FWFormModel, FWFormView e rotinas de menu.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "MVC" })
```

---

## FWMBrowse (lista de registros)

Exemplo de FWMBrowse para listagem com filtros, legendas e formatação.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "FWMBrowse" })
```

---

## Semaforos e Numeracao Sequencial

Uso de GetNextCode para sequenciais e SemDecrease/SemIncrease para locks de recurso.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "semaforo" })
```

---

## Namespaces (TLPP)

Padrão obrigatório `FSW.TBC.<frente>`. Regras de user/static function. Chamadas entre namespaces com u_.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "namespace" })
```

---

## Estrutura de Pastas do Projeto de Fontes

Organização de fontes por módulo (FAT/FIN/EST/COM) com subdiretórios A/E/P/R.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "estrutura pastas" })
```

---

## Funcoes Nativas — Referencia Completa

Referência de funções nativas: String, Data/Hora, Array, Banco de Dados, Interface, Sistema.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "funcoes nativas" })
```

---

## Tabelas do Dicionário de Dados (SX)

Tabelas de sistema (SX1-SX9, SIX) e campos relevantes (SX3, SX5).

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "tabelas SX" })
```

---

## Erros Comuns e Soluções

Tabelas de diagnóstico para erros de compilação, runtime, performance e locks.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "erros comuns" })
```

---

## Pontos de Entrada Frequentes por Módulo

Referência de PEs por módulo (FAT/FIN/EST/COM) com momentos e tipos de retorno.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "pontos entrada modulo" })
```

---

## Code Analysis (antes do commit)

Ferramenta obrigatória antes de commitar qualquer fonte.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "code analysis" })
```

---

## Git — Branches

Convenções de branching para projetos Protheus.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-patterns", keyword: "git branches" })
```

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
