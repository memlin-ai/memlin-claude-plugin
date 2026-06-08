---
name: memlin-audit-replay
description: Re-render the exact bundle an agent saw for a resolve audit (version-pinned). Usage - /memlin-audit-replay <audit-id>
allowed-tools: Bash
argument-hint: <audit-id>
---

# /memlin-audit-replay

Replay what the resolver handed to an agent at decision time — same markdown shape as `memlin resolve`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/audit-replay.js" "$ARGUMENTS"
```

Example: `/memlin-audit-replay c0ba516b-20f6-456f-b584-d84e1b3afb9e`
