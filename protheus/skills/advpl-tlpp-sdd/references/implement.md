# Execute

**Goal**: Implement ONE task at a time. Surgical changes. Verify. Commit. Repeat.

This is where code gets written. Each task follows the same cycle: plan → implement → verify → commit. Verification is part of every task, not a separate phase.

---

## MANDATORY: Before Starting Any Implementation

**Read [coding-principles.md](coding-principles.md) and state:**

1. **Assumptions** - What am I assuming? Any uncertainty?
2. **Files to touch** - List ONLY the files this task requires
3. **Success criteria** - How will I verify it works?

⚠️ **Do not proceed without stating these explicitly.**

---

## Process

**Sub-agent context:** When this task is executed by a sub-agent, the sub-agent receives the task definition, coding principles, TESTING.md, and relevant spec/design context. All steps below apply identically whether in the main context or in a sub-agent. The only difference: sub-agents report results back to the orchestrator instead of continuing to the next task.

### 0. List Atomic Steps (MANDATORY when the Tasks phase was skipped)

If there is no `tasks.md` for this feature, you MUST list atomic steps before writing any code. This is non-negotiable — it prevents the agent from losing focus and doing too many things at once.

```
## Execution Plan

1. [Step] → files: [list] → verify: [how] → commit: [message]
2. [Step] → files: [list] → verify: [how] → commit: [message]
3. [Step] → files: [list] → verify: [how] → commit: [message]
```

**Each step must be:**

- ONE deliverable (one component, one function, one endpoint, one file change)
- Independently verifiable (can prove it works before moving on)
- Independently committable (has its own atomic commit)

If listing the steps reveals >5 steps or complex dependencies, STOP and create a formal `tasks.md`. The Tasks phase was wrongly skipped.

### 1. Choose Task

From tasks.md (if it exists) or from the execution plan above. The user specifies ("implement T3") or you suggest the next available one.

### 2. Check Dependencies

If tasks.md exists, check dependencies. If using the inline plan, follow the listed order.

❌ If blocked: "T3 depends on T2 which isn't ready. Should I do T2 first?"

### 3. State the Implementation Plan

Before writing code:

```
Files: [list]
Approach: [brief description]
Success: [how to verify]
```

### 4. Write Tests First (RED)

If the task includes tests (per the Tests field in tasks.md or the coverage matrix in TESTING.md):

1. Write the test file(s) BEFORE writing any implementation
2. Tests must encode the expected behavior from the task's "Done when" criteria
3. Run the test command — confirm the tests FAIL (RED state)
4. If tests pass before the implementation exists, the tests are too weak — rewrite them

**Constraints:**

- Tests define correct behavior independently of the implementation
- Each "Done when" acceptance criterion maps to at least one test assertion
- Edge cases from spec.md that apply to this task also get test cases

If the task does NOT include tests (e.g., entity-only, config-only), skip to Step 4b.

### 4b. Implement (GREEN)

Write the minimum implementation required to satisfy the task's success criteria: pass all relevant tests (when present) and meet the defined gate checks when there are no direct tests.

**HARD CONSTRAINTS:**

- DO NOT modify tests written in Step 4. The tests are the spec — the implementation conforms to them.
- DO NOT weaken assertions (making them less specific to pass more easily)
- DO NOT delete or skip test cases
- DO NOT use the framework's skip/disable/pending mechanism to bypass failing tests
- Minimum code to pass — save structural improvements for a refactor task

If a test is genuinely wrong (tests the wrong behavior per the spec), STOP and ask the user before modifying. Never silently alter a test.

Follow [coding-principles.md](coding-principles.md):

- Simplest code that works
- Touch ONLY the listed files
- No scope creep

### 4c. Convert Encoding to CP-1252 (MANDATORY for AdvPL/TLPP)

**After generating or modifying any `.prw`, `.prg`, `.prx`, `.tlpp`, `.ch`, or `.aph` file:**

1. Run the `utf8-to-cp1252-conversion` skill on all generated/modified files
2. Confirm the encoding was converted from UTF-8 to CP-1252
3. DO NOT proceed to Step 4d without this conversion — accented characters silently corrupt at compile time

