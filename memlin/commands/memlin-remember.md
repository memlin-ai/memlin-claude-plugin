---
name: memlin-remember
description: Save a one-line durable memory with zero ceremony — routed through the scribe dedup as a provenance-verified user directive (active immediately, supersedes the stale fact it corrects). Usage - /memlin-remember [--team] [--skill] [--title "<t>"] [--type <t>] <text>
allowed-tools: Bash
---

# /memlin-remember

Not part of Memlin Light: on a Light account the command prints that and
saves nothing — use "Add a note" in Memlin Light instead.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/remember.js" $ARGUMENTS
```
