# Code Quality Patterns — Performance, Legacy, Metadata, Compilation

Detailed code examples and tables for performance (G2), legacy/deprecated (G3), metadata access (G4), and compilation (G5) review findings.

---

## G2 — Performance and Loops

### Prohibited APIs Inside Loops (CA1003) — MAJOR

```advpl
// BAD: GetMV called inside loop — repeated dictionary lookup
While !Eof()
  cParam := GetMV("MV_ESTADO")
  // ... process record ...
  dbSkip()
EndDo

// GOOD: Cache before the loop
Local cParam := GetMV("MV_ESTADO") as Character
While !Eof()
  // ... use cParam ...
  dbSkip()
EndDo
```

**Prohibited inside loops:** `GetMV()`, `SuperGetMV()`, `ExistBlock()`, `AllUsers()`, `Type()`, `Pergunte()`

### UI APIs Inside Transactions (CA1002) — MAJOR

```advpl
// BAD: MsgAlert inside transaction blocks the database lock
Begin Transaction
  // ... database operations ...
  If lError
    MsgAlert("Error!")  // Prohibited — holds transaction lock
  EndIf
End Transaction

// GOOD: Collect errors, show UI after transaction
Local cError := "" as Character
Begin Transaction
  // ... database operations ...
  If lError
    cError := "Error in processing"
    DisarmTransaction()
  EndIf
End Transaction

If !Empty(cError)
  MsgAlert(cError)
EndIf
```

**Prohibited inside transactions:** `MsgAlert()`, `MsgYesNo()`, `MsgInfo()`, `Aviso()`, `Help()`, `Pergunte()`, `ParamBox()`

### Direct SQL Without Evaluation (CS1000) — MAJOR

Raw SQL queries should be evaluated for Cloud compatibility. Prefer framework APIs where available. When SQL is necessary, use `ChangeQuery()` or `BeginSQL/EndSQL` for dialect portability.

---

## G3 — Legacy and Deprecated Code

### ISAM Driver Access (CA1000) — MAJOR

```advpl
// BAD: Legacy ISAM temporary table creation
MSCREATE("TMPFILE", aStruct)

// GOOD: Modern relational temporary table
Local oTempTable := FWTemporaryTable():New("TMPFILE")
oTempTable:SetFields(aStruct)
oTempTable:Create()
// ... use table ...
oTempTable:Delete()
```

### Console Output (CA1004) — MINOR

```advpl
// BAD: Console output functions
ConOut("Processing order: " + cOrder)

// GOOD: Structured logging
FWLogMsg("INFO", , "MYMODULE", "ProcOrder", , , "Processing order: " + cOrder, , , )
```

### IIF/IF Inline (CA4000) — INFO

```advpl
// BAD: Inline ternary — harder to debug and test
cStatus := IIF(lActive, "Active", "Inactive")

// GOOD: Explicit conditional block
If lActive
  cStatus := "Active"
Else
  cStatus := "Inactive"
EndIf
```

### Other Deprecated Patterns

| Rule          | Pattern                                     | Severity | Replacement                             |
| ------------- | ------------------------------------------- | -------- | --------------------------------------- |
| CA1001        | File-based semaphores / disk exclusive lock | MAJOR    | `LockByName()`                          |
| CA1006/CA2020 | `AllUsers()`                                | MINOR    | `FWSFALLUSERS()`                        |
| CA2014        | `PutSX1()`                                  | INFO     | Standard SX1 API                        |
| CA2015        | Overriding `FormCommit` directly            | INFO     | `FWModelEvent` / `FWFormCommit(oModel)` |
| CA3001        | `#INCLUDE "TOTVS.CH"` (uppercase)        | MINOR    | `#include "totvs.ch"`                |
| CA3002        | Incorrect inheritance naming                | MINOR    | Use `LongNameClass` format              |
| BG1100        | Various deprecated functions                | INFO     | See function-specific docs              |

### Obsolete Include Directives

Legacy include files must be replaced with `totvs.ch`:

| Obsolete Include | Replacement | Modern Class/API |
| --- | --- | --- |
| `Ap5Mail.ch` | `totvs.ch` | `TMailMessage()` |
| `ApWizard.ch` | `totvs.ch` | `FWWizardControl()` |
| `FileIO.ch` | `totvs.ch` | `FWFileWriter()` / `FWFileReader()` |
| `Font.ch` | `totvs.ch` | `TFont()` |
| `ParmType.ch` | `totvs.ch` | `Default` prefix |
| `protheus.ch` | `totvs.ch` | — |
| `RWMake.ch` | `totvs.ch` | — |

---

## G4 — Metadata Access

Direct `DbSelectArea` on Protheus system tables (SX\*) is **prohibited**. Always use framework APIs.

| Table                | Rule                 | Severity | Required API                    |
| -------------------- | -------------------- | -------- | ------------------------------- |
| SM0 (Companies)      | CA2000               | CRITICAL | Standard company APIs           |
| SIX (Indexes)        | CA2001               | CRITICAL | Standard index APIs             |
| SX1 (Parameters)     | CA2002               | CRITICAL | `Pergunte()`                    |
| SX2 (Tables)         | CA2003               | CRITICAL | `RetSqlName()`, `X2Nome()`      |
| SX3 (Fields)         | CA2004               | CRITICAL | `FWSX3Util()`, `FWFormStruct()` |
| SX5 (Lookup Tables)  | CA2009               | MAJOR    | Standard SX5 APIs               |
| SX6 (System Params)  | CA2010               | MAJOR    | `GetMV()` / `SuperGetMV()`      |
| SX7 (Triggers)       | CA2005               | CRITICAL | Standard trigger APIs           |
| SX9 (Relationships)  | CA2006               | CRITICAL | Standard relationship APIs      |
| SXA (Folders)        | CA2007               | CRITICAL | Standard folder APIs            |
| SXB (Validations)    | CA2008               | CRITICAL | Standard validation APIs        |
| SXG (Sequences)      | CA2011               | CRITICAL | Standard sequence APIs          |
| SXD (Scheduler)      | CA2012               | MAJOR    | `SchedDef`                      |
| SE5 (Cash Movements) | CA2021               | MAJOR    | `FKx` family + `ExecAuto`       |
| SX8-SXZ, XX?, SPF    | CA2013/CA2017-CA2019 | CRITICAL | Framework APIs                  |

```advpl
// BAD: Direct access to SX3 dictionary table
DbSelectArea("SX3")
DbSetOrder(1)
DbSeek("SA1" + "A1_COD")
cTitle := SX3->X3_TITULO

// GOOD: Use framework API
cTitle := FWSX3Util():GetFieldTitle("SA1", "A1_COD")
```

---

## G5 — Compilation and Encoding

| Check               | Rule   | Severity | Description                         |
| ------------------- | ------ | -------- | ----------------------------------- |
| Syntax errors       | CA0000 | MAJOR    | Invalid syntax, wrong block closure |
| File encoding       | CA0000 | MAJOR    | Must be Windows-1252 (not UTF-8)    |
| INI references      | CA1005 | MINOR    | Evaluate Cloud compatibility        |
| I18N in logs/errors | CA2016 | MINOR    | Use internationalization strings    |
