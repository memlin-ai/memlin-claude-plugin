---
name: memlin-upload
description: Save a screenshot, report, log, or other file to the existing Memlin Library for review.
allowed-tools: Bash
argument-hint: '<path>... [--role screenshot|report|log|output|reference] [--scope project|private] [--json]'
---

# /memlin-upload

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/upload.js" "$ARGUMENTS"
```

Save actual files produced by the work. Use `--role screenshot` for design images, `--role report` for editable Markdown reports, and `--role log` for run logs. A linked project is the default home; otherwise the file is private. `--json` returns the verified hash and exact Library resource/version receipt.

Only files in the workspace or temporary directory are eligible. Credential paths and secret-bearing text are refused before any network call. Do not work around a refusal by copying a secret to a new path. A retry must use the printed `--upload-id` and the same file and options. Project uploads use the current server-confirmed session or branch feature binding when assist/auto policy allows filing. Use `--feature auto` for the same lookup, `--feature none` to save without an attachment, or `--feature <id|prefix>`, `--work-item <id>`, `--flow-stage <id>`, or `--thought <id>` for an explicit target. Add `--caption` for review context. Missing bindings and tracking-off projects still permit standalone Library uploads. A failed attachment leaves the file in the Library and can be retried with its upload ID. Saving does not create a public link.
