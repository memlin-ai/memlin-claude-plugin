---
name: memlin-sync
description: Pull latest team/project memory and skills from Memlin, then push any local changes.
allowed-tools: Bash
---

# /memlin-sync

Run a full bidirectional sync with Memlin for the current project.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/sync.js"
```

Report what was pulled and what was pushed. If conflicts surface (the server has a newer version of a document you also edited locally), surface them — do not silently overwrite.
