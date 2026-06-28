# Column Reference — Protheus Data Dictionary

Detailed description of all columns in the data dictionary tables. Use to interpret query results or understand the functional meaning of each field.

---

## SX2 — System Tables

| Column | Type | Description |
|--------|------|-------------|
| `x2_chave` | C | Table alias (SA1, SE1, etc.) — primary key |
| `x2_path` | C | Physical path (ISAM only, generally empty in SQL) |
| `x2_arquivo` | C | Physical table name in the database (e.g.: SA1010) |
| `x2_nome` | C | Table description in Portuguese |
| `x2_nomespa` | C | Description in Spanish |
| `x2_nomeeng` | C | Description in English |
| `x2_rotina` | C | Routine executed on table opening |
| `x2_modo` | C | Sharing mode: `C` (Shared) / `E` (Exclusive) |
| `x2_modoemp` | C | Company mode: `C`/`E` |
| `x2_modoun` | C | Business unit mode: `C`/`E` |
| `x2_unico` | C | Primary key fields (separated by `+`) |
| `x2_pyme` | C | Used by Protheus Series 3 |
| `x2_modulo` | N | Responsible module code |
| `x2_display` | C | Fields shown in browse detail (separated by `+`) |
| `x2_sysobj` | C | MVC source responsible for the table (system) |
| `x2_usrobj` | C | Custom responsible source (user) |
| `x2_autrec` | C | Auto-incremental recno: `1` = Yes, `2` = No |
| `x2_stamp` | C | S\_T\_A\_M\_P\_ field: `1` = Yes, `2` = No |
| `x2_insdt` | C | I\_N\_S\_D\_T\_ field: `1` = Yes, `2` = No |
| `x2_clob` | C | Memo type: blank/`1` = BLOB, `2` = CLOB |

**Sharing modes** (3 levels):
- `C/C/C` = Shared at all levels (branch, company, unit)
- `E/E/E` = Exclusive at all levels
- `C/C/E` = Shared up to company, exclusive per unit

---

## SX3 — Table Fields

| Column | Type | Description |
|--------|------|-------------|
| `x3_arquivo` | C | Table alias (reference to SX2) |
| `x3_ordem` | C | Field display order on screen |
| `x3_campo` | C | Field name (e.g.: A1_COD). Pattern: table prefix + `_` + name |
| `x3_tipo` | C | Data type: `C` (Character), `N` (Numeric), `D` (Date), `L` (Logical), `M` (Memo) |
| `x3_tamanho` | N | Field size (max 254 for character) |
| `x3_decimal` | N | Decimal places (type N only) |
| `x3_titulo` | C | Title/label in Portuguese |
| `x3_titspa` | C | Title in Spanish |
| `x3_titeng` | C | Title in English |
| `x3_descric` | C | Full description in Portuguese |
| `x3_descspa` | C | Description in Spanish |
| `x3_desceng` | C | Description in English |
| `x3_picture` | C | Input/display mask |
| `x3_valid` | C | System validation (User Function) |
| `x3_usado` | C | Internal use field (use API `X3Uso()`) |
| `x3_relacao` | C | Default initializer (auto-fill on insert) |
| `x3_f3` | C | F3 standard lookup code (reference to SXB) |
| `x3_nivel` | N | Field access level |
| `x3_reserv` | C | Internal permission control (use API `X3Reserv()`) |
| `x3_check` | C | *** Not used *** |
| `x3_trigger` | C | `S` = Has trigger in SX7 |
| `x3_propri` | C | `U` = User-customized field |
| `x3_browse` | C | `S` = Shown in browse, `N` or blank = No |
| `x3_visual` | C | `A` or blank = Editable, `V` = View only |
| `x3_context` | C | `R` or blank = Real (stored in DB), `V` = Virtual (not stored) |
| `x3_obrigat` | C | Required status (use API `X3Obrigat()` to interpret) |
| `x3_vlduser` | C | User validation (customizable) |
| `x3_cbox` | C | Combo box options in Portuguese (e.g.: `F=End Consumer;L=Rural Producer`) |
| `x3_cboxspa` | C | Combo box options in Spanish |
| `x3_cboxeng` | C | Combo box options in English |
| `x3_pictvar` | C | User Function for dynamic picture at runtime |
| `x3_when` | C | Enable condition at runtime (executed on each focus change) |
| `x3_inibrw` | C | Browse initializer (for virtual fields) |
| `x3_grpsxg` | C | Field group code (SXG) |
| `x3_folder` | C | Folder/tab number where the field appears |
| `x3_pyme` | C | Used by Protheus Series 3 |
| `x3_agrup` | C | Grouper code (SXA) — used in MVC |
| `x3_tela` | C | Numbers separated by `\|` for display control |
| `x3_pos` | C | Export to POS |

**Manipulation APIs** (avoid direct access to binary fields):
- `X3Obrigat(cField)` → Checks if required
- `X3Uso(cContent)` → Interprets X3_USADO field
- `X3Reserv(cContent)` → Interprets X3_RESERV field
- `X3Chave(cContent)` → Checks if field is a key
- `X3Alteravel(cContent)` → Checks if field is editable

---

## SIX — Table Indexes

| Column | Type | Description |
|--------|------|-------------|
| `indice` | C | Table alias |
| `ordem` | C | Index order: `1`-`9`, then `A`-`Z` |
| `chave` | C | Fields composing the index, separated by `+` (must exist in SX3, real fields) |
| `descricao` | C | Index description in Portuguese |
| `descspa` | C | Description in Spanish |
| `desceng` | C | Description in English |
| `propri` | C | Priority: `S` = System, `U` = User |
| `f3` | C | F3 fields (used by AxPesqu) |
| `nickname` | C | Index nickname (used in customizations) |
| `showpesq` | C | `S` = Shown in search/browse |

