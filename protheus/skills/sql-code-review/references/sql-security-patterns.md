# SQL Security Patterns

## SQL Injection Prevention

```sql
-- ❌ CRITICAL: SQL Injection vulnerability
query = "SELECT * FROM users WHERE id = " + userInput;
query = f"DELETE FROM orders WHERE user_id = {user_id}";

-- ✅ SECURE: Parameterized queries
-- PostgreSQL (ANSI SQL)
PREPARE stmt FROM 'SELECT * FROM users WHERE id = ?';
EXECUTE stmt USING @user_id;

-- SQL Server
EXEC sp_executesql N'SELECT * FROM users WHERE id = @id', N'@id INT', @id = @user_id;
```

## Access Control & Permissions

- **Principle of Least Privilege**: Grant minimum required permissions
- **Role-Based Access**: Use database roles instead of direct user permissions
- **Schema Security**: Proper schema ownership and access controls
- **Function/Procedure Security**: Review DEFINER vs INVOKER rights

### Examples

```sql
-- ❌ BAD: Over-permissioned
GRANT ALL PRIVILEGES ON database.* TO 'app_user'@'%';

-- ✅ GOOD: Principle of least privilege
GRANT SELECT, INSERT, UPDATE ON database.orders TO 'order_service'@'app-server';
GRANT SELECT ON database.products TO 'order_service'@'app-server';
```

## Data Protection

- **Sensitive Data Exposure**: Avoid SELECT * on tables with sensitive columns
- **Audit Logging**: Ensure sensitive operations are logged
- **Data Masking**: Use views or functions to mask sensitive data
- **Encryption**: Verify encrypted storage for sensitive data

### Examples

```sql
-- ❌ BAD: Exposing sensitive data
SELECT * FROM users;  -- includes password_hash, ssn, etc.

-- ✅ GOOD: Select only needed columns, mask sensitive data
SELECT id, name, email,
       CONCAT('***-**-', RIGHT(ssn, 4)) AS masked_ssn
FROM users;

-- ✅ GOOD: Use a view to enforce data masking
CREATE VIEW public_users AS
SELECT id, name, email
FROM users;
```

## Security Review Patterns

### Dynamic SQL Review

When reviewing dynamic SQL, flag these patterns:

| Pattern | Risk Level | Issue |
| --- | --- | --- |
| String concatenation with user input | **CRITICAL** | Direct SQL injection |
| `EXEC(@sql)` without parameterization | **HIGH** | SQL injection via dynamic SQL |
| `SELECT *` on tables with sensitive columns | **MEDIUM** | Data exposure |
| Missing `WHERE` clause on `UPDATE`/`DELETE` | **HIGH** | Accidental data loss |
| Hardcoded credentials in SQL scripts | **CRITICAL** | Credential exposure |
| `GRANT ALL` or over-broad permissions | **MEDIUM** | Excessive privilege |

### Parameterization Checklist

- [ ] All user-supplied values use bind parameters
- [ ] Dynamic table/column names are validated against a whitelist
- [ ] Stored procedures use `sp_executesql` (SQL Server) or `EXECUTE ... USING` (PostgreSQL) for dynamic SQL
- [ ] No string interpolation (`f"..."`, `"..." + var`, `CONCAT(...)`) builds WHERE/ORDER clauses from user input

## Protheus Parameterization with FWExecStatement

In Protheus (AdvPL/TLPP), the canonical way to parameterize SQL is `FWExecStatement` (lib `20211116`+). It extends `FWPreparedStatement` and binds parameters at the database side via `TCGenQry2`, also enabling DBAccess query cache.

```advpl
// ❌ BAD: User input concatenated — SQL injection
cQuery := "SELECT A1_NOME FROM " + RetSqlName("SA1") + ;
          " WHERE A1_FILIAL = '" + FWxFilial("SA1") + "'" + ;
          " AND A1_COD = '" + cUserInput + "'"
TCQuery cQuery New Alias "QRY"

// ✅ GOOD: FWExecStatement with bind parameters
Local cQuery := "SELECT A1_NOME FROM " + RetSqlName("SA1") + ;
                " WHERE D_E_L_E_T_ = ? AND A1_FILIAL = ? AND A1_COD = ?" as Character
Local oExec  := FWExecStatement():New(ChangeQuery(cQuery)) as Object
Local cAlias as Character

oExec:SetString(1, ' ')
oExec:SetString(2, FWxFilial("SA1"))
oExec:SetString(3, cUserInput)

cAlias := oExec:OpenAlias()            // SELECT cursor
// xVal  := oExec:ExecScalar("COL")    // single value
// TCSqlExec(oExec:GetFixQuery())      // DML (UPDATE/INSERT/DELETE)

(cAlias)->(DBCloseArea())
oExec:Destroy()
```

### IN-clause with `SetIn()`

```advpl
Local aCodes := { "000001", "000002", "000003" } as Array
Local oExec  := FWExecStatement():New(ChangeQuery( ;
  "SELECT A1_COD, A1_NOME FROM " + RetSqlName("SA1") + ;
  " WHERE D_E_L_E_T_ = ? AND A1_FILIAL = ? AND A1_COD IN (?)"))

oExec:SetString(1, ' ')
oExec:SetString(2, FWxFilial("SA1"))
oExec:SetIn(3, aCodes)                 // bind list — no manual quoting/concat

cAlias := oExec:OpenAlias()
```

### Setter reference

| Setter | Use for |
| --- | --- |
| `SetString(n, c)` | character values (pass raw text — no quotes) |
| `SetNumeric(n, n)` | numeric values |
| `SetDate(n, d)` | Protheus dates |
| `SetBoolean(n, l)` | logical values |
| `SetIn(n, aValues)` | lists for `IN (?)` |
| `SetUnsafe(n, x)` | identifiers/constants only — **never user input** |

> Older codebases on libs prior to `20211116` should use `FWPreparedStatement` (same API surface, no DBAccess cache / no DB-side bind).
