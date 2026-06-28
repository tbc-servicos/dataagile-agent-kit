---
name: advpl-tlpp-sdd
description: "Plan and implement Protheus projects/features with 4 adaptive phases — Specify, Design, Tasks, Execute. Auto-sizes depth based on complexity. Creates atomic tasks with verification criteria, atomic commits, requirement traceability, and persistent memory across sessions. Specific to AdvPL/TLPP + Protheus. Use when: (1) Starting new Protheus projects, (2) Working on existing codebases (map modules, architecture, conventions), (3) Planning features (requirements, design, task breakdown), (4) Implementing with verification and atomic commits, (5) Quick tasks (bug fixes, entry points, config), (6) Tracking decisions/blockers/ideas across sessions, (7) Pausing/resuming work. Triggers on: 'initialize project', 'map codebase', 'specify feature', 'discuss feature', 'design', 'tasks', 'implement', 'validate', 'verify work', 'quick fix', 'pause work', 'resume work'."
license: MIT
metadata:
  domain: Protheus
  maintainer: ADVPL/TLPP Customizations
  author: Kael Thornwick
  version: 1.1.0
  category: Spec-Driven Development
  based-on: tlc-spec-driven@2.0.0
---

# Protheus Spec-Driven Development

Plan and implement Protheus projects with precision. Granular tasks. Clear dependencies. Right tools. Zero ceremony.

```
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐
│ SPECIFY  │ → │  DESIGN  │ → │  TASKS  │ → │ EXECUTE │
└──────────┘   └──────────┘   └─────────┘   └─────────┘
   required      optional*      optional*     required

* Agent auto-skips when scope does not justify
```

## Auto-Sizing: The Core Principle

**Complexity determines depth, not a fixed pipeline.** Before starting any feature, assess scope and apply only what's needed:

| Scope       | What                          | Specify                                                  | Design                                          | Tasks                          | Execute                                                |
| ----------- | ----------------------------- | -------------------------------------------------------- | ----------------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| **Small**   | ≤3 files, one-sentence        | **Quick mode** — skips pipeline entirely                 | -                                               | -                              | -                                                      |
| **Medium**  | Clear feature, <10 tasks      | Spec (brief)                                             | Skip — inline design                            | Skip — implicit tasks          | Implement + verify                                     |
| **Large**   | Multi-component feature       | Full spec + requirement IDs                              | Architecture + components                       | Full breakdown + deps          | Implement + verify per task                            |
| **Complex** | Ambiguity, new domain         | Full spec + [discuss gray areas](references/discuss.md)  | [Research](references/design.md) + architecture | Breakdown + parallel plan      | Implement + [interactive UAT](references/validate.md)  |

**Rules:**

- **Specify and Execute are always required** — you always need to know WHAT and to DO
- **Design is skipped** when the change is straightforward (no architectural decisions, no new patterns)
- **Tasks is skipped** when there are ≤3 obvious steps (they remain implicit in Execute)
- **Discuss is triggered inside Specify** only when the agent detects gray areas that need user input
- **Interactive UAT is triggered inside Execute** only for user-facing features with complex behavior
- **Quick mode** is the express lane — for bug fixes, entry points, config, and small tweaks

**Safety valve:** Even when Tasks is skipped, Execute ALWAYS begins by listing atomic steps inline (see [implement.md](references/implement.md)). If that listing reveals >5 steps or complex dependencies, STOP and create a formal `tasks.md` — the Tasks phase was wrongly skipped.

## Project Structure

```
.specs/
├── project/
│   ├── PROJECT.md      # Vision & goals
│   ├── ROADMAP.md      # Features & milestones
│   └── STATE.md        # Memory: decisions, blockers, lessons, todos, deferred ideas
├── codebase/           # Brownfield analysis (existing projects)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── STRUCTURE.md
│   ├── TESTING.md
│   ├── INTEGRATIONS.md
│   └── CONCERNS.md
├── features/           # Feature specifications
│   └── [feature]/
│       ├── spec.md     # Requirements with traceable IDs
│       ├── context.md  # User decisions for gray areas (only when discuss is triggered)
│       ├── design.md   # Architecture & components (only for Large/Complex)
│       └── tasks.md    # Atomic tasks with verification (only for Large/Complex)
└── quick/              # Ad-hoc tasks (quick mode)
    └── NNN-slug/
        ├── TASK.md
        └── SUMMARY.md
```

## Workflow

**New project:**

