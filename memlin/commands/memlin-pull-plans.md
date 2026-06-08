---
name: memlin-pull-plans
description: Refresh ~/.claude/plans/ from Memlin. By default pulls the delta since the last sync; pass --full for a complete pull, or a plan id for a one-shot fetch.
allowed-tools: Bash
---

# /memlin-pull-plans

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/pull-plans.js" $ARGUMENTS
```

Plans normally auto-sync — SessionStart pulls everything, UserPromptSubmit
fires a delta in the background on every prompt, PostToolUse pushes any
local edits up. Use this command when you just edited a plan on the web
or phone and want it on disk immediately, before your next prompt.
