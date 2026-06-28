# Database-Specific Best Practices

## ANSI SQL (Cross-Database)

When writing SQL that must run across multiple databases (PostgreSQL, MSSQL, Oracle), prefer ANSI-standard syntax:

```sql
-- Use ANSI JOIN syntax (not comma-separated FROM)
SELECT a.id, b.name
FROM table_a a
INNER JOIN table_b b ON a.id = b.ref_id;

-- Use COALESCE (ANSI) instead of ISNULL (MSSQL) or NVL (Oracle)
SELECT COALESCE(column_name, 'default') FROM table_a;

-- Use CASE WHEN (ANSI) instead of IIF
SELECT CASE WHEN status = 1 THEN 'Active' ELSE 'Inactive' END FROM table_a;

-- Use CONCAT() for string concatenation (MSSQL 2012+, PostgreSQL, Oracle 12c+)
-- Avoid: '+' (MSSQL-only) or '||' (PostgreSQL/Oracle-only)
SELECT CONCAT(first_name, ' ', last_name) FROM users;

-- Use FETCH FIRST for row limiting (ANSI SQL:2008)
SELECT * FROM orders ORDER BY created_at DESC
OFFSET 0 ROWS FETCH FIRST 20 ROWS ONLY;
```

> **Protheus note:** Use `ChangeQuery()` to automatically translate SQL syntax to the active database dialect. BeginSQL/EndSQL calls `ChangeQuery()` automatically.

---

## PostgreSQL

```sql
-- Use JSONB for JSON data
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for JSONB queries
CREATE INDEX idx_events_data ON events USING gin(data);

-- Array types for multi-value columns
CREATE TABLE tags (
    post_id INT,
    tag_names TEXT[]
);
```

### PostgreSQL-Specific Review Points

- Prefer `TIMESTAMPTZ` over `TIMESTAMP` for timezone awareness
- Use `JSONB` (not `JSON`) for indexable JSON storage
- Leverage `GIN` / `GiST` indexes for full-text search and JSONB
- Use `SERIAL` / `BIGSERIAL` or `GENERATED ALWAYS AS IDENTITY` for auto-increment
- Consider `MATERIALIZED VIEWS` for expensive aggregation queries

---

## SQL Server

```sql
-- Use appropriate data types
CREATE TABLE products (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Columnstore indexes for analytics
CREATE COLUMNSTORE INDEX idx_sales_cs ON sales;
```

### SQL Server-Specific Review Points

- Use `NVARCHAR` instead of `VARCHAR` for Unicode support
- Prefer `DATETIME2` over `DATETIME` (higher precision, wider range)
- Use `TRY_CAST` / `TRY_CONVERT` instead of `CAST` / `CONVERT` for safe type conversion
- Leverage `COLUMNSTORE` indexes for analytical/reporting queries
- Use `sp_executesql` (not `EXEC`) for parameterized dynamic SQL

---

## Oracle

```sql
-- Use sequences for auto-increment
CREATE SEQUENCE user_id_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE users (
    id NUMBER DEFAULT user_id_seq.NEXTVAL PRIMARY KEY,
    name VARCHAR2(255) NOT NULL
);
```

### Oracle-Specific Review Points

- Use `VARCHAR2` instead of `VARCHAR` (Oracle-specific recommendation)
- Use `NUMBER` with explicit precision for numeric columns
- Prefer `FETCH FIRST n ROWS ONLY` (12c+) over `ROWNUM` for pagination
- Use `NVL2` for conditional null handling
- Leverage `DBMS_STATS` for accurate optimizer statistics
