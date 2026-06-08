---
name: memlin-bind-plans
description: Review local plans that aren't synced to Memlin and bind them to the right project. ~/.claude/plans/ spans every repo you work in, so plans created before the sync hooks landed have no known project — this is how you assign them explicitly.
allowed-tools: Bash
---

# /memlin-bind-plans

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/bind-plans.js"
```

`~/.claude/plans/` is a single global directory holding plans from every repo you've worked in. Plans created since the ExitPlanMode + Write sync hooks shipped are auto-bound to the right project. Older plans are **unbound** — Memlin won't guess which project they belong to.

This command lists them so you can bind each explicitly. Nothing syncs until you do.

- `memlin bind-plans` — list unbound plans
- `memlin bind-plans --all` — bind every unbound plan to the project your current directory resolves to
- `memlin bind-plans <file.md>` — bind one specific plan to the current directory's project

Run it from inside the repo whose project the plans belong to — that's how the right project gets resolved.