> **Why:** All AI-generated code is in UTF-8. The Protheus RDMake/AppServer compiler requires CP-1252. This is a safety step — not a suggestion.

### 4d. Compile Modified Sources (MANDATORY for AdvPL/TLPP)

**Immediately after Step 4c, and BEFORE the Gate Check (Step 5):**

**⚡ Interactive step — ask the user before compiling:**
> "The source was successfully generated/modified. Do you want to compile now?"
> - **Yes** → proceed with the steps below
> - **No** → document in Step 6 and continue without compiling

1. Run the `advpl-tlpp-compile` skill passing the exact list of files generated/modified in the current task (scope: file, not workspace).
2. The skill handles: verifying `TOTVS.tds-vscode`, reusing `~/.totvsls/servers.json`, ensuring connection, and dispatching `totvs-developer-studio.rebuild.file` for each file.
3. **Capture the result** from the compilation output log.
4. **Verify success** — compilation is successful when the log contains:
   ```
   [Info] All files compiled successfully.
   [Info] Recompile finished.
   ```
5. **If there is ANY compilation error (syntax, symbol not found, missing include, etc.):**
   - STOP immediately. Do not proceed to the Gate Check, do not commit.
   - Analyze the error: identify the message, file, line, and root cause.
   - Fix the source (go back to Step 4b) based on the identified root cause.
   - Reconvert the encoding (Step 4c).
   - Ask the user again:
     > "The source has been fixed. Do you want to try compiling again?"
   - Repeat steps 1–5 until compilation with **zero errors**.
6. **After successful compilation (zero errors):**
   Ask the user:
   > "✅ Compilation completed successfully! Do you want to open SmartClient WebApp in the browser?"
   > - **Yes** → open the URL in the format `http://<IP>:<PORT>/webapp`, using the IP and PORT from the server configured in `~/.totvsls/servers.json` (e.g., `http://192.168.10.163:32280/webapp`).
   >
   >   **Opening strategy (in order of preference):**
   >   1. **Builtin browser tool** (`open_browser_page`) — absolute preference when available in the agent.
   >   2. **Terminal fallback** (only if the builtin tool does not exist) — detect the OS and use the native command:
   >      - **Linux:** `xdg-open "http://<IP>:<PORT>/webapp"`
   >      - **macOS:** `open "http://<IP>:<PORT>/webapp"`
   >      - **Windows:** `start "" "http://<IP>:<PORT>/webapp"` (cmd) or `Start-Process "http://<IP>:<PORT>/webapp"` (PowerShell)
   >
   >   Detect the OS via environment variable or user's system context before choosing the command. Never guess the OS.
   > - **No** → proceed to the Gate Check
7. **Warnings do not block progress**, but must be reported in the Gate Check (Step 5) and justified or fixed in Step 6.

> **Why:** Compilation is the first real test of AdvPL/TLPP code — it catches syntax errors, missing includes, nonexistent symbols, TLPP namespace issues, and type violations that no visual review can detect. Without compiling, "implemented" only means "written".

> **When to skip:** Only if the task produced no AdvPL/TLPP source (e.g., a dictionary-only task, creating a constants `.ch` with no code, editing `.md` documentation). Document the skip rationale in Step 6.

### 5. Gate Check (VERIFY)

Run the gate check command from the task definition. This is MANDATORY — not "if applicable."

**For Protheus projects, the default gate is:**

1. **Encoding OK** — Step 4c executed and confirmed ✅
2. **Compilation without errors** — Step 4d executed and returned zero errors ✅. Re-run `advpl-tlpp-compile` if there is any doubt about the current state.
3. **Tests (if defined)** — Run the task's gate command (TIR via `python -m pytest`)

**Gate levels (from TESTING.md, if present):**

| Task includes | Gate level | What runs |
| --- | --- | --- |
| e2e tests (TIR) | Full | Compilation + TIR |
| Last task of a phase | Build | Compilation + SonarQube lint + all tests |
| No tests (config, entities) | Build | Compilation + SonarQube lint |

