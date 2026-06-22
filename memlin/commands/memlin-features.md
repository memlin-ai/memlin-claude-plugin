---
name: memlin-features
description: Create and tag Features / Workstreams — project-scoped units of work that gather the thoughts, plans, goals, and PRs behind one thing. Usage - /memlin-features [list | create "<title>" | add <feature-id> <kind> <id>]
allowed-tools: Bash
argument-hint: [list | create "<title>" [--summary S] | add <feature-id> <kind> <id>]
---

# /memlin-features

A **Feature** (a.k.a. **Workstream** on non-code projects) gathers the thoughts, plans, goals, schemas, and shipped PRs behind one thing you're building — so a teammate or another agent can pick it up and see everything at once.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/features.js" "$ARGUMENTS"
```

- `/memlin-features` or `/memlin-features list` — list the bound project's features.
- `/memlin-features create "<title>" [--summary S] [--project P]` — create a feature in the bound project.
- `/memlin-features add <feature-id> <kind> <id>` — tag an existing item into a feature. `<kind>` is one of thought/file/todo/plan/goal/memory/skill/schema/decision; `<feature-id>` is the 8-character prefix shown in the list.

The feature then aggregates everything you attach (plus the PRs and handoffs scoped to it) on its detail page at memlin.ai.
