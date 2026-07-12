---
name: memlin-ask
description: Ask your team's Memlin workspace a natural-language question. Resolver gathers the relevant memory + skills + goals + schemas + decisions; Claude answers from that context with clickable citations. The discovery layer.
allowed-tools: Bash
---

# /memlin-ask

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/ask.js" $ARGUMENTS
```

Examples:

- `memlin ask "what's our approach to webhook retries"`
- `memlin ask "did anyone document the auth flow"`
- `memlin ask --org Memlin "what's our brand voice"`

Every answer cites specific items from your workspace — replay via the
audit link to inspect the bundle that informed it.
