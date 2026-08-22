---
name: memlin-doctor
description: Run a diagnostic checklist — config readable, token refreshable, Memlin API + MCP endpoint reachable, project resolution, filesystem permissions. Companion to /memlin-status (state) vs doctor (why state is broken).
allowed-tools: Bash
---

# /memlin-doctor

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/doctor.js"
```

Checks run in order, each with a 5s network timeout:

1. **Config file** — `~/.config/memlin/config.json` parseable with the required keys
2. **Token shape** — `token.json` present with `access_token`, `expires_at`, ideally `refresh_token`
3. **Token refresh** — round-trip a valid access token (refreshes if near expiry)
4. **Memlin API reachable** — health probe against the configured API base
5. **Project resolution** — `git remote` / local-path / config override for the current cwd
6. **MCP endpoint** — pass when default routing; probe when a custom endpoint override is set
7. **Writable: ~/.config/memlin** — create + delete a probe file
8. **Writable: ~/.claude** — same
9. **Claude Code plugin (user scope)** — plugin enabled and the Memlin marketplace registered

Output format: `✓ pass / ⚠ warn / ✗ fail` per row plus a `N pass · N warn · N fail` summary. Exit code 1 if any check failed, 0 otherwise.
