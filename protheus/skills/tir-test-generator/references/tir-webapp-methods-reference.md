# TIR Webapp Key Methods Reference

## Setup & Lifecycle

| Method | Description | Parameters |
|--------|-------------|------------|
| `Webapp()` | Creates a new TIR Webapp instance | — |
| `Setup(initial_program, date='', group='99', branch='01', module='')` | Configures the Protheus session | `initial_program`: module code (e.g., `'SIGAFAT'`); `date`: date string; `group`: user group (default `'99'`); `branch`: branch code (default `'01'`); `module`: initial module (optional) |
| `Program(cRoutine)` | Opens a specific routine | `cRoutine`: routine name (e.g., `'MATA010'`) |
| `TearDown()` | Closes the session and collects results | — |
| `Finish()` | Alternative session closer | — |

## Field Interaction

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `SetValue(field, value, grid=False, grid_number=1, row=None, check_value=True, name_attr=False, direction=None)` | Sets a field value on screen | `field`: field label or name; `value`: value to set; `grid`: True for grid fields; `grid_number`: which grid (default 1); `row`: row number; `check_value`: verify after set (default True) |
| `SetValue(field, value, grid=True, grid_number=N, row=N)` | Sets a grid cell value | Use `grid=True`, `grid_number` and `row` for grid cells. Always call `LoadGrid()` after. |
| `GetValue(cField)` | Returns the current field value | `cField`: field label or name |
| `SetButton(cButton)` | Clicks a button by label | `cButton`: button text (e.g., `'Incluir'`, `'Salvar'`, `'Confirmar'`) |
| `SetButton(cButton, sub_item=cSub)` | Clicks a menu button with sub-item | `cButton`: main button; `cSub`: sub-item text |
| `SetKey(cKey, grid=False, grid_number=1)` | Sends a keyboard key | `cKey`: key name (`'ENTER'`, `'DOWN'`, `'F12'`, `'DELETE'`, etc.) |

## Browse & Navigation

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `SearchBrowse(term, key=None, column=None, identifier=None, index=False, filters=[])` | Searches for a record in the browse grid | `term`: search value; `key`: search key name (e.g., `'Filial+codigo + Loja'`); `column`: search column name; `identifier`: search box identifier; `filters`: list of dicts for pre-filtering |
| `ClickFolder(cFolder)` | Clicks a folder/tab on screen | `cFolder`: tab label (e.g., `'Complementos'`) |
| `SetLateralMenu(cItem)` | Clicks a lateral menu item | `cItem`: menu item text |
| `ClickTree(cItem)` | Clicks a tree node | `cItem`: node text |

## Grid Operations

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `ClickGridCell(cColumn, row=N, grid_number=N)` | Clicks a specific grid cell | `cColumn`: column header; `row`: row number; `grid_number`: grid index |
| `ClickGridHeader(cColumn, grid_number=N)` | Clicks a grid column header | `cColumn`: column text |
| `LoadGrid()` | Reloads/refreshes the grid data | — |
| `ScrollGrid(cColumn, match_value=cVal, grid_number=N)` | Scrolls grid to find a value | `cColumn`: column; `match_value`: value to find |
| `LengthGridLines(grid_number=N)` | Returns the number of grid rows | `grid_number`: which grid |
| `ClickBox(cField, cValue, select_all=False, grid_number=N)` | Clicks checkbox in a grid row | `cField`: column; `cValue`: matching value |
| `ClickCheckBox(cLabel)` | Clicks a standalone checkbox | `cLabel`: checkbox label |

## Assertions & Validation

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `CheckResult(cField, xExpected)` | Asserts a field value equals expected | `cField`: field name; `xExpected`: expected value |
| `CheckResult(cField, xExpected, grid=True, line=N, grid_number=N)` | Asserts a grid cell value | Additional grid parameters |
| `CheckHelp(text_help=cText, button=cBtn)` | Validates a help/error message and clicks button | `text_help`: expected help ID; `button`: button to click |
| `AssertTrue()` | Asserts no errors occurred in the test | — |
| `AssertFalse()` | Asserts that errors were expected (negative test) | — |
| `WaitFieldValue(cField, xValue)` | Waits until a field has a specific value | `cField`: field; `xValue`: expected value |
| `WaitShow(cTitle)` | Waits for a screen/dialog to appear | `cTitle`: window title |
| `WaitHide(cTitle)` | Waits for a screen/dialog to disappear | `cTitle`: window title |
| `WaitProcessing(cMessage)` | Waits for a processing screen to finish | `cMessage`: processing message |

## Dialog Handling

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `MessageBoxClick(cMessage, cButton)` | Handles a message box dialog | `cMessage`: expected message; `cButton`: button to click |
| `SetCalendar(cField, cDate)` | Sets a calendar/date picker field | `cField`: field label; `cDate`: date string |
| `SetFilePath(cPath)` | Sets a file path in a file dialog | `cPath`: file path |

