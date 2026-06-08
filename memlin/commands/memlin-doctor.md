---
name: memlin-doctor
description: Run a diagnostic checklist — config readable, token refreshable, Supabase + MCP reachable, project resolution, filesystem permissions. Companion to /memlin-status (state) vs doctor (why state is broken).
allowed-tools: Bash
---

# /memlin-doctor

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/doctor.js"
```

Checks run in order, each with a 5s network timeout:

1. **Config file** — `~/.config/memlin/config.json` parseable with `account_id`, `user_id`, `supabase_url`, `supabase_anon_key`
2. **Token shape** — `token.json` present with `access_token`, `expires_at`, ideally `refresh_token`
3. **Token refresh** — round-trip a valid access token (refreshes if near expiry)
4. **Supabase reachable** — `HEAD /rest/v1/` against the configured URL
5. **Project resolution** — `git remote` / local-path / config override for the current cwd
6. **MCP endpoint** — `GET ${MEMLIN_MCP_URL}` (skipped with a warn when the env var is unset)
7. **Writable: ~/.config/memlin** — create + delete a probe file
8. **Writable: ~/.claude** — same

Output format: `✓ pass / ⚠ warn / ✗ fail` per row plus a `N pass · N warn · N fail` summary. Exit code 1 if any check failed, 0 otherwise.