1. Initialize project → PROJECT.md + ROADMAP.md
2. For each feature → Specify → (Design) → (Tasks) → Execute (auto-sized depth)

**Existing codebase:**

1. Map codebase → 7 brownfield docs
2. Initialize project → PROJECT.md + ROADMAP.md
3. For each feature → same adaptive workflow

**Quick mode:** Describe → Implement → Verify → Commit (for ≤3 files, one-sentence scope)

## Context Loading Strategy

**Base load (~15k tokens):**

- PROJECT.md (if it exists)
- ROADMAP.md (when planning/working on features)
- STATE.md (persistent memory)

**On demand:**

- Codebase docs (when working on existing projects)
- CONCERNS.md (when planning features that touch flagged areas, estimating risk, or modifying fragile components)
- TESTING.md (when creating tasks or executing — drives test type and gate checks)
- spec.md (when working on a specific feature)
- context.md (when designing or implementing from user decisions)
- design.md (when implementing from the design)
- tasks.md (when executing tasks)

**Never load simultaneously:**

- Multiple feature specs
- Multiple architecture docs
- Archived documents

**Target:** <40k tokens total context  
**Reserve:** 160k+ tokens for work, reasoning, outputs  
**Monitoring:** Display status when >40k (see [context-limits.md](references/context-limits.md))

## Sub-Agent Delegation

Use sub-agents (the Task tool or equivalent) to keep the main context window lean and enable parallel execution. The orchestrator agent plans and coordinates; sub-agents do the heavy lifting.

**When to delegate to a sub-agent:**

| Activity | Delegate? | Why |
|---|---|---|
| Research (design phase, brownfield mapping) | Yes | Research output is large; only the summary matters in the main context |
| Implement a task | Yes | File reads, edits, test output consume context; only the result matters |
| Parallel `[P]` tasks | Yes (one per task) | The only way to actually run tasks in parallel |
| Sequential tasks without `[P]` | Yes | Keeps implementation artifacts out of the main context |
| Planning, task creation, validation reports | No | Require the full accumulated context to be coherent |
| Quick mode tasks | No | Too small to justify the overhead |

**Context each sub-agent receives:**

The orchestrator agent MUST provide each sub-agent with:
- The specific task definition from tasks.md (What, Where, Depends on, Reuses, Done when, Tests, Gate)
- Relevant coding principles and conventions (coding-principles.md, CONVENTIONS.md)
- TESTING.md, if it exists (for gate check commands and test patterns)
- Any spec/design context the task references

The sub-agent does NOT receive: definitions of other tasks, accumulated chat history, validation reports from other tasks, or STATE.md (unless the task explicitly references a decision/blocker).

**What sub-agents return:**

Each sub-agent reports:
- Status: Complete | Blocked | Partial
- Files changed: [list]
- Gate check result: [pass/fail + test count]
- SPEC_DEVIATION markers (if any)
- Issues encountered (if any)

The orchestrator agent uses this to update status in tasks.md, traceability, and decide next steps.

## Commands

**Project level:**
| Trigger Pattern | Reference |
|----------------|-----------|
| Initialize project, project setup | [project-init.md](references/project-init.md) |
| Create roadmap, plan features | [roadmap.md](references/roadmap.md) |
| Map codebase, analyze existing code | [brownfield-mapping.md](references/brownfield-mapping.md) |
| Document concerns, find tech debt, what's risky | [concerns.md](references/concerns.md) |
| Log decision, log blocker, add todo | [state-management.md](references/state-management.md) |
| Pause work, end session | [session-handoff.md](references/session-handoff.md) |
| Resume work, continue | [session-handoff.md](references/session-handoff.md) |

**Feature level (auto-sized):**
| Trigger Pattern | Reference |
|----------------|-----------|
| Specify feature, define requirements | [specify.md](references/specify.md) |
| Discuss feature, capture context, how should this work | [discuss.md](references/discuss.md) |
| Feature design, architecture | [design.md](references/design.md) |
| Break into tasks, create tasks | [tasks.md](references/tasks.md) |
| Implement task, build, execute | [implement.md](references/implement.md) |
| Validate, verify, test, UAT | [validate.md](references/validate.md) |
| Quick fix, quick task, small change, bug fix | [quick-mode.md](references/quick-mode.md) |

## Skill Integrations

This skill coexists with other skills. Before specific tasks, check whether complementary skills are installed and prefer them when available.

### Diagrams → mermaid-studio

