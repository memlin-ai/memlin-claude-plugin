---
name: memlin-add-project
description: Register the current Claude Code workspace as a Memlin project. One slash command sets up git_remote + local_paths + workspace pin so every future session auto-binds.
allowed-tools: Bash
---

# /memlin-add-project

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/add-project.js" $ARGUMENTS
```

Run this once per repo. After it succeeds, the SessionStart banner will
read `Memlin → "<org>" / project "<name>" (workspace pin)` from now on.

Common usage:

- `memlin add-project` — auto-resolve org from your default or current pin
- `memlin add-project --org "StocksyIQ"` — pin to a specific org (fuzzy name)
- `memlin add-project --name "internal-platform"` — override the derived name
- `memlin add-project --kind general` — non-code project (research, docs)

If the workspace is already registered under any of your orgs, this
command is a no-op except for writing the workspace pin file.

You usually **don't** need this at a multi-repo workspace root. If you open
your agent at a parent folder holding several sibling git repos (e.g.
`~/Repos/Drip/{drip-api,web,mobile}`), Memlin auto-resolves to the org project
that owns those repos — no `add-project`, no per-machine config — and forks
resolve via the project's additional remotes. Reach for `add-project` only for
a single standalone repo that isn't attached yet, or a non-git folder.
