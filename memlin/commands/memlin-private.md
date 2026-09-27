---
name: memlin-private
description: Private or read-only mode — Memlin context still loads; private saves nothing from this session, read-only lets the team see the work but nothing changes team memory. Ends with the session. Usage - /memlin-private [on|read-only|off|status]
allowed-tools: Bash
---

# /memlin-private

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/private.js" $ARGUMENTS
```

- **on** (default): private. The resolver keeps injecting context, but the
  server records nothing about this session: no memories, plans, activity or
  audit.
- **read-only**: context loads and your team still sees this work (activity,
  plans, history), but nothing changes team memory: no scribe capture, no
  memory proposals, and no saved memories, skills or decisions, even when
  asked. Same as `/memlin-read-only`.
- **off**: resume normal capture from this point. The private or read-only
  stretch is never uploaded or learned from, including by a later session scribe.
- **status**: show which mode this session is in.

Either mode ends when the session ends (a `/clear` carries it over) and after
24 hours at most. For a whole session from the start, launch with
`MEMLIN_PRIVATE=1 claude` (private) or `MEMLIN_PRIVATE=read-only claude`.

Deploy leases and guardrail checks still run in both modes. They protect
shared infrastructure and don't save session content.

Relay the command output to the user in one line. In private mode don't call
any Memlin write tools; in read-only mode don't call tools that change memory
(`memlin_write_memory`, `memlin_capture_session`, `memlin_correct_memory`, …).
They are refused either way.
