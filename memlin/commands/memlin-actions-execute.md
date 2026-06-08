---
name: memlin-actions-execute
description: Invoke a Memlin action by id with JSON input. Usage - /memlin-actions-execute <id> --input '{"key":"value"}'
allowed-tools: Bash
argument-hint: <action-id> --input '<json>'
---

# /memlin-actions-execute

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/actions-execute.js" "$ARGUMENTS"
```

Find ids with `/memlin-actions-list`. Quote JSON so multi-word values survive the slash-command pipeline.
