# SonarQube Rules Reference — AdvPL/TLPP

Central reference for all SonarQube rules applicable to skills that generate or review AdvPL/TLPP code.

Source URL: `https://sonar-rules.engpro.totvs.com.br`.

---

## G1 — Security

| Rule | Title | Severity | Prohibited API/Pattern | Required Alternative |
|------|-------|----------|----------------------|---------------------|
| BG1000 | Environment context switch in REST/SOAP services | MAJOR | `RpcSetEnv`, `RpcSetType` in REST/SOAP functions | Configure REST Server `PrepareIn` and Webservice environments |
| CA2022 | Restricted function: StaticCall | CRITICAL | `StaticCall()` | `FWLoadModel()`, `FWLoadMenuDef()`, direct namespace calls |
| CA2023 | Restricted function: PTInternal | CRITICAL | `PTInternal()` | N/A — prohibited without exception |
| CA2024 | Prohibited assignment: __cUserID | CRITICAL | `__cUserID := ...` | Never assign — read-only system variable |
| CA2025 | Prohibited assignment: cEmpAnt | CRITICAL | `cEmpAnt := ...` | Never assign — use environment APIs |
| CA2050 | SQL Injection | INFO* | Concatenating user input in SQL strings | `FWExecStatement` |
| CA2051 | SQL Injection Embedded | INFO* | Concatenating user input in Embedded SQL | `FWExecStatement` |
| CA2052 | Exposed password in source code | INFO* | Hardcoded credentials | Use environment variables or AppServer configuration |
| CA2053 | Procedure created directly in source | CRITICAL | `CREATE PROCEDURE` in AdvPL/TLPP source | Use SPManager for procedure management |
| BG1200 | ErrorBlock override | INFO | `ErrorBlock({...})` | `Try-Catch` (TLPP) |

> *CA2050, CA2051, CA2052 are classified as INFO in SonarQube but represent high-impact vulnerabilities.

---

## G2 — Performance and Loops

| Rule | Title | Severity | Prohibited API/Pattern | Required Alternative |
|------|-------|----------|----------------------|---------------------|
| CA1002 | UI API in transaction | MAJOR | `MsgAlert()`, `MsgYesNo()`, `MsgInfo()`, `Aviso()`, `Help()`, `Pergunte()`, `ParamBox()` inside `Begin Transaction`/`End Transaction` or MVC commit handlers | Move UI calls outside transaction scope |
| CA1003 | Prohibited API in loop | MAJOR | `GetMV()`, `SuperGetMV()`, `ExistBlock()`, `AllUsers()` inside `While`/`For`/`Do While` | Cache result before loop |
| CA1003-2 | API in loop under review | MAJOR | `Type()`, `Pergunte()` inside loops | Cache result before loop |
| CS1000 | Direct query in AdvPL/TLPP | MAJOR | Raw SQL queries without evaluation | Evaluate Cloud impact; prefer framework APIs where available |

---

## G3 — Legacy and Deprecated Code

| Rule | Title | Severity | Prohibited API/Pattern | Required Alternative |
|------|-------|----------|----------------------|---------------------|
| CA1000 | ISAM driver access | MAJOR | `MSCREATE()`, `DBCREATE()`, `CRIATRAB(.T.)`, `COPY TO` | `FWTemporaryTable` with relational mode |
| CA1001 | Disk exclusive lock | MAJOR | File-based semaphores, exclusive file lock | `LockByName()` |
| CA1001-2 | SmartERP shared filesystem offender | MAJOR | Shared filesystem operations | Use database or network semaphores |
| CA1004 | Console API prohibited | MINOR | `ConOut()`, `CONOUT()`, `OutErr()`, `?` statement | `FWLogMsg()` |
| CA1006/CA2020 | Deprecated function/class | MINOR | `AllUsers()` | `FWSFALLUSERS()` |
| CA2014 | PutSX1 deprecated | INFO | `PutSX1()` | Standard SX1 API |
| CA2015 | FormCommit override | INFO | Overriding `FormCommit` method directly | `FWModelEvent` for commit interception; `FWFormCommit(oModel)` for standard commit |
| CA2017-CA2019 | Prohibited SPF/binary APIs | CRITICAL | SPF table access, binary read/write functions | Framework APIs |
| BG1100 | Deprecated functions (generic) | INFO | Various deprecated functions | See function-specific documentation |
| CA4000 | IIF prohibited (clean code) | INFO | `IIF()`, `IF()` inline ternary | `If/Else/EndIf` block |
| CA3001 | Include must be lowercase | MINOR | `#INCLUDE "TOTVS.CH"` | `#include "totvs.ch"` |
| CA3002 | Incorrect inheritance | MINOR | `LongClassName` in class inheritance | `LongNameClass` |

---

## G4 — Metadata (Direct Access Prohibited)

Direct access to Protheus system tables (SX*) via `DbSelectArea` is prohibited. Use framework APIs.

| Rule | Table | Severity | Required API |
|------|-------|----------|-------------|
| CA2000 | SM0 (Companies) | CRITICAL | Standard company APIs |
| CA2001/CA2001-2 | SIX (Indexes) | CRITICAL/MINOR | Standard index APIs (indirect access) |
| CA2002/CA2002-2 | SX1 (Parameters/Pergunte) | CRITICAL/MINOR | `Pergunte()` |
| CA2003/CA2003-2 | SX2 (Tables) | CRITICAL/MINOR | `RetSqlName()`, `X2Nome()` |
| CA2004/CA2004-2 | SX3 (Fields) | CRITICAL/MINOR | `FWSX3Util()`, `FWFormStruct()` |
| CA2005/CA2005-2 | SX7 (Triggers) | CRITICAL/MINOR | Standard trigger APIs (indirect) |
| CA2006/CA2006-2 | SX9 (Relationships) | CRITICAL/MINOR | Standard relationship APIs (indirect) |
| CA2007 | SXA (Folders) | CRITICAL | Standard folder APIs (indirect) |
| CA2008/CA2008-2 | SXB (Validations) | CRITICAL/MINOR | Standard validation APIs (indirect) |
| CA2009/CA2009-2 | SX5 (Lookup Tables) | MAJOR/MINOR | Standard SX5 APIs |
| CA2010/CA2010-2 | SX6 (System Parameters) | MAJOR/MINOR | `GetMV()` / `SuperGetMV()` |
| CA2011/CA2011-2 | SXG (Sequences) | CRITICAL/MINOR | Standard sequence APIs |
| CA2012/CA2012-2 | SXD (Scheduler) | MAJOR/MINOR | `SchedDef` |
| CA2013 | SX8-SXZ, XX?, SPF | CRITICAL | Framework APIs |
| CA2021 | SE5 (Cash Movements) | MAJOR | `FKx` family + `ExecAuto` |

---

## G5 — Compilation / Clean Code

| Rule | Title | Severity | Description |
|------|-------|----------|-------------|
| CA0000 | Compilation error | MAJOR | Invalid syntax, wrong charset (use Windows-1252), invalid block closure |
| CA1005 | INI references (SmartERP) | MINOR | References to INI files need evaluation for Cloud compatibility |
| CA2016 | Log/error without I18N | MINOR | Error messages and logs should use internationalization strings |
