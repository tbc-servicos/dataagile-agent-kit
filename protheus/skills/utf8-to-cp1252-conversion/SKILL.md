---
name: utf8-to-cp1252-conversion
description: "Convert AdvPL/TLPP source files from UTF-8 encoding to Windows-1252 (CP1252) after code generation. The Protheus compiler only supports CP1252 encoded files — any source created or modified by an AI agent will be in UTF-8 and must be converted before compilation. Use when user says 'convert encoding', 'fix encoding', 'convert to CP1252', 'convert to Windows-1252', 'encoding conversion', 'fix file encoding', or after any code generation skill creates .prw/.prg/.tlpp/.prx files."
license: MIT
metadata:
  domain: Protheus
  maintainer: Customizações ADVPL/TLPP
  author: Thalion Starforge
  version: '4.1.0'
  category: Code Quality and Review
---

# UTF-8 to CP1252 Encoding Conversion

## CRITICAL — Agent Execution Rules

> **These rules are MANDATORY. Any violation causes compilation failures and file corruption.**

1. **ALWAYS use the provided scripts** — NEVER attempt manual encoding conversion (e.g., Python, Node.js, or copying content to a new file).
2. **Conversion is IN-PLACE** — The script replaces the original file. The filename and extension do NOT change. A `.tlpp` file stays `.tlpp`, a `.prw` stays `.prw`.
3. **NEVER create files with `.cp1252` extension** — There is no such convention. Files keep their original extension (`.prw`, `.prg`, `.tlpp`, `.prx`, `.ch`, `.th`).
4. **NEVER create backup copies or duplicate files** — No `.bak`, `.orig`, `.utf8`, `.old`, or any other copy. Only the converted file must exist.
5. **NEVER rename files during conversion** — The filename must remain exactly the same before and after conversion.
6. **VERIFY after conversion** — Run `file --mime-encoding <file>` (Linux/macOS) to confirm the result is `iso-8859-1` or `unknown-8bit`, NOT `utf-8`.
7. **ONE final state** — After this skill runs, only the original file (now CP1252-encoded) must exist. Zero temporary files, zero copies, zero artifacts.

## Overview

Convert AdvPL and TLPP source files from UTF-8 encoding to Windows-1252 (CP1252). The Protheus compiler (AdvPL, AdvPL ASP, 4GL, and 4GLP) **only supports files encoded in CP1252** (Windows code page 1252). AI agents and modern editors create files in UTF-8 by default, which causes compilation errors and corrupted characters (mojibake) when compiled by TDS/AppServer.

This skill provides **two native scripts** (zero external dependencies) that safely convert file encoding with BOM detection and batch processing support:

- **Bash + `iconv`** → Linux and macOS (both pre-installed)
- **PowerShell + .NET Encoding** → Windows (both pre-installed)

