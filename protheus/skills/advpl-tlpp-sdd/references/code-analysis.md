# Code Analysis Tools — Protheus

Use graceful degradation for code search and structural analysis in AdvPL/TLPP projects.

## Tool Priority

1. **ripgrep** (`rg`) — fast search with context (recommended for AdvPL/TLPP)
2. **grep** — standard text search (always available)

> **Note:** `ast-grep` has no native support for AdvPL/TLPP. Use ripgrep with text patterns.

## Detection

Check tool availability before use:

```bash
# Check ripgrep
if command -v rg >/dev/null 2>&1; then
  # Use ripgrep
else
  # Fallback to grep
fi
```

## Usage Examples

**Find User Function/Static Function definitions:**

```bash
# ripgrep (recommended)
rg '^(User |Static )?Function\s+\w+' --include="*.prw" --include="*.tlpp" --include="*.prg"

# grep (fallback)
grep -rn "^User Function\s\|^Static Function\s" --include="*.prw" --include="*.tlpp" --include="*.prg"
```

**Find User Functions (public customization routines):**

```bash
rg '^User Function\s+\w+' --include="*.prw" --include="*.tlpp"
```

**Find TLPP class definitions:**

```bash
rg '^class\s+\w+' --include="*.tlpp"
```

**Find method calls on a class:**

```bash
rg '::\w+\(' --include="*.tlpp" -l
```

**Find MVC patterns (ModelDef/ViewDef/MenuDef):**

```bash
rg '^(Static )?Function\s+(ModelDef|ViewDef|MenuDef|BrowseDef)' --include="*.prw" --include="*.tlpp"
```

**Find TLPP REST annotations:**

```bash
rg '@(Get|Post|Put|Patch|Delete)\(' --include="*.tlpp"
```

**Find usage of specific tables (e.g., SA1):**

```bash
rg '\bSA1\b' --include="*.prw" --include="*.tlpp" -l
```

**Find SQL filters (check D_E_L_E_T_ and xFilial):**

```bash
# Files containing SQL but missing the D_E_L_E_T_ filter
rg 'FWExecStatement|TCQuery|DbSelectArea|cQuery' --include="*.prw" --include="*.tlpp" -l | xargs rg -L "D_E_L_E_T_"
```

**Find includes in use:**

```bash
rg '^#include' --include="*.prw" --include="*.tlpp" --include="*.prg" | sort | uniq -c | sort -rn
```

**Find GetMV/SuperGetMV parameters:**

```bash
rg '(GetMV|SuperGetMV)\s*\(' --include="*.prw" --include="*.tlpp"
```

**Find forbidden IIF() calls:**

```bash
rg '\bIIF\s*\(' --include="*.prw" --include="*.tlpp" --include="*.prg"
```

## Search Scope

**Best practices for Protheus:**

- Include relevant extensions: `*.prw`, `*.tlpp`, `*.prg`, `*.prx`, `*.ch`
- Exclude build artifacts: `*.O` (compiled RPO objects)
- Focus on source directories: `Fontes_Doc/`, `Fontes/`, `src/`
- Exclude `.git/`

**Performance tips:**

- Use `-l` to list only files containing the pattern (before reading content)
- Use `--type-add 'advpl:*.prw,*.prg,*.prx'` to create a custom type in ripgrep
- Use `-g` for glob patterns specific to a module subdirectory
