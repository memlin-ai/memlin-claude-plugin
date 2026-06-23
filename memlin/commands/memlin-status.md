---
name: memlin-status
description: Show Memlin status — auth (token expiry, refresh state), account + project, routing, last sync, and pending local changes.
allowed-tools: Bash
---

# /memlin-status

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/status.js"
```

Sections:

- **Auth** — access token validity + expiry, refresh token presence
- **Account** — workspace name/tier, signed-in user, API base
- **Project** — cwd, auto-resolved project (with reason: git remote / local-path / config)
- **Routing** — default managed routing, or a custom MCP endpoint if you've set one
- **Local state** — tracked doc count, most recent sync, pending added/modified/deleted
