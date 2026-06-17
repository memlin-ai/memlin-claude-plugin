import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// packages/plugin-core/src/host.ts
import os from "node:os";
import path from "node:path";
var BaseHost = class {
  constructor(kind, home) {
    this.kind = kind;
    this.home = home;
  }
  kind;
  home;
  homeDir() {
    return this.home;
  }
  plansDir() {
    return path.join(this.home, "plans");
  }
};
var ClaudeCodeHost = class extends BaseHost {
  constructor() {
    super("claude-code", path.join(os.homedir(), ".claude"));
  }
};
var CursorHost = class extends BaseHost {
  constructor() {
    super("cursor", path.join(os.homedir(), ".config", "memlin"));
  }
};
var CodexHost = class extends BaseHost {
  constructor() {
    super("codex", path.join(os.homedir(), ".config", "memlin"));
  }
};
var WindsurfHost = class extends BaseHost {
  constructor() {
    super("windsurf", path.join(os.homedir(), ".config", "memlin"));
  }
};
var AntigravityHost = class extends BaseHost {
  constructor() {
    super("antigravity", path.join(os.homedir(), ".config", "memlin"));
  }
};
var HOSTS = {
  "claude-code": () => new ClaudeCodeHost(),
  cursor: () => new CursorHost(),
  codex: () => new CodexHost(),
  windsurf: () => new WindsurfHost(),
  antigravity: () => new AntigravityHost()
};
function resolveHost() {
  const envHost = process.env.MEMLIN_HOST ?? (process.env.CURSOR_AGENT ? "cursor" : "claude-code");
  const make = HOSTS[envHost];
  return (make ?? HOSTS["claude-code"])();
}

// packages/plugin-core/src/cli/command-guide.ts
var ROWS = [
  ["Discovery", "ask", "ask your workspace anything"],
  ["", "inbox", "review scribe proposals"],
  ["", "scribe", "extract from this session"],
  ["Sync", "sync", "pull + push in one shot"],
  ["", "pull", "server \u2192 local"],
  ["", "push", "local \u2192 server"],
  ["", "revert", "roll a doc back a version"],
  ["Plans", "push-plan", "upload a Claude Code plan"],
  ["", "pull-plans", "refresh local plans"],
  ["", "bind-plans", "assign unbound local plans"],
  ["Actions", "actions-list", "callable workspace tools"],
  ["", "actions-execute", "invoke one by id"],
  ["Audit", "audit-replay", "see the bundle an agent saw"],
  ["", "audit-explain", "why each item ranked there"],
  ["Coordination", "handoffs", "pass work between agents"],
  ["", "role", "assign roles to members/docs"],
  ["Setup & health", "status", "auth, account, project, sync state"],
  ["", "doctor", "diagnose why status is broken"],
  ["", "add-project", "register this workspace"],
  ["", "link", "pin a different account"]
];
function printCommandGuide(opts = {}) {
  const write = opts.write ?? ((line) => console.log(line));
  const host = resolveHost().kind;
  const isSlashHost = host === "claude-code" || host === "cursor";
  const fmt = (cmd) => isSlashHost ? `/memlin-${cmd}` : `memlin ${cmd}`;
  const helpRef = isSlashHost ? "`/memlin-help`" : "`memlin help`";
  const cmdCol = Math.max(...ROWS.map((r) => fmt(r[1]).length));
  if (opts.intro) {
    write("");
    write(`  What you can do from here (run ${helpRef} for this list anytime):`);
    write("");
  } else {
    write("memlin \u2014 Memlin commands");
    write("");
  }
  for (const [section, cmd, blurb] of ROWS) {
    const sectionCol = section.padEnd(16);
    const cmdStr = fmt(cmd).padEnd(cmdCol);
    write(`    ${sectionCol} ${cmdStr}  ${blurb}`);
  }
}
export {
  printCommandGuide
};
