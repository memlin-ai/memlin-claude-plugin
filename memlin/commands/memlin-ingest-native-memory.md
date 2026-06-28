---
name: memlin-ingest-native-memory
description: Pull this host's native auto-memory (MEMORY.md) into Memlin via the scribe dedup, so turning native memory off loses nothing. Usage - /memlin-ingest-native-memory [--dir <path>]
allowed-tools: Bash
---

# /memlin-ingest-native-memory

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/ingest-native-memory.js" $ARGUMENTS
```
