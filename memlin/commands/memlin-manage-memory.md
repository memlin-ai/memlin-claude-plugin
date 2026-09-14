---
name: memlin-manage-memory
description: Let Memlin manage your memory — turns off this editor's native auto-memory so Memlin is your single store. Reversible; never deletes; --archive copies your files to a verified local backup before moving anything. Usage - /memlin-manage-memory [--status | --archive | --revert]
allowed-tools: Bash
---

# /memlin-manage-memory

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/manage-memory.js" $ARGUMENTS
```
