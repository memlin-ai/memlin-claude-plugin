---
name: memlin-pull
description: Pull the latest memory/skills from Memlin for the current project. One-way (server → local).
allowed-tools: Bash
---

# /memlin-pull

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/pull.js"
```

Overwrite local `~/.claude/memory/` and `~/.claude/skills/` with the current versions from Memlin. Local-only changes will be lost — prefer `/memlin-sync` if you have unpushed local edits.
