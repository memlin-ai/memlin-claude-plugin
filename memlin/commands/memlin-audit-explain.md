---
name: memlin-audit-explain
description: Explain why each item ranked in a resolve audit — per-item arithmetic and reasons[]. Usage - /memlin-audit-explain <audit-id>
allowed-tools: Bash
argument-hint: <audit-id>
---

# /memlin-audit-explain

Decompose a past `memlin resolve` audit: similarity, kind weight, rerank, decay, and `reasons[]` per item.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/audit-explain.js" "$ARGUMENTS"
```

Example: `/memlin-audit-explain c0ba516b-20f6-456f-b584-d84e1b3afb9e`
