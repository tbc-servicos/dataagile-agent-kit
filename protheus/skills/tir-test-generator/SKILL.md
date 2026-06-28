---
name: tir-test-generator
description: 'Generate TIR (TOTVS Interface Robot) end-to-end test scripts in Python for Protheus SmartClient/Webapp screens. Supports CRUD screen tests, MVC screen tests, grid interaction, report tests, field validation, and message box assertions. Use when a user says "TIR test", "interface test", "e2e test Protheus", "SmartClient test", "Webapp test", "screen test", "create Python test for Protheus screen", or "automate Protheus UI test".'
license: MIT
metadata:
  domain: Protheus
  maintainer: Customizações ADVPL/TLPP
  author: Thalion Starforge
  version: '5.0.0'
  category: Testing
---

# Protheus TIR Test Generator

## Overview

Generate end-to-end **interface test scripts** in Python for the TOTVS Protheus ERP using the **TIR** (TOTVS Interface Robot) framework. TIR automates Protheus screens through the SmartClient/Webapp interface, validating complete user workflows including screen navigation, field interaction, grid manipulation, button clicks, and result assertions.

TIR tests use Python's `unittest` framework combined with the `tir.Webapp` class to:
1. **Connect** to a running Protheus Webapp environment
2. **Navigate** to specific routines via `Program()`
3. **Interact** with screen elements (fields, grids, buttons, folders)
4. **Assert** field values, screen states, and data integrity
5. **Tear down** the session cleanly

## When to Use

Use this skill when:

- Creating end-to-end UI tests for Protheus screens (CRUD, workflows)
- Testing MVC-generated screens via the SmartClient/Webapp interface → use `Webapp` class
- Validating critical user journeys (complete business flows)
- Testing screen navigation, menu access, and dialog handling
- Validating field interactions (fill, check, read values)
- Testing grid operations (add rows, edit cells, scroll, select)
- Validating reports via parameter screens
- Needing visual/interface-level regression tests

### When NOT to Use

- **TLPP unit tests** → Use ProBat (@TestFixture)

---

## Which TIR Class to Use?

| Routine type | TIR class | Import |
|---|---|---|
| MVC (`ModelDef`/`ViewDef`/`MenuDef`) | `Webapp` | `from tir import Webapp` |
| Legacy Browse (`MBrowse`, `AxCadastro`) | `Webapp` | `from tir import Webapp` |

---

## TIR Three-File Architecture (MANDATORY)

Every TIR test project requires **three files**:

| File | Responsibility |
|------|---------------|
| `{ROUTINE}TESTCASE.py` | Test class with `unittest.TestCase`, `setUpClass`, test methods (`test_*`), `tearDownClass` |
| `{ROUTINE}TESTSUITE.py` | Runner: imports TESTCASE, builds `unittest.TestSuite`, executes with `TextTestRunner` |
| `config.json` | Environment configuration — URL, browser, credentials, Protheus environment name |

**Without `config.json` in the same directory, TIR cannot connect to Protheus.**

```
{test_directory}/
├── {ROUTINE}TESTCASE.py    ← test class
├── {ROUTINE}TESTSUITE.py   ← runner (CI/CD entry point)
└── config.json             ← environment config (REQUIRED)
```

### config.json — Webapp (MVC/Legacy)

```json
{
    "Url": "http://{server}:{port}/",
    "Browser": "Chrome",
    "Environment": "{environment_name}",
    "User": "{username}",
    "Password": "{password}",
    "Language": "pt-br"
}
```

For the complete `config.json` parameter reference (all sections: Required, Additional, Logging, Database, Chrome), see [tir-setup-and-best-practices.md](references/tir-setup-and-best-practices.md).

---

## Complete File Templates

### TESTCASE Template — Webapp (MVC/Legacy)

