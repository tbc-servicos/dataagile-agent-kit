# TIR Setup and Best Practices

## Three Required Files

Every TIR test project requires **three files**:

| File | Required | Description |
|------|----------|-------------|
| `{ROUTINE}TESTCASE.py` | ✅ | Test class with `unittest.TestCase`, `setUpClass`, test methods, `tearDownClass` |
| `{ROUTINE}TESTSUITE.py` | ✅ | Runner: imports TESTCASE, builds `unittest.TestSuite`, executes with `TextTestRunner` |
| `config.json` | ✅ | Environment configuration — URL, browser, credentials, environment name |

**Without `config.json` in the same directory, TIR cannot connect to Protheus.**

---

## config.json — Complete Reference

The `config.json` file must be placed in the same directory as the test scripts (or its path passed to the class constructor).

### Webapp (MVC/Legacy) — Minimal config.json

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

### Poui — config.json with POUI parameters

```json
{
    "Url": "http://{server}:{port}/",
    "Browser": "Chrome",
    "Environment": "{environment_name}",
    "User": "{username}",
    "Password": "{password}",
    "Language": "pt-br",
    "POUI": true,
    "POUILogin": true
}
```

> **Critical for PO-UI tests**: `"POUI": true` enables the PO-UI interface mode. Without this, TIR will try to interact with the legacy SmartClient interface instead of the PO-UI rendered by PO-UI.

### Required Parameters

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `Url` | str | The URL that will run the tests | `"http://localhost:8080/"` |
| `Browser` | str | Browser: `Firefox` or `Chrome` | `"Chrome"` |
| `Environment` | str | Target Protheus environment name | `"ENVIRONMENT"` |
| `User` | str | Username to login | `"admin"` |
| `Password` | str | User password | `"admin"` |
| `Language` | str | Language: `pt-br`, `en-us`, `es-es` | `"pt-br"` |

### POUI Interface Parameters

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `POUI` | bool | **Enable PO-UI interface mode** | `false` |
| `POUILogin` | bool | Enable when `APPENVIRONMENT` key is active in the environment using POUI login interface. **Deprecated** in >= 12.1.2510 | `false` |
| `SSOLogin` | bool | Enable when SSO login is configured — skips login screen | `false` |

### Additional Parameters

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `Headless` | bool | Run browser without visible window | `false` |
| `DebugLog` | bool | Show debug logs during execution | `false` |
| `ScreenShot` | bool | Save screenshots on errors | `true` |
| `ScreenshotFolder` | str | Path for screenshots | Current path |
| `TimeOut` | int | Seconds before test expires | `90` |
| `SkipEnvironment` | bool | Skip module selection screen | `false` |
| `StartProgram` | str | Start test directly in program URL | `"SIGAFAT"` |
| `Country` | str | Country code for log | `"BRA"` |

### Chrome-specific Parameters

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `ChromeDriverAutoInstall` | bool | Automatically install ChromeDriver | `false` |
| `SSLChromeInstallDisable` | bool | Disable SSL for driver download | `false` |

### Logging Parameters

| Key | Type | Description |
|-----|------|-------------|
| `NewLog` | bool | Enable new JSON API log |
| `MotExec` | str | Identifier log tag (e.g., `"HOMOLOG_TIR"`) |
| `LogFolder` | str | Folder to save log files |
| `LogUrl1` | str | URL/API to send execution logs |

### Database Parameters (optional — for `QueryExecute`)

| Key | Type | Description |
|-----|------|-------------|
| `DBDriver` | str | ODBC driver name |
| `DBServer` | str | Database host address |
| `DBPort` | str | Database port (default: `1521`) |
| `DBName` | str | Database name |
| `DBUser` | str | Database user |
| `DBPassword` | str | Database password |

---

## Two-File Structure

Every TIR test project requires two Python files:

- **`{ROUTINE}TESTCASE.py`** — the test class (never run directly in CI)
- **`{ROUTINE}TESTSUITE.py`** — the runner (this is what CI/CD executes)

The TESTSUITE imports the TESTCASE and selects which test methods to run via `suite.addTest()`. This allows running a subset of tests without modifying the TESTCASE file.

---

## Best Practices

### Webapp vs Poui Selection

- Use `Webapp` for **MVC/legacy** routines (ModelDef/ViewDef/MenuDef, MBrowse, AxCadastro)
- Use `Poui` for **PO-UI native** routines (files with `totvs.framework.structure` classes)
- Set `"POUI": true` in `config.json` when using the `Poui` class

### Test Independence
- Each `test_` method should be independent of other tests
- Use `setUpClass` for environment configuration only — not for creating test data
- If tests have data dependencies (e.g., CT002 edits what CT001 created), document this clearly and ensure test execution order via naming convention (`test_CT001`, `test_CT002`)
- Python's `unittest` runs methods in alphabetical order by default — use `CT001`, `CT002` naming to control order

### Naming Conventions
- TESTCASE file: `{ROUTINE}TESTCASE.py` (e.g., `MATA010TESTCASE.py`)
- TESTSUITE file: `{ROUTINE}TESTSUITE.py` (e.g., `MATA010TESTSUITE.py`)
- config.json: always `config.json` in the same directory
- Test class: Same as routine name (e.g., `MATA010`)
- Test methods: `test_{ROUTINE}_CT{NNN}` (e.g., `test_MATA010_CT001`)
- Docstrings on each test method describing the scenario

### Branch Handling (Webapp only)
- Call `SetBranch('{BRANCH}')` after `SetButton('Incluir')` when the branch selection dialog appears
- The branch format in `SearchBrowse` must match exactly — use spaces for padding (e.g., `'D MG 01 '`)
- The `Setup()` branch parameter and the `SearchBrowse` branch prefix must be consistent

### Screen Interactions (Webapp)
- Always call `LoadGrid()` after `SetValue` on grid cells to ensure values are applied
- Use `SearchBrowse(term, key='Filial+{Column}')` with `key=` as a named parameter
- The `key` value must match the browse column header exactly (e.g., `'Filial+codigo + Loja'`)
- Handle unexpected dialogs with `CheckHelp` or `MessageBoxClick`
- Use `WaitProcessing` when operations trigger server-side processing
- Use `SetButton('Cancelar')` to close forms after Visualizar
- Use `SetButton('Não')` or `SetButton('Sim')` to handle confirmation dialogs after Salvar

### Screen Interactions (Poui / PO-UI)
- Use `InputValue(field, value)` to fill `po-input` fields
- Use `ClickButton(button)` to click PO-UI buttons
- Use `ClickTable(columns=..., values=..., click_cell=...)` to interact with table rows
- Use `POtabs(label=...)` to switch tabs
- Use `WaitShow(string)` / `WaitHide(string)` for async operations
- Use `CheckResult(field, value, 'po-input')` — always specify the PO component type

### Assertions
- End positive tests with `self.oHelper.AssertTrue()` — **NO parameters**
- End negative tests (expected errors) with `self.oHelper.AssertFalse()` — **NO parameters**
- Use `CheckResult` before `AssertTrue` to validate specific field values

### Environment Isolation
- Use a dedicated Protheus environment for TIR execution
- Ensure test data doesn't interfere with other testing or development
- Use unique test data values (e.g., prefix with `'TIR'` or `'AUT'`) to avoid conflicts

### TESTSUITE Best Practices
- Add only the tests you want to run in the current suite — not necessarily all tests
- Order matters: add tests in the sequence they should execute
- For CI/CD, the TESTSUITE is the entry point — never run TESTCASE directly in automation
