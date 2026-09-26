---
name: memlin-private
description: Private mode — Memlin context still loads, but nothing from this session is saved (no scribe capture, plan sync, activity or audit). Ends with the session. Usage - /memlin-private [on|off|status]
allowed-tools: Bash
---

# /memlin-private

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/private.js" $ARGUMENTS
```

- **on** (default): stop saving this session. The resolver keeps injecting
  context, but the server records nothing about the request.
- **off**: resume capture from this point. The private stretch is never
  uploaded, including by a later session scribe.
- **status**: show whether this session is private.

Private mode ends when the session ends (a `/clear` carries it over) and
after 24 hours at most. For a whole private session from the start, launch
with `MEMLIN_PRIVATE=1 claude`.

Deploy leases and guardrail checks still run while private. They protect
shared infrastructure and don't save session content.

Relay the command output to the user in one line. Don't call any Memlin
write tools (`memlin_write_memory`, `memlin_capture_session`, …) while
private mode is on unless the user explicitly asks.
