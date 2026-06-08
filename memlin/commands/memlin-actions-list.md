---
name: memlin-actions-list
description: List callable Memlin actions in this workspace (id, schema, invoke URL). Usage - /memlin-actions-list [--filter s] [--limit n] [--json]
allowed-tools: Bash
argument-hint: [--filter <substring>] [--limit <n>] [--json]
---

# /memlin-actions-list

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/actions-list.js" "$ARGUMENTS"
```

Pair with `/memlin-actions-execute` to invoke an action by id.
