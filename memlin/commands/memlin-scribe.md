---
name: memlin-scribe
description: Run the session scribe over the current Claude Code transcript. Extracts decisions, memories, and skills established during this session and proposes them in your Memlin inbox.
allowed-tools: Bash
---

# /memlin-scribe

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/scribe.js"
```

What this does:

- Reads the current session transcript from `~/.claude/sessions/`.
- POSTs it to `https://memlin.ai/api/v1/scribe/session`.
- Server-side: Claude Haiku extracts structured decisions, memories, and skills.
- Each extraction lands in your inbox at `/app/<account>/inbox` as a draft proposal — invisible to the resolver until you accept it.

Use this at natural breakpoints — end of a feature, end of an investigation, when you wrap a day. The auto-trigger on Stop hook is a separate follow-up.
