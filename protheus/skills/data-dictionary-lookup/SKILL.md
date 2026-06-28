---
name: data-dictionary-lookup
description: "Query the TOTVS Protheus ERP data dictionary (SX2 tables, SX3 fields, SIX indexes, SX6 parameters, SX5 generic tables, SX7 triggers, SX1 questions, SX9 relationships, SXB standard lookups, SXG/SXA groups). Use when the user asks 'what fields does SA1 have', 'what is the index of SE1', 'parameter MV_ESTADO', 'generic table 12', 'triggers for field A1_COD', 'standard lookup SA1', 'table structure', 'data dictionary'. Also use during refactoring, migration, or code improvements when dictionary impact validation is needed to confirm whether changes affect fields, triggers, indexes, parameters, or table relationships."
license: MIT
metadata:
  domain: Protheus
  maintainer: Customizações ADVPL/TLPP
  author: Thalion Starforge
  version: '4.1.0'
  category: Documentation
---

# Protheus Data Dictionary Lookup

## Overview

Structured querying of the TOTVS Protheus ERP data dictionary. Allows searching tables, fields, indexes, parameters, generic tables, triggers, parameterization questions, relationships, and standard lookups (SQL queries via `execute-sql` and TDN documentation via search tools).

## When to Use

- Discover which fields a table has and their types/sizes
- Check available indexes for a table
- Query the value and purpose of a parameter (MV_*)
- Search generic table contents (SX5)
- Check triggers associated with a field
- Query parameterization questions (SX1)
- Check relationships between tables (SX9)
- Query standard lookups (SXB)
- Find the sharing mode of a table (Exclusive/Shared)
- **Impact validation in the dictionary**: during refactorings, migrations, or code improvements, consult the dictionary when necessary to confirm whether the changes affect fields, triggers, indexes, parameters, or relationships of the tables involved in the process

---

## Bundled Reference Files

This skill uses progressive disclosure. The SKILL.md covers dictionary structure, query flow, and response format. SQL queries and detailed column reference are in the `references/` directory — read on demand as needed:

| Reference File | When to Read | Content |
| --- | --- | --- |
| [references/sql-queries.md](references/sql-queries.md) | Executing **dictionary queries** — listing fields, indexes, parameters, triggers, questions, relationships, standard lookups, or combining SX* tables | Complete SQL queries for all 9 dictionary tables (SX2, SX3, SIX, SX6, SX5, SX7, SX1, SX9, SXB), combined queries (full view, fields with triggers, mandatory fields), and mandatory `execute-sql` rules (TRIM, d_e_l_e_t_, lowercase) |
| [references/column-reference.md](references/column-reference.md) | Interpreting **results** or needing to understand the **meaning of specific columns** from SX* tables | Detailed tables with all columns from SX2, SX3, SIX, SX6, SX5, SX7, SX1, SX9, and SXB, including type, possible values, and functional description |

---

## Data Dictionary Structure

Protheus organizes its metadata in SX* tables:

| Table | Description | Primary Key |
|-------|-------------|-------------|
| **SX1** | Parameterization questions (reports/queries) | `X1_GRUPO` + `X1_ORDEM` |
| **SX2** | System tables registry | `X2_CHAVE` (table alias) |
| **SX3** | Table fields | `X3_ARQUIVO` + `X3_CAMPO` |
| **SX5** | Generic tables (lookup values) | `X5_TABELA` + `X5_CHAVE` |
| **SX6** | System parameters (MV_*) | `X6_VAR` |
| **SX7** | Field triggers | `X7_CAMPO` + `X7_SEQUENC` |
| **SX9** | Table relationships | `X9_DOM` + `X9_CDOM` |
| **SXA** | Folders and groupers | - |
| **SXB** | Standard lookups (F3) | `XB_ALIAS` + `XB_TIPO` |
| **SXG** | Field groups | - |
| **SIX** | Table indexes | `INDICE` + `ORDEM` |

---

## Mandatory Rules for execute-sql Queries

1. **Always** include `d_e_l_e_t_ = ' '` (soft-delete filter)
2. Columns are **lowercase** — never use `X3_CAMPO`, always `x3_campo`
3. Use `TRIM()` in `character` field comparisons (trailing spaces)
4. Use **base** table without suffix: `sx3`, `sx2`, `six` — **never** `sx3t10`, `sx2t10`

---

## Query Flow by Scenario

### Full table overview

Execute **3 queries in parallel** (see queries in [references/sql-queries.md](references/sql-queries.md)):

1. **Metadata** → SX2 filtering by `x2_chave`
2. **Fields** → SX3 filtering by `x3_arquivo`
3. **Indexes** → SIX filtering by `indice`

### Parameter lookup

1. Search by exact name (`TRIM(x6_var) LIKE 'MV_NAME%'`) or by description (`UPPER(x6_descric) LIKE '%TERM%'`)
2. If additional context is needed, search TDN documentation via `product-docs-search`

### Field triggers

1. Query SX7 filtering by `x7_campo`
2. Combine with SX3 to get field titles for involved fields

---

## Response Format

When presenting results to the user, always:

1. **Title**: Table name and description (from SX2)
2. **Sharing mode**: E (Exclusive) or C (Shared) — indicate the meaning
3. **Formatted table**: Fields in markdown table with relevant columns
4. **Indexes**: List with composition and description
5. **Notes**: Virtual fields, triggers, special validations

### Response Example

```markdown
## SA1 — Customer Registry

**Mode**: Shared (C/C/C)
**Unique key**: A1_FILIAL+A1_COD+A1_LOJA
**MVC Routine**: CRMA980

### Main Fields

| Field | Title | Type | Size | Dec | Required | Context |
|-------|-------|------|------|-----|----------|---------|
| A1_FILIAL | Branch | C | 8 | 0 | Yes | Real |
| A1_COD | Code | C | 6 | 0 | Yes | Real |
| A1_LOJA | Store | C | 2 | 0 | Yes | Real |
| A1_NOME | Name | C | 40 | 0 | Yes | Real |
...

### Indexes

| Order | Composition | Description |
|-------|-------------|-------------|
| 1 | A1_FILIAL+A1_COD+A1_LOJA | Customer Code+Store |
| 2 | A1_FILIAL+A1_NOME | Name |
...
```

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Query returns empty | `character` field has trailing spaces | Use `TRIM()` in comparisons |
| Data not found | Table has enterprise suffix (sx3**t10**) | Use base table without suffix: `sx3`, `sx2`, `six` |
| Field not found | Alias with spaces in `x3_arquivo` | Use `TRIM(x3_arquivo) = 'SA1'` |
| Deleted records returned | Missing soft-delete filter | Always include `d_e_l_e_t_ = ' '` |
