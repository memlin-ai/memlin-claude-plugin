---
name: memlin-handoffs
description: Pass work between agents — create, list, accept, complete, or cancel cross-agent handoff packets. Usage - /memlin-handoffs [list | create <target> "<task>" | accept|complete|cancel <id>]
allowed-tools: Bash
argument-hint: [list | create <target> "<task>" | accept <id> | complete <id> | cancel <id>]
---

# /memlin-handoffs

Hand off a task between agents — Claude Code, Cursor, Codex, Windsurf, web. The receiving agent sees the packet on its next `/memlin-handoffs list`, and can accept it to take over without re-explaining context.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/handoffs.js" "$ARGUMENTS"
```

- `/memlin-handoffs` or `/memlin-handoffs list` — list pending handoffs targeted at this agent kind.
- `/memlin-handoffs create <target-agent-kind> "<task>" [--path P] [--decisions D] [--blockers B] [--memory M]` — create a handoff for another agent (e.g. `create cursor "Wire OAuth callback in apps/web/app/api/auth/callback/route.ts"`).
- `/memlin-handoffs accept <id>` — claim a pending handoff.
- `/memlin-handoffs complete <id>` — mark a handoff you accepted as done.
- `/memlin-handoffs cancel <id>` — withdraw a handoff you created.

`<id>` is the 8-character prefix shown in the list. The full packet (decisions made, blockers, relevant memory, active claims) is rendered as markdown into the accepting agent's prompt — they don't have to re-build context.
