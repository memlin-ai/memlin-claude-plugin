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
- `memlin-role assign ""` — clear your roles

Roles are comma-separated and lower-cased. Assigning replaces the member's
current set wholesale; pass `""` to clear.
