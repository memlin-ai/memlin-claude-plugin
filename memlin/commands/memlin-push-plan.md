---
name: memlin-push-plan
description: Upload a Claude Code plan file to Memlin as a versioned plan document. Auto-resolves the active project, attaches the optional resolver bundle, and prints the URL to review on memlin.ai.
allowed-tools: Bash
---

# /memlin-push-plan

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/push-plan.js" $ARGUMENTS
```

Usage:

- `memlin push-plan ~/.claude/plans/<file>.md` — auto-resolve project from cwd/git_remote
- `memlin push-plan <file> --project <id>` — pin to a specific project
- `memlin push-plan <file> --audit <audit_id>` — attach a resolver bundle from a usage_events row

The plan lands at `/app/<account>/plans/<id>` with status `drafted`. Local
file is preserved; the Memlin copy becomes the source of truth.