Non-zero exit code = STOP. Fix the failure. Run again. Don't proceed until green.

### 6. Post-Gate Review

After the gate check passes:

1. Verify test count: are there at least as many test cases as before? (prevents silent deletion)
2. Verify absence of SPEC_DEVIATION: if the implementation diverged from the spec/design, add a marker:

```
// SPEC_DEVIATION: [what diverged]
// Reason: [why the deviation was necessary]
```

3. Quick complexity check: "Would a senior engineer flag this as overcomplicated?"
   - Yes → Simplify, run the gate again
   - No → Proceed to commit

4. **SonarQube check (for AdvPL/TLPP code):** Walk through the changed files and verify the critical rules from AGENTS.md. No CRITICAL or MAJOR violation may be present in the submitted code.

### 7. Atomic Git Commit

Each task gets its own commit immediately after verification. Never group multiple tasks into one commit.

**Format ([Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)):**

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to use |
| --- | --- |
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `style` | Formatting, semicolons, etc. (no code change) |
| `perf` | Performance improvement |
| `build` | Build system or external dependencies |
| `ci` | CI configuration files |
| `chore` | Maintenance tasks that don't modify src or test files |

**Scope:** Feature name or Protheus module area, lowercase, e.g., `mata010`, `fina138`, `rest-pedido`

**Description rules:**

- Imperative mood ("add", not "added" or "adds")
- Lowercase first letter
- No trailing period
- Complete the sentence: "If applied, this commit will _[your description]_"

**Breaking changes:** Add `!` after type/scope AND add a `BREAKING CHANGE:` footer:

```
feat(api)!: change response format of orders endpoint

BREAKING CHANGE: /api/pedidos endpoint now returns pagination in TTalk envelope
```

**Examples:**

```
feat(mata010): add minimum product quantity validation
fix(fina138): correct compound interest calculation for overdue installments
refactor(rest-pedido): extract validation logic into helper function
test(mata010): add TIR for stock balance validation
```

**Rules:**

- One task = one commit
- The description references what WAS DONE, not what was planned
- Include only files listed in the task — never add changes "while I'm here"
- If tests are part of the task, include them in the same commit

### 8. Scope Guardrail

During implementation, you'll notice things that could be improved, refactored, or added. **Do not act on them.** Instead:

- If it's a bug: note it in STATE.md as a blocker or use quick mode
- If it's an improvement: note it in STATE.md under "Deferred Ideas" or "Lessons Learned"
- If related to the current task: include it only if it's in the "Done when" criteria

**The heuristic:** "Is this in my task definition?" If not, don't touch it.

### 9. Update Task Status

Mark task as complete in tasks.md. Update requirement traceability in spec.md if requirement IDs are used.

---

## Execution Template

```markdown
## Implementing T[X]: [Task Title]

**Reading**: task definition in tasks.md
**Dependencies**: [All ready? ✅ | Blocked by: TY]
**Tests**: [unit/e2e/integration/none]
**Gate**: [quick/full/build]

### Pre-Implementation (MANDATORY)

- **Assumptions**: [state explicitly]
- **Files to touch**: [list ONLY these]
- **Success criteria**: [how to verify]

### RED: Write Tests

- Test file(s): [paths]
- Test count: [N test cases]
- Confirmed failing: [Yes — all N tests fail as expected]

### GREEN: Implement

- Changes made: [summary]
- Files changed: [list]

### CP-1252: Convert Encoding

- utf8-to-cp1252-conversion skill executed: [Yes ✅]
- Files converted: [list]

### Compilation (interactive)

- User confirmed compilation: [Yes ✅ | No]
- Result: [No errors ✅ | Errors fixed after N attempts]
- SmartClient WebApp opened: [Yes | No]

### Gate Check

- Compilation: [No errors ✅ | Errors: list]
- Tests: [N passed, 0 failed]
- SonarQube check: [No CRITICAL/MAJOR violations ✅]

### SPEC_DEVIATION (if any)

[None | list of deviations with justification]

### Commit

[short hash and message]
```
