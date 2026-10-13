---
name: memlin-download
description: Download an exact project-shared mock image for review.
allowed-tools: Bash
argument-hint: '<resource UUID> <version UUID> [--output new-image-path] [--json]'
---

# /memlin-download

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/download.js" "$ARGUMENTS"
```

Use only the exact resource and version from the reviewed task. The command verifies the linked account and project, image format, size and hash. Private files, other projects, existing files and symlinked destinations are refused. Do not bypass a refusal. Open the saved image before describing it. Saving a copy does not authorize importing critique findings or changing a standing request.
