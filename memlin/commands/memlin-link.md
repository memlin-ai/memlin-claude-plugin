---
name: memlin-link
description: Pin the current workspace to a specific Memlin account. Use when you switch Claude Code workspaces between accounts (e.g. employer / client / personal).
allowed-tools: Bash
---

# /memlin-link

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/link.js" $ARGUMENTS
```

Common usage:

- `memlin link --list` — show every Memlin account this user can act on
- `memlin link --account <name>` — pin the current workspace to that account (fuzzy match)
- `memlin link --account <uuid>` — exact uuid match
- `memlin link --clear` — remove the pin (fall back to the global default)

Writes `.memlin/config.json` at the workspace root. Subsequent resolves,
memory writes, and audit calls from anywhere inside that directory will
target the pinned account.
