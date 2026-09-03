#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// packages/plugin-core/dist/edit-broker.js
import {
  mkdtempSync,
  readFileSync as readFileSync4,
  rmSync as rmSync2,
  writeFileSync as writeFileSync2
} from "node:fs";
import os7 from "node:os";
import path10 from "node:path";
import { execFileSync as execFileSync2, spawnSync } from "node:child_process";

// packages/plugin-core/dist/client.js
import { promises as fs4 } from "node:fs";
import path5 from "node:path";
import os4 from "node:os";
import { randomUUID as randomUUID3 } from "node:crypto";

// packages/plugin-core/dist/auth.js
import { promises as fs2 } from "node:fs";
import path2 from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

// packages/plugin-core/dist/atomic-rename.js
import { promises as fs } from "node:fs";
import path from "node:path";

// packages/plugin-core/dist/auth.js
var MEMLIN_PROD_AUTH0_DOMAIN = "memlin.us.auth0.com";
var MEMLIN_PROD_AUTH0_CLIENT_ID = "fyYMQ4Cxc6Nu5juVwL8Ihqq4fgAFecG9";
var AUTH0_DOMAIN = process.env.MEMLIN_AUTH0_DOMAIN || MEMLIN_PROD_AUTH0_DOMAIN;
var AUTH0_CLIENT_ID = process.env.MEMLIN_AUTH0_CLIENT_ID || MEMLIN_PROD_AUTH0_CLIENT_ID;
var AUTH0_AUDIENCE = process.env.MEMLIN_AUTH0_AUDIENCE ?? "https://api.memlin.ai";
var AUTH_FILE_LOCK_STALE_MS = 2 * 6e4;

// packages/plugin-core/dist/memlin-api-client.js
import { readFileSync } from "node:fs";
import os3 from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// packages/plugin-core/dist/runtime-shared.js
async function closeHttpSockets() {
  try {
    const dispatcher = globalThis[/* @__PURE__ */ Symbol.for("undici.globalDispatcher.1")];
    if (dispatcher && typeof dispatcher.close === "function") {
      let timer;
      await Promise.race([
        dispatcher.close(),
        new Promise((resolve) => {
          timer = setTimeout(resolve, 250);
          timer.unref?.();
        })
      ]).finally(() => {
        if (timer !== void 0) clearTimeout(timer);
      });
    }
  } catch {
  }
}

// packages/plugin-core/dist/host.js
import os2 from "node:os";
import path3 from "node:path";

// packages/plugin-core/dist/workspace-binding.js
import { randomUUID as randomUUID2 } from "node:crypto";
import { constants, promises as fs3 } from "node:fs";
import path4 from "node:path";
var GIT_POINTER_MAX_BYTES = 8 * 1024;

// packages/plugin-core/dist/hook-exit.js
var HOOK_WATCHDOG_MS = 2e3;
function releaseStdin() {
  try {
    const stdin = process.stdin;
    stdin.pause();
    stdin.unref?.();
  } catch {
  }
}
function exitHook(code) {
  process.exitCode = code;
  releaseStdin();
  void closeHttpSockets();
  setTimeout(() => process.exit(), HOOK_WATCHDOG_MS).unref();
}

// packages/plugin-core/dist/client.js
var CONFIG_DIR = path5.join(os4.homedir(), ".config", "memlin");
var TOKEN_FILE = path5.join(CONFIG_DIR, "token.json");

// packages/plugin-core/dist/edit-broker-local.js
import crypto from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync as readFileSync2,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import os5 from "node:os";
import path6 from "node:path";
import { execFileSync } from "node:child_process";
var LOCK_STALE_MS = 1e4;
var STATE_VERSION = 1;
function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function git(cwd, args) {
  try {
    return execFileSync("git", args, {
      cwd,
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 500
    }).trim() || null;
  } catch {
    return null;
  }
}
function canonical(value) {
  try {
    return realpathSync(value);
  } catch {
    return path6.resolve(value);
  }
}
function localBrokerIdentity(cwd) {
  const rootRaw = git(cwd, ["rev-parse", "--show-toplevel"]);
  const commonRaw = git(cwd, ["rev-parse", "--git-common-dir"]);
  if (!rootRaw || !commonRaw) return null;
  const root = canonical(rootRaw);
  const commonDir = canonical(
    path6.isAbsolute(commonRaw) ? commonRaw : path6.resolve(cwd, commonRaw)
  );
  const deviceId = digest(`${os5.hostname()}\0${os5.platform()}\0${os5.arch()}`);
  return {
    root,
    commonDir,
    worktreeId: digest(`${deviceId}\0${root}`),
    deviceId,
    branch: git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]),
    head: git(cwd, ["rev-parse", "HEAD"])
  };
}
function statePaths(identity) {
  const dir = path6.join(identity.commonDir, "memlin");
  return {
    dir,
    state: path6.join(dir, "edit-broker-state.json"),
    lock: path6.join(dir, "edit-broker.lock")
  };
}
function emptyState() {
  return { version: STATE_VERSION, worktrees: {}, leases: [] };
}
function readState(file) {
  try {
    const parsed = JSON.parse(readFileSync2(file, "utf8"));
    if (parsed?.version === STATE_VERSION && parsed.worktrees && Array.isArray(parsed.leases)) {
      return parsed;
    }
  } catch {
  }
  return emptyState();
}
function writeState(file, state) {
  const temp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  writeFileSync(temp, JSON.stringify(state), { mode: 384 });
  renameSync(temp, file);
}
function pause(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const until = Date.now() + ms;
    while (Date.now() < until) {
    }
  }
}
function withState(identity, mutate) {
  const files = statePaths(identity);
  mkdirSync(files.dir, { recursive: true, mode: 448 });
  let lockFd = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      lockFd = openSync(files.lock, "wx", 384);
      break;
    } catch {
      try {
        const lock = JSON.parse(readFileSync2(files.lock, "utf8"));
        if (typeof lock.at !== "number" || Date.now() - lock.at > LOCK_STALE_MS) {
          rmSync(files.lock, { force: true });
          continue;
        }
      } catch {
        rmSync(files.lock, { force: true });
        continue;
      }
      pause(25);
    }
  }
  if (lockFd === null) throw new Error("local edit-broker lock timed out");
  try {
    writeFileSync(lockFd, JSON.stringify({ pid: process.pid, at: Date.now() }));
    const state = readState(files.state);
    const now = Date.now();
    state.leases = state.leases.filter((lease) => lease.expiresAt > now);
    state.worktrees[identity.worktreeId] = {
      id: identity.worktreeId,
      root: identity.root,
      branch: identity.branch,
      head: identity.head,
      seenAt: now
    };
    const result = mutate(state);
    writeState(files.state, state);
    return result;
  } finally {
    closeSync(lockFd);
    rmSync(files.lock, { force: true });
  }
}
function releaseLocalWriteLeases(identity, sessionId, paths) {
  withState(identity, (state) => {
    state.leases = state.leases.filter(
      (lease) => !(lease.sessionId === sessionId && lease.worktreeId === identity.worktreeId && (!paths || paths.includes(lease.path)))
    );
  });
}

