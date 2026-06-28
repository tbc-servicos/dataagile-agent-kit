# Quick Mode

**Goal:** Run small, ad-hoc tasks with the same quality principles, but without the ceremony of the full pipeline.

**Trigger:** "Quick fix", "Quick task", "Small change", "Bug fix", "Just do X"

## When to Use

| Use quick mode | Use the full pipeline |
| --- | --- |
| Bug fixes with known cause | New features with multiple stories |
| Config / `MV_` parameter changes | Architectural changes |
| Small MVC screen tweaks | Features with design decisions |
| Adding a field/column | Multi-component features |
| Simple entry point | Features with unclear scope |
| SQL filter fix | Anything with undefined requirements |
| Tweak to an existing validation | |

**Rule of thumb:** If you can describe it in one sentence AND it touches ≤3 files, it's a quick task.

## Process

### 1. Describe the Task

The user provides a clear, one-sentence description. If vague, ask for specifics:

- ❌ "Fix the form" → Ask: "What's wrong? What should happen?"
- ✅ "Fix: validation of field A1_COD returns an error even when the code is valid"
- ✅ "Feat: entry point PE_FATURA030 to block issuance on holidays"
- ✅ "Config: MV_ESTADO parameter doesn't apply to the GNRE filter"

### 2. Pre-Implementation Check

Before writing code, state:

```
Quick Task: [description]
Files: [list ONLY the files to touch]
Approach: [one sentence]
Verify: [how to prove it works]
```

Get user approval before proceeding. If the pre-implementation check reveals that the task is larger than expected (>3 files, unclear dependencies, design decisions required), recommend the full pipeline.

### 3. Implement

Follow [coding-principles.md](coding-principles.md):

- Simplest code that works
- Touch ONLY the listed files
- No scope creep — fix the thing, nothing more

### 4. Convert Encoding (MANDATORY for AdvPL/TLPP)

**After generating or modifying any `.prw`, `.tlpp`, `.prg`, `.prx`, `.ch` file:**

Run the `utf8-to-cp1252-conversion` skill. Don't skip this step — the RDMake/AppServer compiler requires CP-1252.

### 5. Verify

Run the verification from step 2. Mark as done only after verification passes. For Protheus, this includes:

1. Compilation without errors via Language Server
2. Expected behavior confirmed

### 6. Commit

Atomic commit following [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <description>
```

Use imperative mood, lowercase, no period. See [implement.md](implement.md) for the full type table.

Protheus examples:

- `fix(mata010): correct minimum quantity validation`
- `feat(fina138): add entry point to block on holidays`
- `fix(atfa002): add missing D_E_L_E_T_ filter to SA1 query`
- `chore(fina138): convert encoding from UTF-8 to CP-1252`
- `fix(rest-pedido): correct 500 return when payload is empty`

### 7. Record

Update `.specs/project/STATE.md` with the quick task entry (see state-management.md Quick Tasks section).

---

## Structure

Quick tasks stay separate from planned features:

```
.specs/
└── quick/
    └── NNN-slug/
        ├── TASK.md       # Description + verification
        └── SUMMARY.md    # What was done + commit
```

**TASK.md template:**

```markdown
# Quick Task NNN: [Title]

**Date:** [date]
**Status:** Done | In Progress | Blocked

## Description

[One sentence: what and why]

## Files Changed

- [path/file.prw] — [what changed]
- [path/file.tlpp] — [what changed]

## Verification

[How to prove it works: compilation without errors + expected behavior]

## Encoding converted

- [ ] utf8-to-cp1252-conversion run on: [list of files]
```

**SUMMARY.md template:**

```markdown
# Quick Task NNN: [Title] — DONE

**Commit:** [short hash]
**Message:** [commit message]

## What was done

[Brief description of the change]

## Verification

[How it was verified]
```