Whenever the workflow requires creating or updating a diagram, **always** check whether the `mermaid-studio` skill is installed before proceeding. If installed, delegate all diagram creation and rendering to it. Otherwise, proceed with inline mermaid blocks and recommend installation. Show the recommendation at most once per session.

### Code Exploration → codenavi

Whenever the workflow requires exploring or discovering things in an existing repository (brownfield mapping, reuse analysis, pattern identification, dependency tracing), **always** check whether the `codenavi` skill is installed. If installed, delegate exploration to it. Otherwise, use the built-in analysis tools (see [code-analysis.md](references/code-analysis.md)).

### Protheus Skills — Routing by Task

Before executing any Protheus task, check whether the corresponding skill is installed and prefer it:

| Task | Preferred skill |
|---|---|
| Create new CRUD screen (legacy AxCadastro/Browse) | `mvc-generator` |
| Create REST endpoint with `@Get/@Post/...` annotations | `tlpp-rest-endpoint-generator` |
| Generate e2e screen tests via Webapp/SmartClient | `tir-test-generator` |
| Review AdvPL/TLPP code (SonarQube compliance) | `code-review` |
| Look up table structure from the dictionary | `data-dictionary-lookup` |
| Document functions/classes with ProtheusDOC | `documentation-writer` |
| Migrate AdvPL code to modern TLPP | `advpl-to-tlpp-migration` |
| Create entry point | `entry-point-designer` |
| Refactor to reduce cognitive complexity | `refactor-method-complexity-reduce` |
| **After ANY `.prw/.tlpp` code generation** | `utf8-to-cp1252-conversion` (mandatory) |
| **After encoding conversion, before Gate Check** | `advpl-tlpp-compile` (mandatory) |

> **Encoding rule:** Every AdvPL/TLPP source file generated by AI is in UTF-8. The RDMake/AppServer compiler requires CP-1252. **Conversion is mandatory** before any compilation. Run `utf8-to-cp1252-conversion` after each code generation.

> **Compilation rule (Execute):** Every task that generates or modifies `.prw/.prg/.prx/.tlpp/.aph` sources in the Execute phase MUST ask the user whether to compile, immediately after the encoding conversion (Step 4c) and before the Gate Check (Step 5). If the user confirms, run `advpl-tlpp-compile`; if the log returns `[Info] All files compiled successfully.` and `[Info] Recompile finished.` the compilation was successful. If there are errors, analyze the root cause, fix the source, and ask again — repeat until zero errors. After successful compilation, ask whether to open SmartClient WebApp in the browser and, if confirmed, open the URL `http://<IP>:<PORT>/webapp` (obtained from `~/.totvsls/servers.json`) preferring the **builtin browser tool** (`open_browser_page`); if the tool is unavailable, use the native OS command (`xdg-open` on Linux, `open` on macOS, `start "" <url>` on Windows). See [implement.md](references/implement.md) Step 4d.

## Knowledge Verification Chain

When researching, designing, or making any technical decision, follow this chain in strict order. Never skip steps.

```
Step 1: Codebase → check existing code, conventions, and patterns in the project
Step 2: Project docs → README, docs/, inline comments, .specs/codebase/
Step 3: Web search → TDN (tdn.totvs.com), official docs, trusted sources
Step 4: Flag as uncertain → "I'm not sure about X — this is my reasoning, but verify"
```

**Rules:**

- Never skip to Step 5 if Steps 1-4 are available
- Step 5 is ALWAYS flagged as uncertain — never presented as fact
- **NEVER assume or fabricate.** If you can't find the answer, say "I don't know" or "I couldn't find documentation for this". Inventing APIs, patterns, or behaviors causes cascading failures from design → tasks → implementation. Uncertainty is always preferable to fabrication.
- **Validate ALL external symbols** (classes, methods, functions, namespaces) before writing calls — see symbol validation rules in AGENTS.md

## Output Behavior

**Model guidance:** After completing lightweight tasks (validation, state updates, session handoff), naturally mention once that these tasks work well with faster/cheaper models. Record in STATE.md under `Preferences` so it doesn't repeat. For heavy tasks (brownfield mapping, complex design), briefly mention reasoning requirements before starting.

Be conversational, not robotic. Don't interrupt the workflow — add it as a natural closing note. Skip if the user seems experienced or has already acknowledged the tip.

## Code Analysis

Use available tools with graceful degradation. See [code-analysis.md](references/code-analysis.md).