```python
from tir import Webapp
import unittest

class {ROUTINE}(unittest.TestCase):
    """
    TIR E2E Tests for {ROUTINE} - {Description}
    Module: {MODULE}
    Tables: {TABLE_ALIASES}
    """

    @classmethod
    def setUpClass(inst):
        """Setup: Initialize Webapp, configure environment, open routine"""
        inst.oHelper = Webapp()
        inst.oHelper.Setup('{MODULE}', '{DATE}', 'T1', '{BRANCH}')
        inst.oHelper.Program('{ROUTINE}')

    def test_{ROUTINE}_CT001(self):
        """CT001 — Include record with required fields"""
        self.oHelper.SetButton('Incluir')
        self.oHelper.SetBranch('{BRANCH}')
        self.oHelper.SetValue('{Field Label 1}', '{value1}')
        self.oHelper.SetValue('{Field Label 2}', '{value2}')
        self.oHelper.SetButton('Salvar')
        self.oHelper.SearchBrowse(f'{BRANCH}{search_key}', key='Filial+{Search Column}')
        self.oHelper.SetButton('Visualizar')
        self.oHelper.CheckResult('{FIELD_NAME}', '{expected_value}')
        self.oHelper.SetButton('Cancelar')
        self.oHelper.AssertTrue()

    def test_{ROUTINE}_CT002(self):
        """CT002 — Edit existing record"""
        self.oHelper.SearchBrowse(f'{BRANCH}{search_key}', key='Filial+{Search Column}')
        self.oHelper.SetButton('Alterar')
        self.oHelper.SetValue('{Field Label}', '{new_value}')
        self.oHelper.SetButton('Salvar')
        self.oHelper.AssertTrue()

    def test_{ROUTINE}_CT003(self):
        """CT003 — Delete record"""
        self.oHelper.SearchBrowse(f'{BRANCH}{search_key}', key='Filial+{Search Column}')
        self.oHelper.SetButton('Outras Ações', sub_item='Excluir')
        self.oHelper.SetButton('Confirmar')
        self.oHelper.AssertTrue()

    def test_{ROUTINE}_CT004(self):
        """CT004 — Validate required field rule (negative)"""
        self.oHelper.SetButton('Incluir')
        self.oHelper.SetButton('Salvar')
        self.oHelper.CheckHelp(text_help='{HELP_ID}', button='Fechar')
        self.oHelper.SetButton('Cancelar')
        self.oHelper.AssertFalse()

    @classmethod
    def tearDownClass(inst):
        """Teardown: Close session and collect results"""
        inst.oHelper.TearDown()

if __name__ == '__main__':
    unittest.main()
```

### TESTSUITE Template

```python
import unittest

from {ROUTINE}TESTCASE import {ROUTINE}

suite = unittest.TestSuite()

suite.addTest({ROUTINE}('test_{ROUTINE}_CT001'))
suite.addTest({ROUTINE}('test_{ROUTINE}_CT002'))
suite.addTest({ROUTINE}('test_{ROUTINE}_CT003'))
suite.addTest({ROUTINE}('test_{ROUTINE}_CT004'))

runner = unittest.TextTestRunner(verbosity=2)
runner.run(suite)
```

---

## TIR Webapp Key Methods Reference

For the complete TIR Webapp API reference (Setup & Lifecycle, Field Interaction, Browse & Navigation, Grid Operations, Assertions & Validation, Dialog Handling, Parameters & Configuration), see [tir-webapp-methods-reference.md](references/tir-webapp-methods-reference.md).

---

## Test Script Patterns

For all complete test script templates (Standard CRUD, Master-Detail with Grid, Tabs/Folders, View/Validate, Validation Error, Other Actions Menu, Report with Parameters, Grid Checkbox Selection), see [tir-test-patterns.md](references/tir-test-patterns.md).

---

## Step-by-Step Process

When generating TIR test scripts, follow this process:

### 1. Identify the Screen Type

| Screen Type | Characteristics | Key Methods |
|-------------|----------------|-------------|
| **Simple CRUD** | Single form, no grid | `SetValue`, `SetButton`, `CheckResult` |
| **Master-Detail** | Form + grid (e.g., invoice header + items) | `SetValue` (grid=True), `LoadGrid`, `ClickGridCell` |
| **Tabbed Screen** | Multiple folders/tabs | `ClickFolder`, `SetValue` per tab |
| **Browse + Actions** | Browse grid with action menu | `SearchBrowse`, `SetButton('Outras Ações', sub_item=...)` |
| **Report** | Parameter screen + output | `SetValue` for params, `SetButton('OK')`, `WaitProcessing` |
| **Wizard** | Multi-step dialog flow | `SetButton('Avançar')`, `SetButton('Finalizar')` |

