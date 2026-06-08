---
name: memlin-status
description: Show Memlin status — auth (token expiry, refresh state), account + project, MCP-vs-direct routing, last sync, and pending local changes.
allowed-tools: Bash
---

# /memlin-status

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/status.js"
```

Sections:

- **Auth** — access token validity + expiry, refresh token presence
- **Account** — workspace name/tier, signed-in user, Supabase URL
- **Project** — cwd, auto-resolved project (with reason: git remote / local-path / config)
- **Routing** — direct Supabase or hosted MCP HTTP (if `MEMLIN_MCP_URL` is set)
- **Local state** — tracked doc count, most recent sync, pending added/modified/deleted
