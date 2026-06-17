---
name: memlin-archive-plans
description: Archive duplicate local plan files — moves older copies of the same slug to .archived/<date>/. Default is dry-run; pass --apply. Files MOVE, never delete — recover by moving them back.
allowed-tools: Bash
---

# /memlin-archive-plans

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/archive-plans.js" $ARGUMENTS
```

Folds duplicate plan files in `~/.claude/plans/` (or `~/.config/memlin/plans/` on non-Claude-Code hosts). Same-slug copies — usually leftovers from before server-side dedup landed — are grouped, the newest is kept, and the rest move into `.archived/<YYYY-MM-DD>/` under the plans directory.

- `memlin archive-plans` — dry-run; prints what would be archived.
- `memlin archive-plans --apply` — execute the moves.

**Never deletes.** Files are moved, never removed; recover by moving them back from `.archived/<date>/` into the plans directory. There is no delete flag, by design.
