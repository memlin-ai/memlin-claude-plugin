---
name: memlin-push
description: Push all local memory/skill changes to Memlin as new versions. One-way (local → server).
allowed-tools: Bash
---

# /memlin-push

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/push.js"
```

Each modified file becomes a new version in Memlin with the commit message `"manual push from CLI"`.
