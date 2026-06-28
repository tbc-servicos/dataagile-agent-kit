---
name: entry-point-designer
description: "Design and document Protheus Entry Points (Pontos de Entrada). Always generates TLPP by default; only generates AdvPL (.prw) when the user explicitly requests AdvPL. Covers User Function signatures, PARAMIXB parameter layouts, return value specifications, and ProtheusDOC documentation. Use when user says 'create entry point', 'ponto de entrada', 'PARAMIXB', 'User Function hook', 'ponto de entrada TLPP', 'ponto de entrada ADVPL'."
license: MIT
metadata:
  domain: Protheus
  maintainer: Customizações ADVPL/TLPP
  author: Thalion Starforge
  version: '5.1.0'
  category: Code Generation
---

# Protheus Entry Point Designer

## Overview

Design, implement, and document Protheus Entry Points (Pontos de Entrada). Entry Points are the standard extensibility mechanism in TOTVS Protheus, allowing customization of standard ERP routines without modifying the original source code.

## Language Priority — TLPP First

**TLPP is the default and mandatory output language for every new Entry Point.** Only generate AdvPL (`.prw`) when the user explicitly requests it (e.g., "em AdvPL", "como .prw", "legacy AdvPL", "sem TLPP").

- Default: generate `.tlpp` with `#include "tlpp-core.th"`, type annotations, `Try-Catch`, and namespaced helpers when applicable
- Opt-in AdvPL: only when the user is explicit. If the request is ambiguous (e.g., the project still has many `.prw` files), confirm before falling back to AdvPL
- Migrating an existing `.prw` Entry Point: prefer rewriting in TLPP unless the user requires keeping the original extension

## When to Use

- Creating a new Entry Point to customize standard Protheus behavior
- Documenting existing Entry Points
- Designing the PARAMIXB interface for custom Entry Points
- Migrating legacy Entry Points to TLPP

---

## How Entry Points Work

1. A standard TOTVS routine (e.g., MATA010, FINA010) calls `ExistBlock("PE_NAME")` at predefined extension points
2. If a `User Function` with the matching name exists in the RPO, it is executed
3. The standard routine passes parameters via the `PARAMIXB` array (Private variable)
4. The Entry Point returns a value that influences the standard routine's behavior

---

## MANDATORY Rules

### Function Naming — NEVER use the `U_` prefix

The compiler resolves `U_` automatically at runtime. Adding it manually causes the Entry Point to **never** be triggered.

| ✅ Correct | ❌ Wrong |
|---|---|
| `User Function MT410INC()` | `User Function U_MT410INC()` |
| `User Function A010TOK()` | `User Function U_A010TOK()` |

### File Naming — match the Entry Point name exactly

File name must be the Entry Point name in uppercase + language extension. No namespaces, no prefixes, no suffixes.

| Entry Point | AdvPL | TLPP |
|---|---|---|
| MT410INC | `MT410INC.prw` | `MT410INC.tlpp` |
| FA080BUT | `FA080BUT.prw` | `FA080BUT.tlpp` |

---

## Workflow

### Step 1 — Identify the Entry Point

1. Confirm the Entry Point name (e.g., `MT410INC`, `A010TOK`)
2. Identify the standard routine and module (e.g., MATA410, SIGAFAT)
3. Determine the trigger moment (before validation, after save, grid processing, etc.)
4. Consult TDN to confirm PARAMIXB layout and return type

### Step 2 — Design the PARAMIXB Interface

Document each parameter using the standard table format in [PARAMIXB & Return Types](./references/paramixb-and-returns.md).

### Step 3 — Implement the Entry Point

**Default**: use the [TLPP Template](./references/templates.md#tlpp-template).

Only use the [AdvPL Template](./references/templates.md#advpl-template) when the user explicitly requested AdvPL.

Key implementation rules:
- Document the Entry Point with a `/*/{Protheus.doc}` block (`@type user function`, `@param`, `@return`, `@obs`)
- Always validate PARAMIXB existence (`Type("PARAMIXB") == "A"`) and length defensively
- Extract business logic to `Static Function` helpers
- Use `Try-Catch` for error handling — **never** `ErrorBlock`
- Default return value must be fail-safe (must not block the standard routine)

### Step 4 — Validate

Apply the [Entry Point Design Checklist](./references/design-checklist.md) before delivering.

---

## Quick Reference

| Resource | Contents |
|---|---|
| [Templates](./references/templates.md) | AdvPL and TLPP code templates |
| [PARAMIXB & Return Types](./references/paramixb-and-returns.md) | PARAMIXB layout format, return types, common EP categories |
| [Design Checklist](./references/design-checklist.md) | Interface, defensive programming, code quality, SonarQube compliance |
| [Troubleshooting](./references/troubleshooting.md) | Common issues and fixes |