### 2. Map Screen Elements

For each test, identify:
- **Field labels** as they appear on screen (used by `SetValue`)
- **Field technical names** (used by `CheckResult`, e.g., `'A1_COD'`, `'B1_DESC'`)
- **Button labels** (e.g., `'Incluir'`, `'Alterar'`, `'Salvar'`, `'Cancelar'`)
- **Grid columns** and their headers
- **Tab/folder names**
- **Search key format** for `SearchBrowse` — see *UI Conventions & Pitfalls* below for the right rule

---

## UI Conventions & Pitfalls (LEARNED FROM REAL RUNS)

These are the details that separate a TIR script that runs from a script that fails at the first click. They are not negotiable — they came from running against real Protheus environments.

### SearchBrowse — key name and padding

The `key=` argument **must match the browse column header as rendered on screen**, not a generic pattern. Two common headers in MVC routines:

| Routine trait | `key` value | Search term example |
|---|---|---|
| Browse keyed only by `{ALIAS}_COD` | `'Filial+codigo'` | `'D MG 01000033'` |
| Browse keyed by `{ALIAS}_COD + {ALIAS}_LOJA` (customers, suppliers) | `'Filial+codigo + Loja'` | `f'D MG 01{cod+loja}'` |
| Modern routines with composite semantic header | Copy the header **verbatim** | — |

**Rule of thumb**: the browse header is the **source of truth**. If in doubt, open the browse in a real session and read the sort-selector label. Do **not** invent `'Filial+codigo + Loja'` for a routine that browses only by code — `SearchBrowse` will scroll past the record and never find it.

### Sub-menus with multiple levels

When "Outras Ações" opens a sub-menu that opens another sub-menu (e.g., `Outras Ações → Oportunidades → Nova Oportunidade`), TIR requires **pipe-separated** sub-items:

```python
# Correct — nested sub-menu with pipe
self.oHelper.SetButton('Outras Ações', sub_item='Oportunidades|Nova Oportunidade')

# Wrong — loses the intermediate level, click never registers
self.oHelper.SetButton('Outras Ações', sub_item='Nova Oportunidade')
```

If the spec path has `→ X → Y` (two arrows after the main menu), use `sub_item='X|Y'`.

### Close buttons — `Cancelar` vs `Fechar` vs `Sair`

Different screens use different close labels. The convention in Protheus MVC is:

| Screen context | Button to close |
|---|---|
| Form opened by `Visualizar`, `Incluir`, `Alterar` | `'Cancelar'` |
| Related-action screen (sub-window) that only lists or reads data | `'Fechar'` |
| Wizard last step that only confirms | `'Concluir'` or `'Finalizar'` |
| Main browse session | `TearDown()` closes it — never click manually |

**Never** use `'Sair'` unless you have verified on the real screen. `'Sair'` is rare in modern MVC and most of the time produces a ghost click that TIR reports as success while nothing happened.

### `CheckResult` — technical name vs label

| Situation | Use |
|---|---|
| The field has a clear `{ALIAS}_{NAME}` in the dictionary and the screen is the main form (Visualizar/Alterar of the routine being tested) | Technical name (`'A1_COD'`, `'C5_CLIENTE'`) |
| The field belongs to a **related screen** called as an action (Nova Oportunidade, Novo Apontamento, Facilitador) — you may not know the alias of that secondary model | **Screen label** (`'Cliente'`, `'Nome'`) |

**Do not guess technical names for related screens.** If the spec only gives a label and the routine alias is different (`UA_*`, `AE_*`, etc.), use the label. A wrong technical name fails silently or — worse — matches a different field with the same prefix.

### Validation of "screen opened"

Validating that a related screen opened is best done by asserting **content**, not just presence:

```python
# Weak — asserts something appeared but doesn't prove it's the right thing
self.oHelper.WaitShow('Subclientes')

# Strong — confirms the expected child record is listed
self.oHelper.SearchBrowse(f'D MG 01{filho+loja}', key='Filial+codigo + Loja')
```

