---
name: memlin-login
description: Sign in to Memlin via Auth0 device flow. Opens a verification URL in your browser; the CLI receives access + refresh tokens that auto-rotate. Also installs the resolver SKILL.md.
allowed-tools: Bash
---

# /memlin-login

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/login.js"
```

What this does:

- Starts an OAuth 2.0 device authorization flow against the Memlin Auth0 tenant.
- Prints a verification URL + short code; you approve in your browser.
- Persists tokens to `~/.config/memlin/token.json` (refresh-rotated, no manual renewal).
- Calls `/v1/me` to discover your workspace and writes `~/.config/memlin/config.json`.
- Installs the Memlin resolver skill to `~/.claude/skills/memlin/SKILL.md` (idempotent — never clobbers a user-edited copy).

Run once per machine. To switch users, re-run `/memlin-login`.
