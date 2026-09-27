---
name: memlin-read-only
description: Read-only mode — Memlin context still loads and your team still sees this work, but nothing changes team memory (no capture, no saved memories, skills or decisions). Ends with the session. Usage - /memlin-read-only [on|off|status]
allowed-tools: Bash
---

# /memlin-read-only

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/private.js" read-only
```

The Memlin prompt hook applies the toggle before this runs (`/memlin-read-only off`
turns it off; `status` reports it). Relay the output in one line. While read-only
is on, don't call Memlin tools that change memory (`memlin_write_memory`,
`memlin_capture_session`, `memlin_correct_memory`, …); they are refused.
