---
name: memlin-revert
description: Revert a memory or skill to an earlier version. Usage - /memlin-revert <document-name> [version-number]
allowed-tools: Bash
argument-hint: <document-name> [version-number]
---

# /memlin-revert

Revert a document to a previous version. If `version-number` is omitted, list the history and prompt the user to choose.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/revert.js" "$ARGUMENTS"
```

After revert, re-pull memory so the local files reflect the new current version.
