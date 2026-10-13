---
name: memlin-role
description: Assign functional roles to a workspace member, or tag documents with roles. Functional roles (backend, sre, ...) let the resolver boost role-relevant memory and skills for the people who hold them.
allowed-tools: Bash
---

# /memlin-role

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/role.js" $ARGUMENTS
```

Functional roles are free-text discipline tags. The resolver gives a soft
boost to a document tagged for a role whenever it resolves context for a
member who holds that role — so a role's curated memory and skills surface
for the right people without crowding everyone else's bundles.

Common usage:

- `memlin-role assign backend,sre` — give yourself the backend + sre roles
- `memlin-role assign data --user <uuid>` — assign another member (owner/admin only)
- `memlin-role tag <document-id> sre` — tag a document into the sre role pack
- `memlin-role tag sre --project <uuid> --path-prefix runbooks/` — tag every
  matching document (owner/admin only)
- `memlin-role assign ""` — clear your roles

Roles are comma-separated and lower-cased. Assigning replaces the member's
current set wholesale; pass `""` to clear.

A selection is any of `--project <uuid>`, `--component <uuid>`, `--kind <kind>`
and `--path-prefix <prefix>`; together they narrow it. Add `--dry-run` to see
what would change first, and `--add` to merge into the tags already there
instead of replacing them. You can tag only documents you can read.

Two role names carry rights rather than ranking: `project_manager` (opens
owner-locked documents and the memory-security actions) and `support`
(switches on the feedback overlay). Only an owner or admin assigns those, and
a member who holds one asks an owner or admin to change their roles.