// packages/plugin-core/dist/edit-intent.js
import crypto2 from "node:crypto";
import { readFileSync as readFileSync3 } from "node:fs";
import path9 from "node:path";

// packages/plugin-core/dist/edit-activity.js
import { execSync as execSync2 } from "node:child_process";
import { realpathSync as realpathSync2 } from "node:fs";
import path8 from "node:path";
import os6 from "node:os";

// packages/plugin-core/dist/project-resolver.js
import { execSync } from "node:child_process";
import { existsSync as existsSync2, readdirSync } from "node:fs";
import path7 from "node:path";

// packages/plugin-core/dist/edit-activity.js
var EDIT_TOOLS = /* @__PURE__ */ new Set([
  "edit",
  "write",
  "multiedit",
  "notebookedit",
  "editnotebook"
]);
var APPLY_PATCH_TOOLS = /* @__PURE__ */ new Set(["applypatch", "apply_patch"]);
var SHELL_TOOLS = /* @__PURE__ */ new Set(["bash", "shell", "powershell"]);
function normalizedTool(toolName) {
  return toolName.replace(/[^A-Za-z_]/g, "").toLowerCase();
}
function editedPathsFromHook(toolName, toolInput) {
  if (!toolName || !toolInput) return [];
  const tool = normalizedTool(toolName);
  if (APPLY_PATCH_TOOLS.has(tool) || SHELL_TOOLS.has(tool)) {
    const patch = [
      toolInput.patch,
      toolInput.input,
      toolInput.content,
      SHELL_TOOLS.has(tool) ? toolInput.command : null
    ].find(
      (value) => typeof value === "string"
    );
    if (!patch || SHELL_TOOLS.has(tool) && !/\b(?:apply_patch|git\s+apply|patch)\b/i.test(patch)) {
      return [];
    }
    return [
      ...new Set(
        [...patch.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm)].map((match) => match[1]?.trim()).filter((value) => Boolean(value))
      )
    ];
  }
  if (!EDIT_TOOLS.has(tool)) return [];
  const p = typeof toolInput.file_path === "string" && toolInput.file_path || typeof toolInput.notebook_path === "string" && toolInput.notebook_path || null;
  return p ? [p] : [];
}
function gitToplevel(cwd) {
  try {
    const top = execSync2("git rev-parse --show-toplevel", {
      windowsHide: true,
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 250
    }).trim();
    return top || null;
  } catch {
    return null;
  }
}
function repoRelativePath(absPath, cwd) {
  const top = gitToplevel(cwd);
  if (top) {
    const canonicalWithMissingTail = (candidate) => {
      const tail = [];
      let cursor = path8.resolve(candidate);
      while (true) {
        try {
          return path8.join(realpathSync2(cursor), ...tail.reverse());
        } catch {
          const parent = path8.dirname(cursor);
          if (parent === cursor) return path8.resolve(candidate);
          tail.push(path8.basename(cursor));
          cursor = parent;
        }
      }
    };
    const rel = path8.relative(
      canonicalWithMissingTail(top),
      canonicalWithMissingTail(absPath)
    );
    if (rel && !rel.startsWith("..") && !path8.isAbsolute(rel)) return rel;
  }
  return path8.basename(absPath);
}

// packages/plugin-core/dist/edit-broker.js
function releaseEditBrokerTool(payload) {
  if (!payload.session_id) return;
  const cwd = payload.cwd ?? process.cwd();
  const identity = localBrokerIdentity(cwd);
  if (!identity) return;
  const paths = editedPathsFromHook(payload.tool_name, payload.tool_input).map(
    (file) => repoRelativePath(path10.resolve(cwd, file), cwd).replaceAll(path10.sep, "/")
  );
  releaseLocalWriteLeases(identity, payload.session_id, paths.length > 0 ? paths : void 0);
}

// apps/cli-plugin/src/hooks/post-tool-use-failure.ts
async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  let payload = {};
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
  }
  releaseEditBrokerTool({
    tool_name: payload.tool_name ?? "unknown",
    tool_input: payload.tool_input,
    cwd: payload.cwd ?? process.cwd(),
    ...payload.session_id ? { session_id: payload.session_id } : {}
  });
}
void main().then(
  () => exitHook(0),
  () => exitHook(0)
);
