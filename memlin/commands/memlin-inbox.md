---
name: memlin-inbox
description: Review the Memlin scribe inbox — list proposed decisions, memories, and skills and accept or reject them without leaving Claude Code. Usage - /memlin-inbox [accept|reject <id>]
allowed-tools: Bash
argument-hint: [accept <id> | reject <id>]
---

# /memlin-inbox

Review the scribe inbox — the decisions, memories, and skills Memlin proposed from your sessions and commits — and resolve them in place.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/inbox.js" "$ARGUMENTS"
```

- `/memlin-inbox` — list every pending proposal with its short id.
- `/memlin-inbox accept <id>` — promote a proposal to active; the resolver surfaces it immediately.
- `/memlin-inbox reject <id>` — soft-reject a proposal (kept for scribe-quality analysis, not surfaced).

`<id>` is the 8-character prefix shown in the list. Proposals are also reviewable in the web inbox at `/app/<account>/inbox`.

When a proposal has a suggested filing, the inbox shows its feature title and complete ID. Accept with `--feature <feature-id>` to choose an existing active feature, or `--no-feature` to keep the document unfiled and prevent automatic relinking. These choices apply to document proposals; use the document page to change filing later.