## Parameters & Configuration

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `SetParameters(aParams)` | Sets multiple parameters at once | `aParams`: list of parameter tuples |
| `AddParameter(cParamName, cBranch, cType, cContent, cContent2)` | Adds an individual parameter | Various parameter attributes |
| `RestoreParameters()` | Restores original parameter values | — |
| `SetBranch(cBranch)` | Changes the current branch | `cBranch`: branch code |
| `ChangeEnvironment(cEnv, cDate, cGroup, cBranch)` | Changes the full environment | All environment fields |

---

## Poui Class — PO-UI Screens

Use `from tir import Poui` when testing **PO-UI native routines** (routines with `totvs.framework.structure` classes). The `Poui` class has different methods from `Webapp` — it maps to PO-UI components.

### Setup & Lifecycle

| Method | Description | Parameters |
|--------|-------------|------------|
| `Poui(config_path='', autostart=True)` | Creates a new TIR Poui instance | — |
| `Setup(initial_program, date='', group='99', branch='01', module='')` | Configures the Protheus session | Same signature as `Webapp.Setup()` |
| `Program(program_name)` | Opens a specific routine (only when initial program is a module like SIGAFAT) | `program_name`: routine name |
| `TearDown()` | Closes the webdriver and ends the test case | — |

### Field Interaction

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `InputValue(field, value, position=1)` | Fills a `po-input` component | `field`: input label; `value`: value to set |
| `ClickButton(button, position=1)` | Clicks a `po-button` component | `button`: button label (e.g., `'Novo'`, `'Salvar'`, `'Cancelar'`) |
| `ClickCombo(field, value, position=1)` | Selects a value in a `po-combo` | `field`: combo label; `value`: option to select |
| `ClickSelect(field, value, position=1)` | Selects a value in a `po-select` | `field`: select label; `value`: option to select |
| `ClickCheckBox(label)` | Checks/unchecks a `po-checkbox` | `label`: checkbox label |
| `ClickSwitch(label, value=True, position=1)` | Toggles a `po-switch` | `label`: switch label; `value`: True/False |
| `ClickLookUp(label, search_value='')` | Opens and searches a `po-lookup` | `label`: lookup field label; `search_value`: value to search |

### Navigation & Browse

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `POtabs(label)` | Clicks a tab in `po-tabs` | `label`: tab label name |
| `POSearch(content, placeholder='')` | Fills the `po-page-dynamic-search` component | `content`: search term |
| `FilterBrowse(filters)` | Fills POUI filter/browse with filters | `filters`: list of dicts `[{'Field': 'value'}]` |
| `ClickMenu(menu_item)` | Clicks a `po-menu` item | `menu_item`: menu item name |
| `ClickDropdown(label, subitems='', position=1)` | Clicks a `po-dropdown` and optionally a subitem | `label`: dropdown label; `subitems`: subitem text |

### Table Interaction

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `ClickTable(columns, values, click_cell=None, checkbox=None, table_number=1, match_all=False)` | Interacts with a `po-table` row | `columns`: column name(s); `values`: value(s) to match; `click_cell`: column to click; `checkbox`: True/False to toggle |

**Examples:**
```python
# Click 'Editar' action in row where Código = '000001'
self.oHelper.ClickTable(columns='Código', values='000001', click_cell='Editar')

# Filter by multiple columns
self.oHelper.ClickTable(columns=['Código', 'Nome'], values=['000001', 'Test'], click_cell='Excluir')

# Toggle checkbox in row
self.oHelper.ClickTable(columns='Código', values='000001', checkbox=True)
```

### Assertions & Validation

| Method | Description | Key Parameters |
|--------|-------------|----------------|
| `CheckResult(field, user_value, po_component='po-input', position=1)` | Checks a field value in a PO-UI component | `field`: field/label; `user_value`: expected value; `po_component`: PO component type (e.g., `'po-input'`, `'po-select'`) |
| `AssertTrue()` | Asserts no errors occurred | — (no parameters) |
| `AssertFalse()` | Asserts errors were expected | — (no parameters) |
| `WaitShow(string, timeout=None)` | Waits for a string/element to appear | `string`: text to wait for |
| `WaitHide(string, timeout=None)` | Waits for a string/element to disappear | `string`: text to wait for |
| `WaitProcessing(itens, timeout=None)` | Waits for a processing screen | `itens`: processing message |
| `IfExists(string, timeout=5)` | Returns True if element exists | `string`: element text; `timeout`: seconds |

### Key Differences: Webapp vs Poui

| Action | Webapp | Poui |
|--------|--------|------|
| Fill a field | `SetValue('Label', 'value')` | `InputValue('Label', 'value')` |
| Click a button | `SetButton('Salvar')` | `ClickButton('Salvar')` |
| Switch tab | `ClickFolder('Tab')` | `POtabs(label='Tab')` |
| Select combo | `SetValue('Field', 'Option')` | `ClickCombo('Field', 'Option')` |
| Search browse | `SearchBrowse(term, key='...')` | `ClickTable(columns='...', values='...')` |
| Check field | `CheckResult('FIELD', 'value')` | `CheckResult('Field', 'value', 'po-input')` |
| Error dialog | `CheckHelp(text_help='...', button='...')` | `WaitShow('message')` |
| Set branch | `SetBranch('D MG 01')` | Not needed (PO-UI handles branch) |