Use `WaitShow` as a safety net **before** the content assertion, not as a replacement for it.

### Setup branch padding

The `Setup()` branch string and the `SearchBrowse` branch prefix must be **character-for-character identical**, including trailing spaces. `'D MG 01'` (no space) and `'D MG 01 '` (trailing space) are different keys in the browse. Match what the live environment renders.

### 3. Define Test Scenarios

| Scenario | Pattern | Assertion |
|----------|---------|-----------|
| Include with required fields | Fill fields → Salvar → SearchBrowse → Visualizar → CheckResult → Cancelar | `AssertTrue()` |
| Edit existing record | SearchBrowse → Alterar → SetValue → Salvar | `AssertTrue()` |
| Delete record | SearchBrowse → Outras Ações/Excluir → Confirmar | `AssertTrue()` |
| Required field validation | Incluir → Salvar (empty) → CheckHelp → Cancelar | `AssertFalse()` |
| Business rule validation | Fill invalid values → Salvar → CheckHelp → Cancelar | `AssertFalse()` |

### 4. Handle Common Screen Interactions

| Interaction | Method |
|-------------|--------|
| Open routine | `Program('{ROUTINE}')` |
| Set branch after Incluir | `SetBranch('{BRANCH}')` |
| Click a button | `SetButton('{Label}')` |
| Click sub-menu button | `SetButton('{Main}', sub_item='{Sub}')` |
| Fill a form field | `SetValue('{Label}', '{value}')` |
| Fill a grid cell | `SetValue('{Column}', '{value}', grid=True, grid_number=1, row=N)` |
| Refresh grid | `LoadGrid()` |
| Switch tab | `ClickFolder('{Tab Name}')` |
| Search in browse | `SearchBrowse(f'{BRANCH}{key}', 'Filial+{Column}')` |
| Check field value | `CheckResult('{FIELD_NAME}', '{expected}')` |
| Handle error dialog | `CheckHelp(text_help='{ID}', button='Fechar')` |
| Wait for processing | `WaitProcessing('{message}')` |
| Send keyboard key | `SetKey('{KEY}', grid=True/False)` |

### 5. Build the TESTSUITE

After generating the TESTCASE, always generate the TESTSUITE that:
1. Imports the test class from the TESTCASE file
2. Creates a `unittest.TestSuite()`
3. Adds each test method with `suite.addTest()`
4. Runs with `unittest.TextTestRunner(verbosity=2)`

---

## Rationalization Guard

The moments the generator is most tempted to cut corners — and what actually happens.

| Temptation | Reality |
|---|---|
| "I don't know the alias of the secondary screen, but `UA_CLIENTE` looks right for an opportunity, let me guess." | Wrong alias = silent failure or wrong field matched. **Use the screen label** (`'Cliente'`) when the secondary screen's model is not in your context. Guessing propagates to every future test of that routine. |
| "The spec says `Outras Ações → Oportunidades → Nova Oportunidade`, but I'll just pass `'Nova Oportunidade'` — TIR will find it." | No. Sub-menu navigation is literal. Drop the middle level and the click never happens. Use pipes: `sub_item='Oportunidades\|Nova Oportunidade'`. |
| "The browse header might be `'Filial+codigo + Loja'` — that's the MATA030 pattern, CRMA980 must be the same." | Not guaranteed. Different browses, different headers. Look at the real screen or the `MenuDef` before committing to `key=`. |
| "`'Sair'`, `'Fechar'`, `'Cancelar'` — whatever, they all close the window." | They close **different** windows. A wrong label produces a TIR warning that most CI pipelines swallow. See *Close buttons* above. |
| "`WaitShow('SubClientes')` is enough — if the screen appeared, the test passes." | No. `WaitShow` only confirms a string is on the page. Assert **content** (the expected child record, a specific field value). |
| "The spec references pre-existing customers `000033`, `000050`... I'll just use them. If they don't exist, TIR will create an error and we catch it later." | The error is `SearchBrowse did not find`. The test marks as failure, not as missing-data. Ensure the required records exist in the environment before running the suite — add a `setUpClass` step that creates them via ExecAuto, or document them as a manual prerequisite in the test file header. |
| "I'll leave `{server}` or `{port}` in `config.json` — the user will fix it." | `config.json` without real values fails at connection, the test never starts, the user debugs the wrong layer. Either fill with sensible defaults (`localhost`, `8080`) or explicitly mark the file with a TODO comment. |

