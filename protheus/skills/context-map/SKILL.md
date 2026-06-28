---
name: context-map
description: 'Generate a context map of all files relevant to a task before implementing changes. Use when a user says "map the codebase for this change", "what files are affected", "show me dependencies", or before starting implementation to identify files to modify, dependencies, test files, and reference patterns.'
license: MIT
metadata:
  domain: Protheus
  maintainer: Customizações ADVPL/TLPP
  author: Thalion Starforge
  version: '4.1.0'
  category: Documentation and Planning
---

# Context Map

## When to Use

Use this skill when:

- Preparing to implement changes and need to understand the affected codebase
- Identifying all files, dependencies, and tests related to a task
- Finding reference patterns and similar implementations in the codebase
- Creating a pre-implementation analysis to reduce missed changes

Before implementing any changes, analyze the codebase and create a context map.

## Task

{{task_description}}

## Instructions

1. Search the codebase for files related to this task
2. Identify direct dependencies (imports/exports)
3. Find related tests
4. Look for similar patterns in existing code

## Output Format

```markdown
## Context Map

### Files to Modify
| File | Purpose | Changes Needed |
|------|---------|----------------|
| path/to/file | description | what changes |

### Dependencies (may need updates)
| File | Relationship |
|------|--------------|
| path/to/dep | imports X from modified file |

### Test Files
| Test | Coverage |
|------|----------|
| path/to/test | tests affected functionality |

### Reference Patterns
| File | Pattern |
|------|---------|
| path/to/similar | example to follow |

### Risk Assessment
- [ ] Breaking changes to public API
- [ ] Database migrations needed
- [ ] Configuration changes required
```

Do not proceed with implementation until this map is reviewed.

