# Tasks

**Goal**: Break into GRANULAR, ATOMIC tasks. Clear dependencies. Right tools. Parallel execution plan.

**Skip this phase when:** There are ≤3 obvious steps. In that case, tasks are implicit — go straight to Execute and list them inline in your implementation plan.

## Why Granular Tasks?

| Vague Task (BAD) | Granular Tasks (GOOD) |
| --- | --- |
| "Create MVC screen" | T1: Define ModelDef with SX3 fields |
| | T2: Define ViewDef layout |
| | T3: Define BrowseDef with actions |
| | T4: Define MenuDef and entry |
| | T5: Add validations and triggers |
| "Implement REST endpoint" | T1: Create TLPP class with annotation |
| | T2: Implement GET method with query |
| | T3: Implement POST with validation |
| | T4: Write TIR test |

**Benefits of granular:**

- **Agents don't err** - Single focus, no ambiguity
- **Easy to test** - Each task = one verifiable outcome
- **Parallelizable** - Independent tasks run simultaneously
- **Errors isolated** - One failure doesn't block everything

**Rule**: One task = ONE of these:

- One function / static function
- One class or method
- One MVC layer (ModelDef, ViewDef, BrowseDef, MenuDef)
- One REST endpoint method
- One test file (TIR)
- One file change

---

## Process

### 1. Review Design

Read `.specs/[feature]/design.md` before creating tasks.

### 1.5. Load Test Coverage Matrix

Read `.specs/codebase/TESTING.md` (if it exists) before creating tasks. The Test Coverage Matrix and Parallelism Assessment drive two critical decisions:

**Co-located tests:** Every task that creates or modifies a code layer with a required test type MUST include writing/updating those tests in the same task. Tests are NOT separate tasks.

| Task creates... | Done When must include... |
| --- | --- |
| Code layer with "e2e" (TIR) | TIR test written + run passed |
| Code layer with "none" | Gate check at the appropriate level |

**Parallelism flags:** Cross-reference the Parallelism Assessment when marking tasks `[P]`.

If TESTING.md does not exist (greenfield project), ask the user what test types and commands the project will use before creating tasks.

### 2. Break Into Atomic Tasks

**Task = ONE deliverable**. Examples:

- ✅ "Create ModelDef for the MATA010 screen" (one file, one layer)
- ❌ "Implement the registration screen" (vague, multiple files)

### 3. Define Dependencies

What MUST be done before this task can start?

### 4. Create Execution Plan

Group tasks into phases. Identify what can run in parallel.

### 5. Validate Before Presenting (MANDATORY)

Before showing tasks to the user, run ALL three pre-approval checks:

**Check 1: Task Granularity** — verify each task is atomic.

**Check 2: Diagram-Definition Cross-Check** — verify the execution diagram matches every task's `Depends on` field.

**Check 3: Test Co-location Validation** — verify every task's `Tests` field matches the TESTING.md coverage matrix.

### 6. ASK About Skills

**CRITICAL**: Before execution, ask the user:

> "For each task, which tools should I use?"
>
> **Available skills:** [list from project or user — e.g., mvc-generator, tir-test-generator]

---

## Template: `.specs/[feature]/tasks.md`

```markdown
# [Feature] Tasks

**Design**: `.specs/[feature]/design.md`
**Status**: Draft | Approved | In Progress | Done

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Core Implementation (Parallel OK)

```
     ┌→ T4 ─┐
T3 ──┼→ T5 ─┼──→ T8
     └→ T6 ─┘
T7 ──────────→
```

### Phase 3: Integration (Sequential)

```
T8 → T9
```

---

## Task Breakdown

### T1: [Create Function/Component X]

**What**: [One sentence: exact deliverable]
**Where**: `Fontes_Doc/Master/Fontes/[Module]/[NAME].prw`
**Depends on**: None
**Reuses**: [existing file/function, if any]
**Requirement**: [FEAT]-01

**Tools**:

- Skill: NONE

**Done when**:

- [ ] User Function defined with correct parameters
- [ ] Mandatory SQL filters present (D_E_L_E_T_, xFilial)
- [ ] Encoding converted to CP-1252
- [ ] Compilation without errors

**Tests**: [e2e (TIR) / none]
**Gate**: [quick/full/build]

---

### T2: [Create T2] [P]

**What**: [Exact deliverable]
**Where**: `Fontes_Doc/Master/Fontes/[Module]/[NAME].prw`
**Depends on**: T1
**Reuses**: [if any]

**Tools**:

- Skill: `mvc-generator`

**Done when**:

- [ ] [Verifiable criterion]
- [ ] Encoding converted to CP-1252
- [ ] Gate check passes: [command]
- [ ] Test count: [N] tests pass

**Tests**: unit
**Gate**: quick
```