---

## Setup Requirements & Best Practices

For environment setup (Python, Webapp, `tir.json` configuration) and best practices (test independence, naming conventions, screen interactions, assertions, environment isolation), see [tir-setup-and-best-practices.md](references/tir-setup-and-best-practices.md).

---

## Checklist

Before finalizing generated TIR test scripts, verify:

**config.json:**
- [ ] File present in the same directory as the test scripts
- [ ] `Url`, `Browser`, `Environment`, `User`, `Password`, `Language` all set
- [ ] No placeholder values like `{server}`, `{username}` remaining

**TESTCASE file (`{ROUTINE}TESTCASE.py`):**
- [ ] File named `{ROUTINE}TESTCASE.py`
- [ ] Class named `{ROUTINE}` inheriting from `unittest.TestCase`
- [ ] Correct class imported: `from tir import Webapp`
- [ ] `setUpClass(inst)` contains the correct class instantiation, `Setup()`, and `Program()` calls
- [ ] `tearDownClass(inst)` contains `TearDown()` call
- [ ] `Setup()` has correct module, date, group, and branch (4 args — 5th `module` is optional)
- [ ] Each test method starts with `test_` prefix and has a docstring
- [ ] Positive tests end with `self.oHelper.AssertTrue()` — NO parameters
- [ ] Negative tests end with `self.oHelper.AssertFalse()` — NO parameters

**Webapp-specific (MVC/Legacy):**
- [ ] `SetBranch()` called after `SetButton('Incluir')` when needed
- [ ] `SearchBrowse(term, key=...)` uses `key=` kwarg with branch-prefixed term
- [ ] `key=` value matches the **real browse header** — single-key routines use `'Filial+codigo'`, composite-key routines use `'Filial+codigo + Loja'` (verify, don't assume)
- [ ] Branch padding in `Setup()` matches **exactly** the branch padding in `SearchBrowse` (trailing space matters)
- [ ] Sub-menus with 2+ levels use pipe: `sub_item='Level1\|Level2'`
- [ ] Close buttons: `'Cancelar'` for Visualizar/Alterar/Incluir forms; `'Fechar'` for related-action sub-windows; `'Concluir'`/`'Finalizar'` for wizard endings; never `'Sair'` without verifying on the real screen
- [ ] `CheckResult` uses technical names (`'A1_COD'`) only for the routine's own form; uses **screen labels** (`'Cliente'`, `'Nome'`) for secondary screens whose model alias is unknown — do NOT guess aliases
- [ ] When a test validates "screen X opened", assert content (child record via `SearchBrowse`, specific field via `CheckResult`) — `WaitShow` alone is not enough
- [ ] `CheckHelp(text_help=..., button=...)` for error dialogs
- [ ] `LoadGrid()` called after grid `SetValue` operations

**TESTSUITE file (`{ROUTINE}TESTSUITE.py`):**
- [ ] File named `{ROUTINE}TESTSUITE.py`
- [ ] `import unittest` present
- [ ] `from {ROUTINE}TESTCASE import {ROUTINE}` present
- [ ] `suite = unittest.TestSuite()` created
- [ ] `suite.addTest({ROUTINE}('test_{ROUTINE}_CT00N'))` for each test method
- [ ] `runner = unittest.TextTestRunner(verbosity=2)` present
- [ ] `runner.run(suite)` present

**Both files:**
- [ ] No placeholder tokens like `{ROUTINE}`, `{VALUE}`, `{FIELD}` remaining
- [ ] No `AssertTrue(value, msg)` with parameters — TIR does not accept parameters

---

## Related Skills

| Skill | When to Use Instead |
|-------|-------------------|
| `mvc-generator` | Creating MVC routines (the screens being tested) |
| `tlpp-rest-endpoint-generator` | Creating REST endpoints |