> **Rule**: Every table needs at least one index with `showpesq = 'S'` to be displayed in browse.

---

## SX6 — System Parameters

| Column | Type | Description |
|--------|------|-------------|
| `x6_fil` | C | Parameter branch |
| `x6_var` | C | Parameter name (MV_*) |
| `x6_tipo` | C | Type: `C` (Character), `N` (Numeric), `L` (Logical) |
| `x6_descric` | C | Description (line 1) |
| `x6_dscspa` | C | Description in Spanish (line 1) |
| `x6_dsceng` | C | Description in English (line 1) |
| `x6_desc1` | C | Supplementary description (line 2) |
| `x6_dscspa1` | C | Supplementary description in Spanish |
| `x6_dsceng1` | C | Supplementary description in English |
| `x6_desc2` | C | Supplementary description (line 3) |
| `x6_dscspa2` | C | Supplementary description in Spanish |
| `x6_dsceng2` | C | Supplementary description in English |
| `x6_conteud` | C | Default content in Portuguese |
| `x6_contspa` | C | Default content in Spanish |
| `x6_conteng` | C | Default content in English |
| `x6_propri` | C | Owner: `S` = System, `U` = User |
| `x6_valid` | C | Parameter validation |
| `x6_init` | C | Initialization |
| `x6_defpor` | C | Default value in Portuguese |

---

## SX5 — Generic Tables

| Column | Type | Description |
|--------|------|-------------|
| `x5_filial` | C | Branch |
| `x5_tabela` | C | Generic table code (e.g.: `00`, `12`, `33`) |
| `x5_chave` | C | Item key within the table |
| `x5_descri` | C | Description in Portuguese |
| `x5_descspa` | C | Description in Spanish |
| `x5_desceng` | C | Description in English |

---

## SX7 — Triggers

| Column | Type | Description |
|--------|------|-------------|
| `x7_campo` | C | Source field that fires the trigger |
| `x7_sequenc` | C | Trigger sequence (001, 002...) |
| `x7_regra` | C | Expression/formula to execute |
| `x7_cdomin` | C | Target field that receives the value |
| `x7_tipo` | C | Type: `P` = Primary, `E` = Foreign, `X` = Positioning |
| `x7_seek` | C | Seek expression |
| `x7_alias` | C | Table alias for seek |
| `x7_ordem` | N | Index to use for the seek |
| `x7_chave` | C | Seek key |
| `x7_condic` | C | Trigger execution condition |
| `x7_propri` | C | Owner: `S` = System, `U` = User |

**Trigger types:**
- `P` (Primary): Executes rule directly on target field
- `E` (Foreign): Fetches value from another table via seek
- `X` (Positioning): Only positions the table, no value return

---

## SX1 — Parameterization Questions

| Column | Type | Description |
|--------|------|-------------|
| `x1_grupo` | C | Question group code (used in `Pergunte()` function) |
| `x1_ordem` | C | Question order within the group |
| `x1_pergunt` | C | Question text in Portuguese |
| `x1_perspa` | C | Text in Spanish |
| `x1_pereng` | C | Text in English |
| `x1_variavl` | C | Variable name that stores the answer |
| `x1_tipo` | C | Type: `C` (Character), `N` (Numeric), `D` (Date) |
| `x1_tamanho` | N | Field size |
| `x1_decimal` | N | Decimal places |
| `x1_presel` | N | Pre-selected option |
| `x1_gsc` | C | Get type: `G` = Get, `S` = Select (combo), `C` = Check |
| `x1_valid` | C | Validation |
| `x1_var01` | C | Return variable (option 1) |
| `x1_def01` | C | Option 1 description in Portuguese |
| `x1_defspa1` | C | Option 1 description in Spanish |
| `x1_defeng1` | C | Option 1 description in English |
| `x1_cnt01` | C | Option 1 content |

> Pattern repeats for options 02-05 (`x1_var02`...`x1_def05`).

---

## SX9 — Table Relationships

| Column | Type | Description |
|--------|------|-------------|
| `x9_dom` | C | Domain table (main table) |
| `x9_ident` | C | Relationship identifier |
| `x9_cdom` | C | Counter-domain table (related table) |
| `x9_expdom` | C | Domain expression (field in main table) |
| `x9_expcdom` | C | Counter-domain expression (field in related table) |
| `x9_propri` | C | Owner: `S` = System, `U` = User |
| `x9_ligdom` | C | Domain binding |
| `x9_ligcdom` | C | Counter-domain binding |
| `x9_vinfil` | C | Branch binding: `1` = Enabled, `2` = Disabled |
| `x9_chvfor` | C | Strong key: `1` = Enabled, `2` = Disabled |
| `x9_enable` | C | Enabled |

**Strong key rules (x9_vinfil + x9_chvfor):**
- `vinfil=1, chvfor=2`: Exclusive Domain → Exclusive Counter-Domain. Shared Domain → Counter-Domain can be E or C
- `vinfil=1, chvfor=1`: Both must have the **same** sharing mode

---

## SXB — Standard Lookups (F3)

| Column | Type | Description |
|--------|------|-------------|
| `xb_alias` | C | Lookup code (referenced in SX3's `x3_f3`) |
| `xb_tipo` | C | Record type in the lookup |
| `xb_seq` | C | Sequence |
| `xb_coluna` | C | Column/field name |
| `xb_descri` | C | Column description in Portuguese |
| `xb_descspa` | C | Description in Spanish |
| `xb_desceng` | C | Description in English |
| `xb_contem` | C | Content/column configuration |
| `xb_wcontem` | C | Content for WHERE condition |
