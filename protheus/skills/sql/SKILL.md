---
name: sql
description: Referência e geração de SQL embarcado em ADVPL/TLPP para Protheus. Cobre BeginSQL/EndSQL, macros essenciais (%table%, %xfilial%, %notDel%, %exp%, %Order%), TCSqlExec para INSERT/UPDATE/DELETE, joins, subconsultas e anti-patterns de segurança.
---

# ADVPL SQL — SQL Embarcado no Protheus

Referência completa para integração SQL em código ADVPL/TLPP para TOTVS Protheus.

---

## Por que BeginSQL em vez de TCQuery?

Comparação de abordagens para consultas SQL em ADVPL.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "BeginSQL TCQuery" })
```

---

## Macros Essenciais

Macros padrão: `%table%`, `%xfilial%`, `%notDel%`, `%exp%`, `%Order%`, `%noAlias%`.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "macros" })
```

---

## Templates: SELECT

Exemplos de SELECT básico, com variável (binding seguro) e JOINs entre tabelas.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "SELECT template" })
```

---

## TCSqlExec — INSERT / UPDATE / DELETE

Exemplos de DML (INSERT, UPDATE, DELETE lógico) com TCSqlExec.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "TCSqlExec" })
```

---

## Funções de Suporte SQL

Referência de funções: RetSqlName, GetNextAlias, TCSqlExec, xFilial.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "funcoes SQL" })
```

---

## Regras Críticas

Regras essenciais: sem `*` em linha inicial, sempre incluir `%notDel%` e `%xfilial%`, evitar SQL injection, fechar alias, nunca full scan.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "regras criticas" })
```

---

## Quando usar BeginSQL vs ISAM

Decisão entre BeginSQL/EndSQL e ISAM (dbSeek/MsSeek) por cenário.

Consulte a referência completa via MCP:
```
searchKnowledge({ skill: "protheus-sql", keyword: "BeginSQL ISAM" })
```

---

## Consulta de Conhecimento

Se precisar de informação não disponível no MCP, consulte o RAG:
```
searchKnowledge({ keyword: "<termo relevante>" })
```