> **Source:** TDN Documentation — "Os compiladores Protheus (AdvPL, AdvPL Asp, 4GL e 4GLP) suportam apenas os arquivos com código de página CP1252." ([Informações sobre a gravação de arquivos-fontes](https://tdn.totvs.com/pages/viewpage.action?pageId=56132455))

## When to Use

Use this skill when:

- **After any code generation** — any skill that creates `.prw`, `.prg`, `.tlpp`, or `.prx` files (e.g., `mvc-generator`, `tlpp-rest-endpoint-generator`, `entry-point-designer`)
- **After code migration** — `advpl-to-tlpp-migration`
- **After code refactoring** — `refactor`, `refactor-method-complexity-reduce`
- **When compilation fails** with encoding-related errors (garbled characters, invalid syntax from bad encoding)
- **When SonarQube flags rule CA0000** with "wrong charset" as the cause
- **When converting files received from external sources** in UTF-8

**Do NOT use when:**

- Files are already in CP1252 encoding
- Working with non-Protheus source files (Python, JavaScript, etc.)
- Working with REST API response encoding (use Charset configuration instead)

---

## Why CP1252?

The TOTVS Protheus platform was designed around the Windows-1252 code page:

1. **Compiler requirement** — TDS and AppServer compilers parse source files assuming CP1252 byte sequences
2. **String literals** — accented characters in Portuguese (à, é, ç, ã, õ) have different byte representations in UTF-8 vs CP1252
3. **Runtime behavior** — functions like `EncodeUTF8()` and `DecodeUTF8()` explicitly expect CP1252 as the source/target encoding
4. **SonarQube compliance** — rule CA0000 flags files with incorrect charset as MAJOR severity

### Character Encoding Differences

| Character | UTF-8 Bytes | CP1252 Byte | Issue |
| --- | --- | --- | --- |
| `é` | `0xC3 0xA9` | `0xE9` | 2 bytes vs 1 byte |
| `ç` | `0xC3 0xA7` | `0xE7` | Compiler reads wrong byte sequence |
| `ã` | `0xC3 0xA3` | `0xE3` | String length mismatch at runtime |
| `ü` | `0xC3 0xBC` | `0xFC` | Breaks `Len()`, `SubStr()`, etc. |

---

## Conversion Scripts

This skill includes two native scripts — use the one matching your operating system:

| OS | Script | Runtime | Dependencies |
| --- | --- | --- | --- |
| **Linux / macOS** | [scripts/convert-encoding.sh](scripts/convert-encoding.sh) | Bash + `iconv` | None (pre-installed) |
| **Windows** | [scripts/convert-encoding.bat](scripts/convert-encoding.bat) | CMD + PowerShell inline | None (pre-installed) |

> **Note:** The `.bat` script uses PowerShell inline via `-Command` (not `.ps1` files), so it works regardless of the PowerShell execution policy. It runs from CMD, double-click, or any terminal.

### Prerequisites

- **Linux/macOS:** Bash and `iconv` (pre-installed on all distributions)
- **Windows:** PowerShell 2.0+ (pre-installed since Windows 7) — called internally by the `.bat` script

### Usage

#### Linux / macOS (Bash)

##### Convert a single file

```bash
bash scripts/convert-encoding.sh path/to/source.tlpp
```

##### Convert multiple files

```bash
bash scripts/convert-encoding.sh file1.prw file2.prg file3.tlpp
```

##### Convert all AdvPL/TLPP files in a directory (recursive)

```bash
bash scripts/convert-encoding.sh -r path/to/src/
```

##### Dry run (check which files would be converted)

```bash
bash scripts/convert-encoding.sh --dry-run -r path/to/src/
```

#### Windows (CMD)

##### Convert a single file

```cmd
scripts\convert-encoding.bat path\to\source.tlpp
```

##### Convert multiple files

```cmd
scripts\convert-encoding.bat file1.prw file2.prg file3.tlpp
```

##### Convert all AdvPL/TLPP files in a directory (recursive)

```cmd
scripts\convert-encoding.bat /r path\to\src\
```

##### Dry run (check which files would be converted)

```cmd
scripts\convert-encoding.bat /dryrun /r path\to\src\
```

### Script Options

#### Bash (`convert-encoding.sh`)

| Option | Description |
| --- | --- |
| `<files/dirs>` | One or more file paths or directories to convert |
| `-r`, `--recursive` | Recursively process directories for source files |
| `--dry-run` | Only report which files would be converted, without modifying them |
| `-e`, `--extensions` | Space-separated extensions to process (default: `prw prg tlpp prx ch th`) |

#### PowerShell (`convert-encoding.bat`)

| Parameter | Description |
| --- | --- |
| `<files/dirs>` | One or more file paths or directories to convert (positional) |
| `/r`, `--recursive` | Recursively process directories for source files |
| `/dryrun`, `--dry-run` | Only report which files would be converted, without modifying them |

### Script Features

- **BOM detection** — automatically detects and removes UTF-8 BOM (Byte Order Mark)
- **Encoding detection** — identifies whether a file is already CP1252 or needs conversion
- **Safe conversion** — handles unmappable characters with warnings
- **Batch processing** — processes entire directory trees recursively
- **Zero dependencies** — Bash+`iconv` on Linux/macOS, CMD+PowerShell inline on Windows
- **Exit codes** — returns 0 on success, 1 on errors (integrable with CI/CD pipelines)

---

## Integration with Code Generation Skills

After any code generation or migration skill creates AdvPL/TLPP source files, the encoding conversion must be performed as a **final step**. The workflow is:

```
1. Agent generates/modifies .prw/.prg/.tlpp/.prx files (UTF-8 — default encoding from AI)
2. Agent runs the conversion script on the generated files (IN-PLACE, same filename)
3. Agent verifies encoding with: file --mime-encoding <file>
4. RESULT: Only the original file exists, now encoded in CP1252 — NO extra files
```

> **FORBIDDEN:** Creating new files with `.cp1252` extension, creating backup copies, renaming files, or leaving any temporary artifacts. The script converts the file in-place — the same file, same name, same extension, different encoding.

### Example: After MVC Generator

```bash
# Linux/macOS:
bash skills/advpl-tlpp/utf8-to-cp1252-conversion/scripts/convert-encoding.sh \
  src/MyModule.prw

# Windows (CMD):
scripts\convert-encoding.bat src\MyModule.prw
```

### Example: After Batch Migration

```bash
# Linux/macOS:
bash skills/advpl-tlpp/utf8-to-cp1252-conversion/scripts/convert-encoding.sh -r migrated/

# Windows (CMD):
scripts\convert-encoding.bat /r migrated\
```

---

## Post-Conversion Verification

After converting files, verify the encoding is correct:

### Using `file` command (Linux/macOS)

```bash
file --mime-encoding source.tlpp
# Expected: iso-8859-1 or unknown-8bit (CP1252 is a superset of ISO-8859-1)
# NOT expected: utf-8
```

### Using PowerShell (Windows)

```cmd
powershell -NoProfile -Command "$bytes=[IO.File]::ReadAllBytes('source.tlpp'); $u=[Text.UTF8Encoding]::new($false,$true); try{$u.GetString($bytes); Write-Host 'WARNING: File is still UTF-8'}catch{Write-Host 'OK: File is not UTF-8 (likely CP1252)'}"
```

---

## Troubleshooting

### Characters replaced with `?` after conversion

Some Unicode characters don't have CP1252 equivalents (e.g., emoji, CJK characters). The script replaces them with `?` and prints a warning. Review the source for non-Latin characters.

### File already in CP1252

The script detects files that are already in CP1252 and skips them with an informational message. No action needed.

### BOM detected in file

UTF-8 BOM (`0xEF 0xBB 0xBF`) is automatically stripped during conversion. The script logs this detection.

---

## SonarQube Rule Reference

| Rule | Severity | Description |
| --- | --- | --- |
| **CA0000** | MAJOR | Compilation error — invalid syntax, **wrong charset** (must be Windows-1252), invalid block closure |

Files encoded in UTF-8 will trigger CA0000 when multi-byte characters are interpreted as invalid syntax by the CP1252-expecting compiler.

