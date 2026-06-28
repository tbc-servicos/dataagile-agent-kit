# SQL Queries — Protheus Data Dictionary

Complete SQL queries for the `execute-sql` tool. Replace `{PLACEHOLDER}` with the desired values.

> **Mandatory rules**: (1) `d_e_l_e_t_ = ' '` in every query. (2) Columns in **lowercase**. (3) `TRIM()` in `character` field comparisons. (4) Base table without suffix: `sx3`, never `sx3t10`.

---

## 1. SX2 — System Tables

**Search table by alias:**
```sql
SELECT TRIM(x2_chave) AS alias,
       TRIM(x2_nome) AS description,
       x2_modo AS mode,
       x2_modoemp AS company_mode,
       x2_modoun AS unit_mode,
       TRIM(x2_unico) AS unique_key,
       TRIM(x2_sysobj) AS mvc_routine,
       TRIM(x2_display) AS display_fields
FROM sx2
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x2_chave) = '{ALIAS}'
ORDER BY x2_chave
```

**List all tables:**
```sql
SELECT TRIM(x2_chave) AS alias,
       TRIM(x2_nome) AS description,
       x2_modo AS mode
FROM sx2
WHERE d_e_l_e_t_ = ' '
ORDER BY x2_chave
```

**Search table by description:**
```sql
SELECT TRIM(x2_chave) AS alias,
       TRIM(x2_nome) AS description,
       x2_modo AS mode
FROM sx2
WHERE d_e_l_e_t_ = ' '
  AND UPPER(x2_nome) LIKE '%{TERM}%'
ORDER BY x2_chave
```

---

## 2. SX3 — Table Fields

**List all fields of a table:**
```sql
SELECT TRIM(x3_campo) AS field,
       TRIM(x3_titulo) AS title,
       TRIM(x3_tipo) AS type,
       x3_tamanho AS size,
       x3_decimal AS decimals,
       TRIM(x3_picture) AS picture,
       TRIM(x3_context) AS context,
       TRIM(x3_obrigat) AS required,
       TRIM(x3_browse) AS in_browse,
       TRIM(x3_visual) AS visual,
       TRIM(x3_valid) AS validation,
       TRIM(x3_relacao) AS initializer,
       TRIM(x3_f3) AS f3_lookup,
       TRIM(x3_cbox) AS combo_box,
       TRIM(x3_trigger) AS has_trigger
FROM sx3
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x3_arquivo) = '{ALIAS}'
ORDER BY x3_ordem
```

**Search specific field:**
```sql
SELECT TRIM(x3_campo) AS field,
       TRIM(x3_titulo) AS title,
       TRIM(x3_descric) AS description,
       TRIM(x3_tipo) AS type,
       x3_tamanho AS size,
       x3_decimal AS decimals,
       TRIM(x3_picture) AS picture,
       TRIM(x3_valid) AS validation,
       TRIM(x3_vlduser) AS user_validation,
       TRIM(x3_relacao) AS initializer,
       TRIM(x3_when) AS when_condition,
       TRIM(x3_cbox) AS combo_box,
       TRIM(x3_f3) AS f3_lookup,
       TRIM(x3_context) AS context,
       TRIM(x3_propri) AS owner,
       TRIM(x3_grpsxg) AS field_group,
       TRIM(x3_folder) AS folder
FROM sx3
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x3_campo) = '{FIELD}'
```

**Summary fields (quick view):**
```sql
SELECT TRIM(x3_campo) AS field,
       TRIM(x3_titulo) AS title,
       TRIM(x3_tipo) AS type,
       x3_tamanho AS size,
       x3_decimal AS decimals
FROM sx3
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x3_arquivo) = '{ALIAS}'
ORDER BY x3_ordem
```

---

## 3. SIX — Table Indexes

**List indexes of a table:**
```sql
SELECT TRIM(indice) AS alias,
       TRIM(ordem) AS order_num,
       TRIM(chave) AS composition,
       TRIM(descricao) AS description,
       TRIM(nickname) AS nickname,
       TRIM(showpesq) AS show_in_search
FROM six
WHERE d_e_l_e_t_ = ' '
  AND TRIM(indice) = '{ALIAS}'
ORDER BY ordem
```

---

## 4. SX6 — System Parameters

**Query parameter by name:**
```sql
SELECT TRIM(x6_var) AS parameter,
       TRIM(x6_tipo) AS type,
       TRIM(x6_descric) AS description,
       TRIM(x6_desc1) AS description_line2,
       TRIM(x6_desc2) AS description_line3,
       TRIM(x6_conteud) AS default_value,
       TRIM(x6_propri) AS owner,
       TRIM(x6_valid) AS validation,
       TRIM(x6_init) AS initialization
FROM sx6
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x6_var) LIKE '{MV_NAME}%'
ORDER BY x6_var
```

**Search parameters by description:**
```sql
SELECT TRIM(x6_var) AS parameter,
       TRIM(x6_tipo) AS type,
       TRIM(x6_descric) AS description,
       TRIM(x6_conteud) AS default_value
FROM sx6
WHERE d_e_l_e_t_ = ' '
  AND (UPPER(x6_descric) LIKE '%{TERM}%' OR UPPER(x6_desc1) LIKE '%{TERM}%')
ORDER BY x6_var
```

---

## 5. SX5 — Generic Tables

**Query values of a generic table:**
```sql
SELECT TRIM(x5_tabela) AS table_code,
       TRIM(x5_chave) AS key,
       TRIM(x5_descri) AS description
FROM sx5
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x5_tabela) = '{TABLE_CODE}'
ORDER BY x5_chave
```

