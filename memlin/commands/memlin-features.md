---
name: memlin-features
description: Read and maintain project Features / Workstreams.
allowed-tools: Bash
argument-hint: '[list | search | show | create | status | rename | add | remove | pin]'
---

# /memlin-features

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/features.js" "$ARGUMENTS"
```

Feature commands use the project resolved for the current workspace and its owning account. Pass `--project <uuid>` for an explicit project. Lists default to active and shipped; use complete IDs from the JSON output.

- `memlin features list [--status proposed,active,shipped,archived]`
- `memlin features search "query" [--status active,shipped]`
- `memlin features show <feature-id>` — visible members, linked work, noun and bounded progress counts.
- `memlin features create "title" [--summary "summary"]`
- `memlin features status <feature-id> <status>` — legal transitions only.
- `memlin features rename <feature-id> "title" [--summary "summary"]`
- `memlin features add <feature-id> <kind> <member-id>`
- `memlin features remove <feature-id> <link-id>` — use a membership `id` from `show`, not the source item ID. Removing an automatic document link prevents automatic relinking.

Member kinds: thought, file, todo, plan, goal, memory, skill, schema, decision, component and work_item. Binary attachments use Files; they are not feature member kinds.

MCP equivalents: `memlin_list_features`, `memlin_get_feature`, `memlin_create_feature`, `memlin_update_feature`, `memlin_add_to_feature`, `memlin_remove_from_feature`. Find an existing feature before creating one; duplicate errors include its ID. A feature in `bundle.feature_context`, when present, can supply the current feature ID.

Readers can list and inspect. Changes require current writer access and enabled project tracking. Rename/re-summary requires a human JWT; service-token shipping is disabled by default. These tools are outside Memlin Light. Search falls back to title matching when AI is unavailable.

### Keep captures with the current feature

Use `memlin features pin <feature-id>` on the working branch. When `MEMLIN_SESSION_ID` is available, the pin also follows that session. Use `memlin features pin --clear` to remove that pin. Default branches are rejected. Session notes, proposed memories, commit notes and new plans carry the binding as a hint; the server checks current access and project tracking before filing anything.

Pins, accepted handoffs and branch bindings can be cached locally for the exact account, project and session. Semantic suggestions are temporary. Automatically captured associations remain server-resolved through the session or branch and are not promoted into a local explicit feature hint.
