---
name: memlin-decide
description: Answer one Memlin memory decision and keep your reason with it. Usage - /memlin-decide <id> <option> [--note "why"]
allowed-tools: Bash
argument-hint: <id> <option> [--note "why"]
---

# /memlin-decide

Record your answer to a memory decision from `/memlin-decisions`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/decide.js" "$ARGUMENTS"
```

- `<id>` — the 8-character prefix shown by `/memlin-decisions` (or the full id).
- `<option>` — one of that decision's option ids, e.g. `keep_existing`, `both_valid`, `discard`.
- `--note "why"` — your reason, kept with the answer.

Only run this with an option the user chose. Every option can be undone from the Handled page.
