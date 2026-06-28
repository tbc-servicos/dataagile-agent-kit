# Security Review Patterns (SonarQube G1)

Detailed code examples and tables for security-related code review findings.

---

## SQL Injection (CA2050 / CA2051) — CRITICAL

```advpl
// BAD: Concatenating user input into SQL — SQL Injection risk
cQuery := "SELECT * FROM " + RetSqlName("SA1") + " WHERE A1_COD = '" + cCodCli + "'"
dbSelectArea("SA1")
dbSetQuery(cQuery)

// GOOD: Use FWExecStatement to prevent injection (cached prepared statement with DB-side bind)
Local cQuery   := "SELECT A1_COD, A1_NOME FROM " + RetSqlName("SA1") + ;
                  " WHERE D_E_L_E_T_ = ? AND A1_FILIAL = ? AND A1_COD = ?" as Character
Local oStatement := FWExecStatement():New(ChangeQuery(cQuery)) as Object
Local cAlias as Character

oStatement:SetString(1, ' ')
oStatement:SetString(2, FWxFilial("SA1"))
oStatement:SetString(3, cCodCli)

cAlias := oStatement:OpenAlias()    // executes with DB-side bind via TCGenQry2
// ... consume (cAlias)->A1_COD / A1_NOME ...
(cAlias)->(DBCloseArea())
oStatement:Destroy()
```

> `FWExecStatement` (lib `20211116`+) extends `FWPreparedStatement` and adds DBAccess query cache. Use `:ExecScalar(cColumn)` for single-value SELECTs and `TCSqlExec(:GetFixQuery())` for DML (UPDATE/INSERT/DELETE). Never use `:SetUnsafe()` with user-controlled input.

---

## Hardcoded Credentials (CA2052) — CRITICAL

```advpl
// BAD: Password exposed in source code
cPassword := "admin123"

// GOOD: Use environment configuration
cPassword := GetMV("XX_SRVPASS")
```

---

## Environment Context in REST/SOAP (BG1000) — MAJOR

```advpl
// BAD: Manual RpcSetEnv inside REST service
@Get("/api/customers")
User Function GetCust()
  RpcSetEnv("T1", "M SP 01")  // Prohibited in REST
  // ...
Return

// GOOD: Configure PrepareIn on REST Server
// appserver.ini: [HTTPREST] > PrepareIn=T1,M SP 01
```

---

## Restricted / Prohibited Functions

| Rule   | Function            | Severity | Action                                                                    |
| ------ | ------------------- | -------- | ------------------------------------------------------------------------- |
| CA2022 | `StaticCall()`      | CRITICAL | Replace with `FWLoadModel()`, `FWLoadMenuDef()`, or direct namespace call |
| CA2023 | `PTInternal()`      | CRITICAL | Remove — prohibited without exception                                     |
| CA2024 | `__cUserID := ...`  | CRITICAL | Never assign — read-only system variable                                  |
| CA2025 | `cEmpAnt := ...`    | CRITICAL | Never assign — use environment APIs                                       |
| CA2053 | `CREATE PROCEDURE`  | CRITICAL | Use SPManager for procedure management                                    |
| BG1200 | `ErrorBlock({...})` | INFO     | Migrate to `Try-Catch` (TLPP)                                             |
