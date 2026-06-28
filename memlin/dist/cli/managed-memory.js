#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// packages/plugin-core/src/plugin-install.ts
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
function defaultUserSettingsPaths() {
  const claudeDir = path.join(os.homedir(), ".claude");
  return { claudeDir, settingsFile: path.join(claudeDir, "settings.json") };
}
async function readClaudeUserSettings(paths) {
  const p = paths ?? defaultUserSettingsPaths();
  if (!existsSync(p.settingsFile)) return null;
  let raw;
  try {
    raw = await fs.readFile(p.settingsFile, "utf8");
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
async function applyManagedMemoryMode(mode, paths) {
  const p = paths ?? defaultUserSettingsPaths();
  try {
    await fs.mkdir(p.claudeDir, { recursive: true });
    let current = {};
    if (existsSync(p.settingsFile)) {
      const raw = await fs.readFile(p.settingsFile, "utf8");
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") current = parsed;
      } catch (err) {
        return {
          status: "failed",
          mode,
          settingsFile: p.settingsFile,
          changed: [],
          detail: `existing settings.json isn't valid JSON: ${err instanceof Error ? err.message : String(err)}`
        };
      }
    }
    const next = { ...current };
    const changed = [];
    if (mode === "disable") {
      if (current.autoMemoryEnabled !== false) {
        next.autoMemoryEnabled = false;
        changed.push("autoMemoryEnabled");
      }
    } else {
      if ("autoMemoryEnabled" in next) {
        delete next.autoMemoryEnabled;
        changed.push("autoMemoryEnabled");
      }
    }
    if (changed.length === 0) {
      return {
        status: "unchanged",
        mode,
        settingsFile: p.settingsFile,
        changed,
        detail: mode === "disable" ? "native auto-memory already disabled" : "no Memlin-managed memory setting to revert"
      };
    }
    await fs.writeFile(p.settingsFile, JSON.stringify(next, null, 2) + "\n", "utf8");
    return {
      status: "applied",
      mode,
      settingsFile: p.settingsFile,
      changed,
      detail: mode === "disable" ? "set autoMemoryEnabled: false \u2014 native auto-memory is off" : "removed Memlin-managed autoMemoryEnabled \u2014 reverted to host default"
    };
  } catch (err) {
    return {
      status: "failed",
      mode,
      settingsFile: p.settingsFile,
      changed: [],
      detail: err instanceof Error ? err.message : String(err)
    };
  }
}
function inspectManagedMemory(settings) {
  if (!settings) return { autoMemoryDisabled: false, autoMemoryConfigured: false };
  return {
    autoMemoryDisabled: settings.autoMemoryEnabled === false,
    autoMemoryConfigured: "autoMemoryEnabled" in settings
  };
}

// packages/plugin-core/src/cli/managed-memory.ts
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
    } else if (a === "--status") {
      out.status = true;
    } else if (a === "disable" || a === "off") {
      if (out.mode) return { error: "specify a single mode (disable | off)" };
      out.mode = a;
    } else if (a?.startsWith("-")) {
      return { error: `unknown flag: ${a}` };
    } else if (a) {
      return { error: `unknown argument: ${a} (expected 'disable' or 'off')` };
    }
  }
  return out;
}
function printHelp() {
  console.log(
    [
      "memlin managed-memory \u2014 hand memory to Memlin by turning off native auto-memory",
      "",
      "Usage:",
      "  memlin managed-memory            Show current state",
      "  memlin managed-memory --status   Show current state",
      "  memlin managed-memory disable    Turn off native auto-memory (autoMemoryEnabled: false)",
      "  memlin managed-memory off        Revert to the host default",
      "",
      "Only stops THIS host from keeping its own copy \u2014 Memlin keeps capturing,",
      "and everything Memlin stores is fully exportable (`memlin pull`, or",
      "Settings \u2192 Export memory). Reverse anytime with `memlin managed-memory off`."
    ].join("\n")
  );
}
async function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);
  if ("error" in parsed) {
    console.error(`memlin managed-memory: ${parsed.error}`);
    printHelp();
    process.exit(2);
  }
  if (parsed.help) {
    printHelp();
    process.exit(0);
  }
  const paths = defaultUserSettingsPaths();
  if (!parsed.mode || parsed.status) {
    const settings = await readClaudeUserSettings(paths);
    const presence = inspectManagedMemory(settings);
    if (presence.autoMemoryDisabled) {
      console.log("Native auto-memory: OFF (handed to Memlin).");
      console.log("  Revert with: memlin managed-memory off");
    } else if (presence.autoMemoryConfigured) {
      console.log("Native auto-memory: explicitly ON in settings.json.");
      console.log("  Hand it to Memlin with: memlin managed-memory disable");
    } else {
      console.log("Native auto-memory: host default (on for Claude Code).");
      console.log("  Hand it to Memlin with: memlin managed-memory disable");
    }
    console.log(`  Settings file: ${paths.settingsFile}`);
    return;
  }
  const result = await applyManagedMemoryMode(parsed.mode, paths);
  if (result.status === "failed") {
    console.error(`memlin managed-memory: ${result.detail}`);
    console.error(`  (settings file: ${result.settingsFile})`);
    process.exit(1);
  }
  console.log(result.detail);
  console.log(`  ${result.status === "applied" ? "wrote" : "unchanged"}: ${result.settingsFile}`);
  if (parsed.mode === "disable") {
    console.log("");
    console.log("Memlin keeps capturing \u2014 you lose nothing. Your memory stays fully");
    console.log("exportable: `memlin pull`, or Settings \u2192 Export memory in the web app.");
    console.log("Restart the agent for the change to take effect.");
    console.log("Reverse anytime: memlin managed-memory off");
  }
}
main().catch((err) => {
  console.error("memlin managed-memory failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
