---
name: memlin-decisions
description: List the memory decisions Memlin needs from you — why a person is needed, the recommendation, and what happens if you ignore each one. Usage - /memlin-decisions [<id>]
allowed-tools: Bash
argument-hint: "[<id>]"
---

# /memlin-decisions

The rare questions Memlin could not settle itself: replacing live memory, two live docs that disagree, sensitive content, an incident runbook, a goal.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/decisions.js" "$ARGUMENTS"
```

- `/memlin-decisions` — every open decision with its short id, why a person is needed, the options, the recommendation and the default that applies at the deadline.
- `/memlin-decisions <id>` — explain one: where it came from, what automation already did, the diff, and each option's consequence with pros and cons.

Answer with `/memlin-decide <id> <option> --note "why"`. Ignoring a decision is safe: its default applies at the deadline. Memlin normally asks these in the session that raised them.