**List all available generic tables:**
```sql
SELECT DISTINCT TRIM(x5_tabela) AS table_code,
       MIN(TRIM(x5_descri)) AS sample_description
FROM sx5
WHERE d_e_l_e_t_ = ' '
GROUP BY TRIM(x5_tabela)
ORDER BY table_code
```

---

## 6. SX7 — Triggers

**List triggers for a field:**
```sql
SELECT TRIM(x7_campo) AS source_field,
       TRIM(x7_sequenc) AS sequence,
       TRIM(x7_regra) AS rule_expression,
       TRIM(x7_cdomin) AS target_field,
       TRIM(x7_tipo) AS type,
       TRIM(x7_seek) AS seek_expression,
       TRIM(x7_alias) AS seek_alias,
       x7_ordem AS index_order,
       TRIM(x7_chave) AS seek_key,
       TRIM(x7_condic) AS condition
FROM sx7
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x7_campo) LIKE '{FIELD}%'
ORDER BY x7_campo, x7_sequenc
```

**List all triggers for a table (by field prefix):**
```sql
SELECT TRIM(x7_campo) AS source_field,
       TRIM(x7_sequenc) AS sequence,
       TRIM(x7_cdomin) AS target_field,
       TRIM(x7_regra) AS rule,
       TRIM(x7_tipo) AS type
FROM sx7
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x7_campo) LIKE '{FIELD_PREFIX}_%'
ORDER BY x7_campo, x7_sequenc
```

---

## 7. SX1 — Parameterization Questions

**Query questions for a group:**
```sql
SELECT TRIM(x1_grupo) AS group_code,
       TRIM(x1_ordem) AS order_num,
       TRIM(x1_pergunt) AS question,
       TRIM(x1_variavl) AS variable,
       TRIM(x1_tipo) AS type,
       x1_tamanho AS size,
       x1_presel AS pre_selection,
       TRIM(x1_gsc) AS get_type,
       TRIM(x1_def01) AS option_01,
       TRIM(x1_def02) AS option_02
FROM sx1
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x1_grupo) = '{GROUP}'
ORDER BY x1_ordem
```

---

## 8. SX9 — Table Relationships

**Query relationships for a table:**
```sql
SELECT TRIM(x9_dom) AS domain_table,
       TRIM(x9_cdom) AS counter_domain_table,
       TRIM(x9_expdom) AS domain_expression,
       TRIM(x9_expcdom) AS counter_domain_expression,
       TRIM(x9_vinfil) AS branch_binding,
       TRIM(x9_chvfor) AS strong_key
FROM sx9
WHERE d_e_l_e_t_ = ' '
  AND (TRIM(x9_dom) = '{ALIAS}' OR TRIM(x9_cdom) = '{ALIAS}')
ORDER BY x9_dom, x9_cdom
```

---

## 9. SXB — Standard Lookups (F3)

**Query configuration of a standard lookup:**
```sql
SELECT TRIM(xb_alias) AS alias,
       TRIM(xb_tipo) AS type,
       TRIM(xb_seq) AS sequence,
       TRIM(xb_coluna) AS column_name,
       TRIM(xb_descri) AS description,
       TRIM(xb_contem) AS content
FROM sxb
WHERE d_e_l_e_t_ = ' '
  AND TRIM(xb_alias) = '{F3_CODE}'
ORDER BY xb_tipo, xb_seq
```

---

## Consultas Combinadas

### Campos com gatilhos de uma tabela (SX3 + SX7)

```sql
SELECT TRIM(s3.x3_campo) AS campo,
       TRIM(s3.x3_titulo) AS titulo,
       TRIM(s7.x7_cdomin) AS campo_destino,
       TRIM(s7.x7_regra) AS regra
FROM sx3 s3
INNER JOIN sx7 s7 ON TRIM(s7.x7_campo) = TRIM(s3.x3_campo)
WHERE s3.d_e_l_e_t_ = ' '
  AND s7.d_e_l_e_t_ = ' '
  AND TRIM(s3.x3_arquivo) = '{ALIAS}'
ORDER BY s3.x3_campo, s7.x7_sequenc
```

### Campos obrigatórios de uma tabela

```sql
SELECT TRIM(x3_campo) AS campo,
       TRIM(x3_titulo) AS titulo,
       TRIM(x3_tipo) AS tipo,
       x3_tamanho AS tamanho
FROM sx3
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x3_arquivo) = '{ALIAS}'
  AND x3_obrigat IS NOT NULL
  AND TRIM(x3_obrigat) <> ''
ORDER BY x3_ordem
```

### Campos virtuais de uma tabela

```sql
SELECT TRIM(x3_campo) AS campo,
       TRIM(x3_titulo) AS titulo,
       TRIM(x3_relacao) AS inicializador,
       TRIM(x3_inibrw) AS inicializador_browse
FROM sx3
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x3_arquivo) = '{ALIAS}'
  AND TRIM(x3_context) = 'V'
ORDER BY x3_ordem
```

### Campos com consulta padrão (F3)

```sql
SELECT TRIM(x3_campo) AS campo,
       TRIM(x3_titulo) AS titulo,
       TRIM(x3_f3) AS codigo_f3
FROM sx3
WHERE d_e_l_e_t_ = ' '
  AND TRIM(x3_arquivo) = '{ALIAS}'
  AND TRIM(x3_f3) <> ''
ORDER BY x3_ordem
```
