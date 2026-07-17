#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/plugin-core/dist/companion-client.js
var companion_client_exports = {};
__export(companion_client_exports, {
  COMPANION_PROTOCOL: () => COMPANION_PROTOCOL,
  COMPANION_SOCKET_ENV: () => COMPANION_SOCKET_ENV,
  IS_COMPANION_ENV: () => IS_COMPANION_ENV,
  MAX_COMPANION_PROTOCOL: () => MAX_COMPANION_PROTOCOL,
  MIN_COMPANION_PROTOCOL: () => MIN_COMPANION_PROTOCOL,
  NO_COMPANION_ENV: () => NO_COMPANION_ENV,
  USE_COMPANION_ENV: () => USE_COMPANION_ENV,
  companionDelegationEnabled: () => companionDelegationEnabled,
  companionForDelegation: () => companionForDelegation,
  companionGetToken: () => companionGetToken,
  companionReportSession: () => companionReportSession,
  companionRequest: () => companionRequest,
  companionResolveWorkspace: () => companionResolveWorkspace,
  companionRunDir: () => companionRunDir,
  companionSocketPath: () => companionSocketPath,
  companionStatus: () => companionStatus,
  companionSyncNow: () => companionSyncNow,
  isCompanionHealthyForDelegation: () => isCompanionHealthyForDelegation,
  resetCompanionClientCache: () => resetCompanionClientCache
});
import http from "node:http";
import os from "node:os";
import path from "node:path";
function companionSocketPath(env = process.env) {
  const override = env[COMPANION_SOCKET_ENV];
  if (override) return override;
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\memlin-companion-${os.userInfo().username}`;
  }
  return path.join(os.homedir(), ".config", "memlin", "run", "companion.sock");
}
function companionRunDir() {
  return path.join(os.homedir(), ".config", "memlin", "run");
}
function companionDisabled(env = process.env) {
  const off = env[NO_COMPANION_ENV];
  if (off === "1" || off === "true" || off === "yes") return true;
  return env[IS_COMPANION_ENV] === "1";
}
async function companionRequest(method, body, opts = {}) {
  const env = opts.env ?? process.env;
  if (companionDisabled(env)) return null;
  if (Date.now() < socketDeadUntil) return null;
  const timeoutMs = opts.timeoutMs ?? CALL_TIMEOUTS[method] ?? DEFAULT_CALL_TIMEOUT_MS;
  const payload = JSON.stringify(body ?? {});
  return new Promise((resolve) => {
    let settled = false;
    const fail = (markDead) => {
      if (settled) return;
      settled = true;
      if (markDead) socketDeadUntil = Date.now() + SOCKET_DEAD_TTL_MS;
      resolve(null);
    };
    const req = http.request(
      {
        socketPath: companionSocketPath(env),
        path: `/v1/${method}`,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
          "memlin-client-protocol": String(COMPANION_PROTOCOL)
        },
        // Overall call budget; the connect phase gets its own tighter cap
        // below via the socket timeout before the connection exists.
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          if (settled) return;
          settled = true;
          if (res.statusCode !== 200) return resolve(null);
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch {
            resolve(null);
          }
        });
        res.on("error", () => fail(false));
      }
    );
    const connectTimer = setTimeout(() => {
      req.destroy();
      fail(true);
    }, CONNECT_TIMEOUT_MS);
    connectTimer.unref?.();
    req.on("socket", (socket) => {
      socket.once("connect", () => clearTimeout(connectTimer));
    });
    req.on("timeout", () => {
      req.destroy();
      fail(false);
    });
    req.on("error", () => fail(true));
    req.end(payload);
  });
}
async function companionStatus() {
  const status = await companionRequest("status.get", {});
  if (!status) return null;
  if (status.protocol < MIN_COMPANION_PROTOCOL || status.protocol > MAX_COMPANION_PROTOCOL) {
    return null;
  }
  return status;
}
async function companionGetToken() {
  const token = await companionRequest("token.get", {});
  if (!token || token.expires_at <= Date.now() + 6e4) return null;
  return token;
}
async function companionResolveWorkspace(cwd) {
  return companionRequest("workspace.resolve", { cwd });
}
async function companionSyncNow(req) {
  return companionRequest("sync.now", req);
}
async function companionReportSession(req) {
  return (await companionRequest("session.report", req))?.registered ?? false;
}
function isCompanionHealthyForDelegation(status) {
  if (!status) return false;
  if (status.auth.state !== "ok") return false;
  if (status.sync.mode === "realtime") return true;
  if (status.sync.mode !== "polling") return false;
  if (!status.sync.last_delta_at) return false;
  const age = Date.now() - Date.parse(status.sync.last_delta_at);
  return Number.isFinite(age) && age < 5 * 6e4;
}
function companionDelegationEnabled(env = process.env) {
  const v = env[USE_COMPANION_ENV];
  return v === "1" || v === "true" || v === "yes";
}
async function companionForDelegation() {
  if (!companionDelegationEnabled()) return null;
  const status = await companionStatus();
  return isCompanionHealthyForDelegation(status) ? status : null;
}
function resetCompanionClientCache() {
  socketDeadUntil = 0;
}
var COMPANION_PROTOCOL, MIN_COMPANION_PROTOCOL, MAX_COMPANION_PROTOCOL, NO_COMPANION_ENV, IS_COMPANION_ENV, COMPANION_SOCKET_ENV, CONNECT_TIMEOUT_MS, DEFAULT_CALL_TIMEOUT_MS, CALL_TIMEOUTS, socketDeadUntil, SOCKET_DEAD_TTL_MS, USE_COMPANION_ENV;
var init_companion_client = __esm({
  "packages/plugin-core/dist/companion-client.js"() {
    "use strict";
    COMPANION_PROTOCOL = 1;
    MIN_COMPANION_PROTOCOL = 1;
    MAX_COMPANION_PROTOCOL = 1;
    NO_COMPANION_ENV = "MEMLIN_NO_DAEMON";
    IS_COMPANION_ENV = "MEMLIN_DAEMON";
    COMPANION_SOCKET_ENV = "MEMLIN_COMPANION_SOCKET";
    CONNECT_TIMEOUT_MS = 150;
    DEFAULT_CALL_TIMEOUT_MS = 1e3;
    CALL_TIMEOUTS = {
      "workspace.resolve": 2e3,
      "sync.now": 5e3,
      "login.start": 1e4
    };
    socketDeadUntil = 0;
    SOCKET_DEAD_TTL_MS = 5e3;
    USE_COMPANION_ENV = "MEMLIN_USE_DAEMON";
  }
});

// packages/plugin-core/dist/host.js
import os3 from "node:os";
import path3 from "node:path";
function resolveHost() {
  const envHost = process.env.MEMLIN_HOST ?? (process.env.CURSOR_AGENT ? "cursor" : "claude-code");
  const make = HOSTS[envHost];
  return (make ?? HOSTS["claude-code"])();
}
var BaseHost, ClaudeCodeHost, CursorHost, CodexHost, WindsurfHost, AntigravityHost, VSCodeHost, CompanionHost, HOSTS;
var init_host = __esm({
  "packages/plugin-core/dist/host.js"() {
    "use strict";
    BaseHost = class {
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
        return path3.join(this.home, "plans");
      }
    };
    ClaudeCodeHost = class extends BaseHost {
      constructor() {
        super("claude-code", path3.join(os3.homedir(), ".claude"));
      }
    };
    CursorHost = class extends BaseHost {
      constructor() {
        super("cursor", path3.join(os3.homedir(), ".config", "memlin"));
      }
    };
    CodexHost = class extends BaseHost {
      constructor() {
        super("codex", path3.join(os3.homedir(), ".config", "memlin"));
      }
    };
    WindsurfHost = class extends BaseHost {
      constructor() {
        super("windsurf", path3.join(os3.homedir(), ".config", "memlin"));
      }
    };
    AntigravityHost = class extends BaseHost {
      constructor() {
        super("antigravity", path3.join(os3.homedir(), ".config", "memlin"));
      }
    };
    VSCodeHost = class extends BaseHost {
      constructor() {
        super("vscode", path3.join(os3.homedir(), ".config", "memlin"));
      }
    };
    CompanionHost = class extends BaseHost {
      constructor() {
        super("companion", path3.join(os3.homedir(), ".config", "memlin"));
      }
    };
    HOSTS = {
      "claude-code": () => new ClaudeCodeHost(),
      cursor: () => new CursorHost(),
      codex: () => new CodexHost(),
      windsurf: () => new WindsurfHost(),
      antigravity: () => new AntigravityHost(),
      vscode: () => new VSCodeHost(),
      companion: () => new CompanionHost()
    };
  }
});

// packages/plugin-core/dist/state.js
import { promises as fs4 } from "node:fs";
import path6 from "node:path";
import os6 from "node:os";
import crypto from "node:crypto";
async function readState() {
  try {
    const raw = await fs4.readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }
}
async function writeState(state) {
  await fs4.mkdir(path6.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  await fs4.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs4.rename(tmp, STATE_FILE);
}
async function acquireStateLock() {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (; ; ) {
    try {
      await fs4.mkdir(LOCK_DIR);
      return true;
    } catch {
      try {
        const stat = await fs4.stat(LOCK_DIR);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          await fs4.rmdir(LOCK_DIR).catch(() => {
          });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() >= deadline) return false;
      await new Promise((r) => setTimeout(r, LOCK_RETRY_MS));
    }
  }
}
async function releaseStateLock() {
  await fs4.rmdir(LOCK_DIR).catch(() => {
  });
}
async function updateState(mutate) {
  const locked = await acquireStateLock();
  try {
    const state = await readState();
    await mutate(state);
    await writeState(state);
    return state;
  } finally {
    if (locked) await releaseStateLock();
  }
}
function hash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}
var STATE_FILE, EMPTY, LOCK_DIR, LOCK_STALE_MS, LOCK_WAIT_MS, LOCK_RETRY_MS;
var init_state = __esm({
  "packages/plugin-core/dist/state.js"() {
    "use strict";
    STATE_FILE = path6.join(os6.homedir(), ".config", "memlin", "state.json");
    EMPTY = { documents: {} };
    LOCK_DIR = `${STATE_FILE}.lock`;
    LOCK_STALE_MS = 2e3;
    LOCK_WAIT_MS = 2e3;
    LOCK_RETRY_MS = 50;
  }
});

// packages/plugin-core/dist/plan-sync.js
var plan_sync_exports = {};
__export(plan_sync_exports, {
  getLastPlanPullCursor: () => getLastPlanPullCursor,
  listUnboundPlans: () => listUnboundPlans,
  pullPlans: () => pullPlans,
  pushPlanFile: () => pushPlanFile,
  reconcileKnownPlans: () => reconcileKnownPlans,
  resolveTargetDocId: () => resolveTargetDocId,
  setLastPlanPullCursor: () => setLastPlanPullCursor,
  stampPlanFile: () => stampPlanFile
});
import { promises as fs8 } from "node:fs";
import path11 from "node:path";
function homeBase(host) {
  return (host ?? resolveHost()).homeDir();
}
function plansDir(host) {
  return (host ?? resolveHost()).plansDir();
}
async function pullPlans(api, opts = {}) {
  const fetchOpts = {};
  if (opts.projectId !== void 0) fetchOpts.project_id = opts.projectId;
  if (opts.since) fetchOpts.updated_after = opts.since;
  const list = await api.listPlans(fetchOpts);
  await fs8.mkdir(plansDir(opts.host), { recursive: true });
  const state = await readState();
  const newEntries = {};
  const pulled = [];
  const unchanged = [];
  const removed = [];
  const isFullSync = !opts.since;
  const seenPaths = /* @__PURE__ */ new Set();
  for (const p of list) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
    const filename = `${p.document_id.slice(0, 8)}-${slug || "plan"}.md`;
    const localPath = path11.join("plans", filename);
    const full = path11.join(plansDir(opts.host), filename);
    seenPaths.add(localPath);
    let body;
    try {
      const detail = await api.getPlan(p.document_id);
      body = detail.body;
    } catch {
      continue;
    }
    const fileContent = formatPlanFile(p.title, body, p.status, {
      documentId: p.document_id,
      projectId: p.project_id
    });
    const contentHash = hash(fileContent);
    const existing = state.documents[localPath];
    if (existing?.content_hash === contentHash) {
      unchanged.push(localPath);
      continue;
    }
    await fs8.writeFile(full, fileContent, "utf8");
    pulled.push(localPath);
    newEntries[localPath] = {
      document_id: p.document_id,
      version_id: "",
      version_number: p.version_number,
      content_hash: contentHash,
      last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
      scope: p.scope ?? "personal",
      kind: "plan"
    };
  }
  await updateState((s) => {
    Object.assign(s.documents, newEntries);
    if (isFullSync) {
      for (const tracked of Object.keys(s.documents)) {
        if (!tracked.startsWith("plans/")) continue;
        if (seenPaths.has(tracked)) continue;
        delete s.documents[tracked];
      }
    }
  });
  return { pulled, unchanged, removed };
}
function resolveTargetDocId(stateEntry, binding) {
  return stateEntry?.document_id || binding?.documentId || void 0;
}
async function pushPlanFile(api, file, opts = {}) {
  const raw = await fs8.readFile(file, "utf8");
  const { title, body, binding: existingBinding } = parsePlanFile(raw);
  if (!body.trim()) {
    throw new Error("plan body is empty");
  }
  const relPath = path11.relative(homeBase(opts.host), file);
  const state = await readState();
  const existing = state.documents[relPath];
  const targetDocId = resolveTargetDocId(existing, existingBinding);
  if (targetDocId) {
    const result2 = await api.updatePlan(targetDocId, {
      body,
      title,
      commit_message: "edit from claude-code"
    });
    await stampPlanFile(file, {
      documentId: result2.document_id,
      projectId: existingBinding?.projectId ?? null
    });
    const stampedUpdate = await fs8.readFile(file, "utf8").catch(() => raw);
    await updateState((s) => {
      s.documents[relPath] = {
        document_id: result2.document_id,
        version_id: existing?.version_id ?? "",
        version_number: result2.version_number,
        content_hash: hash(stampedUpdate),
        last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
        scope: existing?.scope ?? (existingBinding?.projectId ? "project" : "personal"),
        kind: "plan"
      };
    });
    return {
      document_id: result2.document_id,
      version_number: result2.version_number,
      created: false
    };
  }
  const result = await api.pushPlan({
    title,
    body,
    cwd: opts.cwd ?? null,
    git_remote: opts.gitRemote ?? null
  });
  await updateState((s) => {
    s.documents[relPath] = {
      document_id: result.document_id,
      version_id: "",
      version_number: result.version_number,
      content_hash: hash(raw),
      last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
      scope: result.project_id ? "project" : "personal",
      kind: "plan"
    };
  });
  await stampPlanFile(file, {
    documentId: result.document_id,
    projectId: result.project_id
  });
  const stamped = await fs8.readFile(file, "utf8").catch(() => raw);
  await updateState((s) => {
    const entry = s.documents[relPath];
    if (entry) entry.content_hash = hash(stamped);
  });
  return {
    document_id: result.document_id,
    version_number: result.version_number,
    created: true
  };
}
async function reconcileKnownPlans(api, opts = {}) {
  const pushed = [];
  const skipped = [];
  const failed = [];
  let entries;
  try {
    entries = await fs8.readdir(plansDir(opts.host));
  } catch {
    return { pushed, skipped, failed };
  }
  const state = await readState();
  for (const f of entries) {
    if (!f.endsWith(".md")) continue;
    const abs = path11.join(plansDir(opts.host), f);
    let raw;
    try {
      const st = await fs8.stat(abs);
      if (!st.isFile() || st.size === 0) continue;
      raw = await fs8.readFile(abs, "utf8");
    } catch {
      continue;
    }
    const relPath = path11.relative(homeBase(opts.host), abs);
    const tracked = state.documents[relPath]?.document_id;
    const { binding } = parsePlanFile(raw);
    const isKnown = Boolean(tracked) || Boolean(binding?.documentId);
    if (!isKnown) {
      skipped.push(f);
      continue;
    }
    if (tracked && state.documents[relPath]?.content_hash === hash(raw)) {
      skipped.push(f);
      continue;
    }
    try {
      const result = await pushPlanFile(api, abs, opts);
      pushed.push(`${f} (v${result.version_number})`);
    } catch (err) {
      failed.push(`${f}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { pushed, skipped, failed };
}
async function listUnboundPlans(host) {
  const out = [];
  let entries;
  try {
    entries = await fs8.readdir(plansDir(host));
  } catch {
    return out;
  }
  const state = await readState();
  for (const f of entries) {
    if (!f.endsWith(".md")) continue;
    const abs = path11.join(plansDir(host), f);
    let raw;
    let size = 0;
    try {
      const st = await fs8.stat(abs);
      if (!st.isFile() || st.size === 0) continue;
      size = st.size;
      raw = await fs8.readFile(abs, "utf8");
    } catch {
      continue;
    }
    const relPath = path11.relative(homeBase(host), abs);
    const { title, binding } = parsePlanFile(raw);
    if (state.documents[relPath]?.document_id || binding?.documentId) continue;
    out.push({ file: f, title, size });
  }
  return out;
}
async function stampPlanFile(file, binding) {
  let raw;
  try {
    raw = await fs8.readFile(file, "utf8");
  } catch {
    return;
  }
  const parsed = parsePlanFile(raw);
  const stampLine = `<!-- memlin-binding: doc=${binding.documentId} project=${binding.projectId ?? "none"} -->`;
  const bodyNoStamp = parsed.body.replace(/<!--\s*memlin-binding:[^>]*-->\s*\n?/g, "");
  const composed = [
    `# ${parsed.title}`,
    "",
    parsed.status ? `<!-- memlin-plan-status: ${parsed.status} -->` : null,
    stampLine,
    "",
    bodyNoStamp.trim(),
    ""
  ].filter((l) => l !== null).join("\n");
  await fs8.writeFile(file, composed, "utf8");
}
function formatPlanFile(title, body, status, binding) {
  const trimmedBody = body.replace(/^\s*#\s+.+\n+/, "").trimEnd();
  const lines = [`# ${title}`, "", `<!-- memlin-plan-status: ${status} -->`];
  if (binding) {
    lines.push(
      `<!-- memlin-binding: doc=${binding.documentId} project=${binding.projectId ?? "none"} -->`
    );
  }
  lines.push("", trimmedBody, "");
  return lines.join("\n");
}
function parsePlanFile(raw) {
  const firstNl = raw.indexOf("\n");
  const first = firstNl === -1 ? raw : raw.slice(0, firstNl);
  const title = first.replace(/^#\s+/, "").trim() || "(untitled plan)";
  const rest = firstNl === -1 ? "" : raw.slice(firstNl + 1).trim();
  const statusMatch = rest.match(/<!--\s*memlin-plan-status:\s*([a-z_]+)\s*-->/);
  const status = statusMatch ? statusMatch[1] ?? null : null;
  const bindMatch = rest.match(/<!--\s*memlin-binding:\s*doc=([0-9a-f-]+)\s+project=(\S+)\s*-->/i);
  const binding = bindMatch ? {
    documentId: bindMatch[1],
    projectId: bindMatch[2] === "none" ? null : bindMatch[2] ?? null
  } : null;
  const body = rest.replace(/<!--\s*memlin-plan-status:[^>]*-->\s*\n?/g, "").replace(/<!--\s*memlin-binding:[^>]*-->\s*\n?/g, "").trim();
  return { title, body, status, binding };
}
function getLastPlanPullCursor(state) {
  return state.last_plan_pull_at;
}
function setLastPlanPullCursor(state, at) {
  state.last_plan_pull_at = at;
}
var init_plan_sync = __esm({
  "packages/plugin-core/dist/plan-sync.js"() {
    "use strict";
    init_state();
    init_host();
  }
});

// packages/plugin-core/dist/client.js
import { promises as fs3 } from "node:fs";
import path5 from "node:path";
import os5 from "node:os";
import { randomUUID as randomUUID3 } from "node:crypto";

// packages/plugin-core/dist/auth.js
import { promises as fs } from "node:fs";
import path2 from "node:path";
import os2 from "node:os";
import { randomUUID } from "node:crypto";
var MEMLIN_PROD_AUTH0_DOMAIN = "memlin.us.auth0.com";
var MEMLIN_PROD_AUTH0_CLIENT_ID = "fyYMQ4Cxc6Nu5juVwL8Ihqq4fgAFecG9";
var AUTH0_DOMAIN = process.env.MEMLIN_AUTH0_DOMAIN || MEMLIN_PROD_AUTH0_DOMAIN;
var AUTH0_CLIENT_ID = process.env.MEMLIN_AUTH0_CLIENT_ID || MEMLIN_PROD_AUTH0_CLIENT_ID;
var AUTH0_AUDIENCE = process.env.MEMLIN_AUTH0_AUDIENCE ?? "https://api.memlin.ai";
function persistedTokenFilePath() {
  return process.env.MEMLIN_TOKEN_FILE || path2.join(os2.homedir(), ".config", "memlin", "token.json");
}
var AUTH_FILE_LOCK_TIMEOUT_MS = 15e3;
var AUTH_FILE_LOCK_STALE_MS = 2 * 6e4;
var AUTH_FILE_LOCK_RETRY_MS = 50;
function authFileLockPath() {
  return `${persistedTokenFilePath()}.auth.lock`;
}
async function acquireAuthFileLock() {
  const file = authFileLockPath();
  const owner = `${process.pid}:${randomUUID()}`;
  await fs.mkdir(path2.dirname(file), { recursive: true });
  const deadline = Date.now() + AUTH_FILE_LOCK_TIMEOUT_MS;
  while (true) {
    try {
      const handle = await fs.open(file, "wx", 384);
      try {
        await handle.writeFile(owner, "utf8");
        await handle.sync();
      } catch (error) {
        await handle.close().catch(() => {
        });
        await fs.rm(file, { force: true }).catch(() => {
        });
        throw error;
      }
      let released = false;
      return async () => {
        if (released) return;
        released = true;
        await handle.close().catch(() => {
        });
        const currentOwner = await fs.readFile(file, "utf8").catch(() => null);
        if (currentOwner === owner) await fs.rm(file, { force: true }).catch(() => {
        });
      };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        const stat = await fs.stat(file);
        if (Date.now() - stat.mtimeMs > AUTH_FILE_LOCK_STALE_MS) {
          await fs.rm(file, { force: true });
          continue;
        }
      } catch (statError) {
        if (statError.code === "ENOENT") continue;
        throw statError;
      }
      if (Date.now() >= deadline) {
        throw new Error("another Memlin sign-in or token refresh is still being saved");
      }
      await new Promise((resolve) => setTimeout(resolve, AUTH_FILE_LOCK_RETRY_MS));
    }
  }
}
async function withAuthFileLock(operation) {
  const release = await acquireAuthFileLock();
  try {
    return await operation();
  } finally {
    await release();
  }
}
async function readPersistedToken() {
  try {
    const raw = await fs.readFile(persistedTokenFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function writePersistedToken(t) {
  const file = persistedTokenFilePath();
  await fs.mkdir(path2.dirname(file), { recursive: true });
  const tmp = path2.join(
    path2.dirname(file),
    `${path2.basename(file)}.tmp-${process.pid}-${randomUUID()}`
  );
  await fs.writeFile(tmp, JSON.stringify(t, null, 2), { mode: 384 });
  await fs.chmod(tmp, 384).catch(() => {
  });
  await fs.rename(tmp, file);
}
async function refreshAccessToken(refreshToken) {
  requireClientId();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: AUTH0_CLIENT_ID
  });
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!res.ok) {
    throw new Error(`refresh: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return toPersisted(json, refreshToken);
}
var refreshInFlight = null;
var DEFAULT_FRESHNESS_MARGIN_MS = 6e4;
async function getValidAccessToken() {
  return ensureFreshToken(DEFAULT_FRESHNESS_MARGIN_MS);
}
async function ensureFreshToken(marginMs = DEFAULT_FRESHNESS_MARGIN_MS) {
  const persisted = await readPersistedToken();
  if (!persisted) throw new Error("not signed in \u2014 run `memlin login`");
  if (Date.now() < persisted.expires_at - marginMs) return persisted.access_token;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefresh(persisted, marginMs).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}
async function doRefresh(stale, marginMs) {
  const latest = await readPersistedToken();
  if (latest && Date.now() < latest.expires_at - marginMs) return latest.access_token;
  try {
    const { companionGetToken: companionGetToken2 } = await Promise.resolve().then(() => (init_companion_client(), companion_client_exports));
    const fromDaemon = await companionGetToken2();
    if (fromDaemon && Date.now() < fromDaemon.expires_at - marginMs) {
      return fromDaemon.access_token;
    }
  } catch {
  }
  const refreshSource = latest ?? stale;
  const refreshToken = refreshSource.refresh_token;
  if (!refreshToken) {
    throw new Error("access token expired and no refresh token saved \u2014 run `memlin login`");
  }
  try {
    const fresh = await refreshAccessToken(refreshToken);
    return await withAuthFileLock(async () => {
      const beforeWrite = await readPersistedToken();
      if (!beforeWrite || beforeWrite.access_token !== refreshSource.access_token) {
        if (beforeWrite && Date.now() < beforeWrite.expires_at - marginMs) {
          return beforeWrite.access_token;
        }
        throw new Error("saved Memlin credentials changed while the token was refreshing");
      }
      await writePersistedToken(fresh);
      return fresh.access_token;
    });
  } catch (err) {
    const after = await readPersistedToken();
    if (after && after.access_token !== refreshSource.access_token && Date.now() < after.expires_at - 6e4) {
      return after.access_token;
    }
    throw new Error(
      `access token refresh failed (${err instanceof Error ? err.message : String(err)}) \u2014 run \`memlin login\``
    );
  }
}
function toPersisted(json, fallbackRefresh) {
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? fallbackRefresh,
    expires_at: Date.now() + json.expires_in * 1e3
  };
}
function requireClientId() {
  if (!AUTH0_CLIENT_ID) {
    throw new Error(
      "Auth0 client id not configured. Set MEMLIN_AUTH0_CLIENT_ID env var (and optionally MEMLIN_AUTH0_DOMAIN / MEMLIN_AUTH0_AUDIENCE for self-hosted setups)."
    );
  }
}
function decodeJwtPayload(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("not a JWT");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

// packages/plugin-core/dist/memlin-api-client.js
import { readFileSync } from "node:fs";
import os4 from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// packages/plugin-core/dist/runtime-shared.js
var AGENT_KIND_HEADER = "Memlin-Agent-Kind";
var AGENT_DEVICE_HEADER = "Memlin-Agent-Device";
var AGENT_VERSION_HEADER = "Memlin-Agent-Version";
var AGENT_CAPABILITIES_HEADER = "Memlin-Agent-Capabilities";
var AGENT_PLATFORM_HEADER = "Memlin-Agent-Platform";
var AGENT_ARCHITECTURE_HEADER = "Memlin-Agent-Architecture";
var AGENT_EXPECTED_CAPABILITIES = {
  "claude-code": ["cli", "commands", "hooks", "sync", "scribe", "resolve"],
  cursor: ["mcp", "commands", "hooks", "rules", "scribe", "resolve"],
  codex: ["mcp", "cli", "hooks", "rules", "scribe", "resolve"],
  windsurf: ["mcp", "cli", "hooks", "rules", "scribe", "resolve"],
  // VS Code (apps/vscode-extension): MCP + CLI + copilot-instructions; plain
  // VS Code has no lifecycle-hook or slash-command surface.
  vscode: ["mcp", "cli", "rules", "resolve"],
  gemini: ["mcp", "rules", "resolve"],
  grok: ["mcp", "rules", "resolve"],
  hermes: ["mcp", "resolve"],
  openclaw: ["mcp", "rules", "resolve"],
  antigravity: ["mcp", "cli", "hooks", "commands", "rules", "sync", "scribe", "resolve"],
  mcp: ["mcp", "resolve"],
  "claude-ai": ["mcp", "resolve"],
  // Companion daemon (apps/companion): background token keeper + realtime
  // plan sync + local IPC socket other agents delegate to. No hooks/commands
  // of its own.
  companion: ["cli", "sync", "realtime", "resolve"]
};
var PROVIDER_HOSTS = [
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "dev.azure.com",
  "ssh.dev.azure.com",
  "codeberg.org",
  "sr.ht",
  "git.sr.ht"
];
function normalizeGitRemote(raw) {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  s = s.replace(/^git@([^:]+):/, "https://$1/");
  s = s.replace(/^ssh:\/\//, "");
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^git@/, "");
  s = s.replace(/\.git$/, "");
  s = s.replace(/\/$/, "");
  const slash = s.indexOf("/");
  if (slash > 0) {
    const host = s.slice(0, slash);
    const rest = s.slice(slash);
    for (const provider of PROVIDER_HOSTS) {
      if (host === provider) break;
      if (host.startsWith(provider + "-")) {
        s = provider + rest;
        break;
      }
    }
  }
  return s || null;
}
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

// packages/plugin-core/dist/memlin-api-client.js
init_host();
var DEFAULT_API_URL = "https://memlin.ai/api/v1";
function agentDevice() {
  return process.env.MEMLIN_AGENT_DEVICE || os4.hostname() || "unknown";
}
var cachedAgentVersion = null;
function agentVersion() {
  if (cachedAgentVersion) return cachedAgentVersion;
  cachedAgentVersion = "0.2.51";
  return cachedAgentVersion;
}
function agentCapabilities() {
  return AGENT_EXPECTED_CAPABILITIES[resolveHost().kind] ?? ["api", "resolve"];
}
var MemlinApiClient = class {
  constructor(cfg) {
    this.cfg = cfg;
  }
  cfg;
  // ---------- low-level ----------
  async authHeaders(includeAccount = true) {
    const token = await this.cfg.getAccessToken();
    const h = {
      Authorization: `Bearer ${token}`,
      [AGENT_KIND_HEADER]: resolveHost().kind,
      [AGENT_DEVICE_HEADER]: agentDevice(),
      [AGENT_VERSION_HEADER]: agentVersion(),
      [AGENT_CAPABILITIES_HEADER]: agentCapabilities().join(","),
      [AGENT_PLATFORM_HEADER]: process.env.MEMLIN_AGENT_PLATFORM || os4.platform(),
      [AGENT_ARCHITECTURE_HEADER]: process.env.MEMLIN_AGENT_ARCH || os4.arch()
    };
    if (includeAccount && this.cfg.accountId) {
      h["Memlin-Account-Id"] = this.cfg.accountId;
    }
    return h;
  }
  async request(method, pathAndQuery, body, opts = {}) {
    const url = `${this.cfg.baseUrl.replace(/\/+$/, "")}${pathAndQuery}`;
    const baseHeaders = await this.authHeaders(opts.includeAccount ?? true);
    if (opts.accountId) {
      baseHeaders["Memlin-Account-Id"] = opts.accountId;
    }
    const headers = {
      ...baseHeaders,
      Accept: "application/json"
    };
    if (body !== void 0) headers["Content-Type"] = "application/json";
    const res = await fetch(url, {
      method,
      headers,
      ...body !== void 0 ? { body: JSON.stringify(body) } : {}
    });
    const text = await res.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
      }
    }
    if (!res.ok) {
      const errMsg = parsed?.error ?? text ?? `HTTP ${res.status}`;
      throw new Error(`${method} ${pathAndQuery} \u2192 ${res.status}: ${errMsg}`);
    }
    return parsed;
  }
  // ---------- endpoints ----------
  /** GET /me — identity + account list. No account header sent (this is the discovery call). */
  async me() {
    return this.request("GET", "/me", void 0, { includeAccount: false });
  }
  /**
   * GET /realtime/config — Supabase connection info for the caller's
   * effective account. The client config file is deliberately
   * backend-agnostic (no Supabase URL / anon key), so Realtime subscribers
   * — the Companion daemon (packages/companion-core) — bootstrap the
   * connection from here. Dedicated-instance (paid org) accounts get THEIR
   * instance's values, which is why this rides normal account-header auth.
   */
  async getRealtimeConfig(opts = {}) {
    return this.request("GET", "/realtime/config", void 0, { accountId: opts.accountId });
  }
  /**
   * POST /roles/assign — set a member's functional roles (backend, sre,
   * ...). Defaults to the caller; pass user_id to assign another member
   * (owner/admin only). Replaces the member's set wholesale.
   */
  async assignRoles(input, opts = {}) {
    return this.request("POST", "/roles/assign", input, {
      accountId: opts.accountId
    });
  }
  /**
   * POST /roles/tag — tag a document into one or more role packs. The
   * resolver boosts the document for members holding a matching role.
   * Replaces the document's role tags wholesale.
   */
  async tagDocumentRoles(input, opts = {}) {
    return this.request("POST", "/roles/tag", input, {
      accountId: opts.accountId
    });
  }
  /**
   * POST /documents/pin — force-include ("pin") a document, or unpin it.
   * A pinned doc is fetched out-of-band by the resolver on every resolve in
   * scope (no similarity threshold) and reserved budget off the top — a
   * standing directive, not a similarity hit. Owner/admin-only server-side.
   */
  async setDocumentPinned(input, opts = {}) {
    return this.request("POST", "/documents/pin", input, {
      accountId: opts.accountId
    });
  }
  /** GET /decisions/enforce — pull the guardrail rules currently
   *  in effect for the caller's account (and optionally a project).
   *  Returns kind='decision' docs whose `metadata.enforce` is set —
   *  the PreToolUse handler in plugin-core's pre-tool-use-handler
   *  module is the primary caller. */
  async listEnforceDecisions(opts = {}) {
    const qs = new URLSearchParams();
    if (opts.project_id !== void 0) {
      qs.set("project_id", opts.project_id === null ? "null" : opts.project_id);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.request("GET", `/decisions/enforce${suffix}`);
  }
  /** POST /usage/event — write a usage_events row from the client.
   *  Server-side enforces an allowlist of event_types (today:
   *  tool.guardrail, action.invoke, resolve.outcome, edit.activity,
   *  resolve.delivery) and re-derives account_id and user_id from the auth
   *  context so callers can't forge rows for other workspaces.
   *  `opts.accountId` routes the write to a non-default account
   *  (multi-account workspaces). */
  async writeUsageEvent(input, opts = {}) {
    return this.request("POST", "/usage/event", input, { accountId: opts.accountId });
  }
  /** GET /documents — list, filtered. */
  async listDocuments(opts = {}, callOpts = {}) {
    const qs = new URLSearchParams();
    if (opts.kinds) for (const k of opts.kinds) qs.append("kind", k);
    if (opts.scopes) for (const s of opts.scopes) qs.append("scope", s);
    if (opts.statuses) for (const s of opts.statuses) qs.append("status", s);
    if (opts.project_id !== void 0) {
      qs.set("project_id", opts.project_id === null ? "null" : opts.project_id);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await this.request("GET", `/documents${suffix}`, void 0, { accountId: callOpts.accountId });
    return res.documents.map((d) => {
      const { status, ...rest } = d;
      return status == null ? rest : { ...rest, status };
    });
  }
  /** POST /documents — create or update a document. */
  async writeDocument(input, callOpts = {}) {
    return this.request("POST", "/documents", input, {
      accountId: callOpts.accountId
    });
  }
  /** Atomically compare-and-sync the server-owned project CONTRACT.md. */
  async syncWorkspaceContract(input) {
    return this.request("POST", "/workspace-contract/sync", input);
  }
  /** GET /documents/{id} — fetch one doc with body + metadata. */
  async getDocument(documentId) {
    return this.request("GET", `/documents/${encodeURIComponent(documentId)}`);
  }
  /** POST /documents/{id}/contract-verification — H12. Record a contract
   *  check. Used by `memlin diff --record`. */
  async recordContractVerification(documentId, body) {
    return this.request(
      "POST",
      `/documents/${encodeURIComponent(documentId)}/contract-verification`,
      body
    );
  }
  /** GET /documents/{id}/versions — history. */
  async listVersions(documentId) {
    const res = await this.request(
      "GET",
      `/documents/${encodeURIComponent(documentId)}/versions`
    );
    return res.versions;
  }
  /** POST /documents/{id}/revert — non-destructive revert to an older version. */
  async revertDocument(documentId, targetVersionId, commitMessage) {
    const res = await this.request(
      "POST",
      `/documents/${encodeURIComponent(documentId)}/revert`,
      {
        target_version_id: targetVersionId,
        ...commitMessage ? { commit_message: commitMessage } : {}
      }
    );
    return res.new_version_id;
  }
  /** GET /inbox — pending scribe proposals (newest first), plus recently
   *  auto-activated correction rules (so the user can see what stuck + undo).
   *  Pass `opts.accountId` to read a different account's inbox than the pinned
   *  one (e.g. `memlin status` showing the resolver-effective account). */
  async listInbox(opts = {}) {
    return this.request("GET", "/inbox", void 0, { accountId: opts.accountId });
  }
  /** GET /insights — pending derived insights, including auto-memory proposals. */
  async listInsights(params = {}, opts = {}) {
    const search = new URLSearchParams();
    if (params.kind) search.set("kind", params.kind);
    if (params.status) search.set("status", params.status);
    if (params.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return this.request(
      "GET",
      `/insights${qs ? `?${qs}` : ""}`,
      void 0,
      { accountId: opts.accountId }
    );
  }
  async resolveInsight(insightId, action) {
    return this.request("POST", `/insights/${encodeURIComponent(insightId)}/resolve`, { action });
  }
  /** POST /inbox/{id} — accept or reject a proposal. */
  async resolveProposal(proposalId, action) {
    return this.request("POST", `/inbox/${encodeURIComponent(proposalId)}`, {
      action
    });
  }
  async listHandoffs(opts = {}) {
    const qs = new URLSearchParams();
    if (opts.project_id) qs.set("project_id", opts.project_id);
    if (opts.target_agent_kind) qs.set("target_agent_kind", opts.target_agent_kind);
    if (opts.status) qs.set("status", opts.status);
    if (opts.limit) qs.set("limit", String(opts.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.request("GET", `/handoffs${suffix}`);
  }
  async updateHandoff(handoffId, action) {
    return this.request("PATCH", `/handoffs/${encodeURIComponent(handoffId)}`, {
      action
    });
  }
  async createHandoff(input) {
    return this.request("POST", "/handoffs", input);
  }
  async listFeatures(opts = {}) {
    const qs = new URLSearchParams();
    if (opts.project_id) qs.set("project_id", opts.project_id);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.request("GET", `/features${suffix}`);
  }
  async createFeature(input) {
    return this.request("POST", "/features", input);
  }
  async addFeatureMember(featureId, source) {
    return this.request("POST", `/features/${featureId}/members`, { source });
  }
  /** POST /documents/search — semantic + text. */
  async search(query, opts = {}) {
    const res = await this.request("POST", "/documents/search", {
      query,
      ...opts
    });
    return res.hits;
  }
  /** GET /documents?q=... — fuzzy title/path lookup. Used by `memlin revert`. */
  async findDocumentsByName(needle, limit = 10) {
    const qs = new URLSearchParams({ q: needle, limit: String(limit) });
    const res = await this.request("GET", `/documents?${qs.toString()}`);
    return res.documents;
  }
  /**
   * POST /resolve — the marquee context-assembly endpoint.
   *
   * `cwd` and `git_remote` let the server infer the caller's active component
   * (when the project has any defined) and apply a soft +0.15 boost to
   * docs tagged to that component. Both are optional; omitting them yields
   * the same project-wide ranking we used pre-component-awareness.
   */
  async resolve(args, opts = {}) {
    return this.request("POST", "/resolve", args, {
      accountId: opts.accountId
    });
  }
  /**
   * GET /account — name/tier/kind for the current account.
   *
   * Pass `opts.accountId` to target an account other than the pinned one.
   * `memlin status` uses this to show the resolver-effective account in a
   * multi-account workspace, so the returned `id` and `name` always describe
   * the same account (no global-default/pinned-name mismatch).
   */
  async getAccount(opts = {}) {
    return this.request("GET", "/account", void 0, { accountId: opts.accountId });
  }
  /**
   * POST /projects/resolve — server-side project resolution.
   *
   * Returns `account_id` when a project matches in any account the user
   * has access to (via the JWT's memlin_account_ids claim) — not just the
   * one pinned in config. Callers use the returned account_id to retarget
   * the actual resolve / write call to the right backend.
   */
  async resolveProject(input) {
    return this.request("POST", "/projects/resolve", input);
  }
  /**
   * POST /deploy-guard — acquire or release the per-project deploy lease.
   *
   * The PreToolUse deploy hook calls `acquire` before a deploy command runs;
   * the PostToolUse hook calls `release` after. `acquired: false` means another
   * session already holds an active lease (the hook then warns or blocks).
   * project_id is passed explicitly — the hook resolves it from cwd first.
   */
  async deployGuard(input, opts = {}) {
    return this.request("POST", "/deploy-guard", input, { accountId: opts.accountId });
  }
  /**
   * POST /edit-guard — real-time, pre-edit file-collision check.
   *
   * The PreToolUse hook calls this before an Edit/Write/MultiEdit, passing the
   * repo-relative path(s) about to change. The server reads the same
   * `edit.activity` feed the resolver's recent_file_edits uses and returns any
   * LIVE collisions — other sessions that edited the same path within the last
   * ~10 min — so the hook can warn or block. Read-only; never mutates.
   * project_id is passed explicitly (the hook resolves it from cwd first).
   */
  async editGuard(input, opts = {}) {
    return this.request("POST", "/edit-guard", input, { accountId: opts.accountId });
  }
  /** GET /audit/<id>/replay — reconstruct a past resolve's exact bundle. */
  async replayAudit(auditId) {
    return this.request("GET", `/audit/${auditId}/replay`);
  }
  /** GET /audit/<id>/explain — per-item decomposition of a past resolve's
   *  ranking arithmetic (similarity, kind weight, component boost, rerank,
   *  decay) plus human-readable reasons. The "homework, shown" companion
   *  to /replay. */
  async explainAudit(auditId) {
    return this.request("GET", `/audit/${auditId}/explain`);
  }
  /** GET /actions — list approved actions in the workspace. Same shape
   *  the memlin_actions_list MCP tool returns. */
  async listActions(opts = {}) {
    const q = [];
    if (opts.filter) q.push(`filter=${encodeURIComponent(opts.filter)}`);
    if (opts.limit !== void 0) q.push(`limit=${opts.limit}`);
    const qs = q.length > 0 ? `?${q.join("&")}` : "";
    const { actions } = await this.request("GET", `/actions${qs}`);
    return actions;
  }
  /** POST /actions/<id>/execute — invoke a callable action by id with
   *  validated input. Returns the result + audit_id. */
  async executeAction(actionId, input) {
    return this.request("POST", `/actions/${actionId}/execute`, { input });
  }
  /** POST /prompt-ci — run Prompt CI regression tests for a skill. */
  async runPromptCi(skillId, content) {
    return this.request("POST", "/prompt-ci", { skill_id: skillId, content });
  }
  /**
   * POST /memory/propose — extract memory candidates from a recent agent
   * turn and queue them for user accept/dismiss. Fire-and-forget from the
   * Stop hook's perspective; the server runs a cheap Haiku extraction and
   * silently no-ops if it finds nothing worth remembering.
   */
  async proposeMemory(input, opts = {}) {
    return this.request("POST", "/memory/propose", input, { accountId: opts.accountId });
  }
  /**
   * POST /scribe/diff — Phase 2 auto-capture from a single git commit.
   *
   * Called by the PostToolUse hook after the agent runs `git commit`.
   * The server reads the commit message + diff, asks Haiku to extract
   * any decision/memory/skill baked into the change, and persists
   * results as documents with metadata.status='proposed'. They appear
   * in the user's inbox until accepted.
   */
  async scribeDiff(input, opts = {}) {
    return this.request("POST", "/scribe/diff", input, { accountId: opts.accountId });
  }
  /**
   * POST /scribe/session — Phase 1 auto-capture from a Claude Code
   * session transcript. Server slices the transcript (tail-biased
   * when too large), runs Haiku extraction, persists proposals.
   *
   * Triggered manually by /memlin-scribe today; an auto-triggered
   * variant on Stop with a 15-min debounce is a fast follow-up.
   */
  async scribeSession(input, opts = {}) {
    return this.request("POST", "/scribe/session", input, { accountId: opts.accountId });
  }
  /**
   * POST /memory/ingest-native — ingest a host's native auto-memory.
   *
   * Sends the raw native MEMORY.md index (+ the satellite filenames the
   * adapter already pulls) so the server parses it and runs the entries
   * through the scribe dedup (corroborate, don't duplicate). Makes turning
   * off native auto-memory lossless.
   */
  async ingestNativeMemory(input, opts = {}) {
    return this.request("POST", "/memory/ingest-native", input, { accountId: opts.accountId });
  }
  /**
   * POST /plans — upload a Claude Code plan as a first-class plan document.
   *
   * Server resolves project from cwd/git_remote (when not pinned), writes
   * the document via writeDocument (auto-embedding), and inserts a
   * companion plans row with status='drafted'. Returns the document_id
   * + version metadata for downstream URL construction.
   */
  async pushPlan(input) {
    return this.request("POST", "/plans", input);
  }
  /**
   * GET /plans — list plans for the account, optionally filtered by
   * `updated_after` (epoch ms) for cheap delta polling. Used by the
   * UserPromptSubmit + SessionStart hooks to keep ~/.claude/plans/ in
   * sync with the server.
   */
  async listPlans(opts = {}) {
    const qs = new URLSearchParams();
    if (opts.status) qs.set("status", opts.status);
    if (opts.project_id !== void 0) {
      qs.set("project_id", opts.project_id === null ? "null" : opts.project_id);
    }
    if (opts.updated_after) qs.set("updated_after", opts.updated_after);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await this.request(
      "GET",
      `/plans${suffix}`
    );
    return res.plans;
  }
  /** GET /plans/<id> — full plan detail (status + body + bundle ref). */
  async getPlan(id) {
    return this.request("GET", `/plans/${encodeURIComponent(id)}`);
  }
  /**
   * PATCH /plans/<id> — replace the plan's body (creates a new
   * document_version, auto-embeds). Used by the PostToolUse hook to push
   * Claude Code edits back up to Memlin.
   */
  async updatePlan(id, input) {
    return this.request("PATCH", `/plans/${encodeURIComponent(id)}`, input);
  }
  /**
   * POST /projects — create a project in the caller's current account.
   * Used by `memlin init` to register a Claude Code workspace.
   */
  async createProject(input, opts = {}) {
    return this.request("POST", "/projects", input, { accountId: opts.accountId });
  }
  /** Atomically create/select a project and register one or more logical
   * local sources. Device paths are intentionally absent from this wire
   * contract. */
  async linkLocalSources(input, opts = {}) {
    return this.request("POST", "/projects/local-link", input, { accountId: opts.accountId });
  }
  /**
   * PATCH /projects/{id} — attach/detach local paths, set/clear the git
   * remote, or rename. Owner/admin only; 409 when a path or remote is
   * already attached to another project in the account. Backs
   * `memlin attach-path` and add-project's attach-instead-of-fork offer.
   */
  async patchProject(projectId, input, opts = {}) {
    return this.request("PATCH", `/projects/${encodeURIComponent(projectId)}`, input, {
      accountId: opts.accountId
    });
  }
  /** POST /decisions/{id}/verify — record an outcome on the decision
   *  ledger. Verdicts surface on every future resolve of the decision. */
  async verifyDecision(decisionId, input, opts = {}) {
    return this.request("POST", `/decisions/${encodeURIComponent(decisionId)}/verify`, input, {
      accountId: opts.accountId
    });
  }
  /** GET /decisions/review-due — decisions whose review date arrived. */
  async listReviewDueDecisions(opts = {}) {
    const qs = opts.projectId ? `?project_id=${encodeURIComponent(opts.projectId)}` : "";
    return this.request("GET", `/decisions/review-due${qs}`, void 0, {
      accountId: opts.accountId
    });
  }
  /**
   * POST /ask — natural-language Q&A over the team's workspace memory.
   * Server resolves a bundle, sends it to Claude, returns answer +
   * citations + audit_id. Used by `memlin ask` CLI and the web /ask
   * panel.
   */
  async ask(input, opts = {}) {
    return this.request("POST", "/ask", input, { accountId: opts.accountId });
  }
  /** GET /projects — list every project in the current account. */
  async listProjects(opts = {}) {
    const res = await this.request("GET", "/projects", void 0, { accountId: opts.accountId });
    return res.projects;
  }
};
function resolveApiUrl() {
  return process.env.MEMLIN_API_URL?.trim() || DEFAULT_API_URL;
}

// packages/plugin-core/dist/workspace-binding.js
import { randomUUID as randomUUID2 } from "node:crypto";
import { constants, promises as fs2 } from "node:fs";
import path4 from "node:path";
var WORKSPACE_DIR_NAME = ".memlin";
var WORKSPACE_BINDING_FILE = "config.json";
var GIT_POINTER_MAX_BYTES = 8 * 1024;
async function walkForWorkspaceBinding(startDir) {
  let dir = path4.resolve(startDir);
  for (let i = 0; i < 64; i++) {
    const candidate = path4.join(dir, WORKSPACE_DIR_NAME, WORKSPACE_BINDING_FILE);
    try {
      const raw = await fs2.readFile(candidate, "utf8");
      const parsed = JSON.parse(raw);
      if (typeof parsed.account_id === "string" && parsed.account_id) {
        return {
          binding: {
            account_id: parsed.account_id,
            project_id: parsed.project_id ?? null,
            account_name: parsed.account_name
          },
          workspaceRoot: dir
        };
      }
    } catch {
    }
    const parent = path4.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}
async function readSmallRegularFile(file) {
  let before;
  try {
    before = await fs2.lstat(file);
  } catch (error) {
    return isFileNotFound(error) ? { kind: "missing" } : { kind: "invalid" };
  }
  try {
    if (before.isSymbolicLink() || !before.isFile() || before.size > GIT_POINTER_MAX_BYTES) {
      return { kind: "invalid" };
    }
    const noFollow = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
    const handle = await fs2.open(file, constants.O_RDONLY | noFollow);
    try {
      const opened = await handle.stat();
      if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size || opened.size > GIT_POINTER_MAX_BYTES) {
        return { kind: "invalid" };
      }
      const bytes = await handle.readFile();
      const [after, afterPath] = await Promise.all([handle.stat(), fs2.lstat(file)]);
      if (afterPath.isSymbolicLink() || !afterPath.isFile() || after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size || afterPath.dev !== opened.dev || afterPath.ino !== opened.ino || afterPath.size !== opened.size || bytes.byteLength !== opened.size || bytes.includes(0)) {
        return { kind: "invalid" };
      }
      return { kind: "ok", value: bytes.toString("utf8") };
    } finally {
      await handle.close();
    }
  } catch {
    return { kind: "invalid" };
  }
}
function containedBy(parent, child) {
  const relative = path4.relative(parent, child);
  return relative === "" || relative !== ".." && !relative.startsWith(`..${path4.sep}`) && !path4.isAbsolute(relative);
}
async function canonicalSafeDirectory(candidate) {
  try {
    const before = await fs2.lstat(candidate);
    if (before.isSymbolicLink() || !before.isDirectory()) return null;
    await fs2.access(candidate, constants.R_OK | constants.X_OK);
    const canonical = await fs2.realpath(candidate);
    const after = await fs2.lstat(candidate);
    if (after.isSymbolicLink() || !after.isDirectory() || after.dev !== before.dev || after.ino !== before.ino) {
      return null;
    }
    return canonical;
  } catch {
    return null;
  }
}
function gitIdentity(checkoutRoot, state, repositoryRoot = checkoutRoot) {
  return {
    checkout_root: checkoutRoot,
    repository_root: repositoryRoot,
    state
  };
}
async function resolveGitWorkspaceIdentity(startDir) {
  const requested = path4.resolve(startDir);
  let canonicalStart;
  try {
    canonicalStart = await fs2.realpath(requested);
    const startEntry = await fs2.stat(canonicalStart);
    if (!startEntry.isDirectory()) return gitIdentity(canonicalStart, "unknown");
  } catch {
    return gitIdentity(requested, "unknown");
  }
  let dir = canonicalStart;
  for (let i = 0; i < 64; i++) {
    const gitEntry = path4.join(dir, ".git");
    let entry;
    try {
      entry = await fs2.lstat(gitEntry);
    } catch (error) {
      if (!isFileNotFound(error)) return gitIdentity(dir, "unknown");
      const parent = path4.dirname(dir);
      if (parent === dir) return gitIdentity(canonicalStart, "none");
      dir = parent;
      continue;
    }
    const checkoutRoot = dir;
    if (entry.isSymbolicLink()) return gitIdentity(checkoutRoot, "unknown");
    if (entry.isDirectory()) {
      if (!await canonicalSafeDirectory(gitEntry)) return gitIdentity(checkoutRoot, "unknown");
      return gitIdentity(checkoutRoot, "main");
    }
    if (!entry.isFile()) return gitIdentity(checkoutRoot, "unknown");
    const pointerRead = await readSmallRegularFile(gitEntry);
    if (pointerRead.kind !== "ok" || pointerRead.value.includes("\0")) {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const pointerMatch = /^gitdir:[ \t]*([^\r\n]+)\r?\n?$/.exec(pointerRead.value);
    const pointerValue = pointerMatch?.[1];
    if (!pointerValue) return gitIdentity(checkoutRoot, "unknown");
    let gitDirCandidate;
    try {
      gitDirCandidate = path4.isAbsolute(pointerValue) ? pointerValue : path4.resolve(checkoutRoot, pointerValue);
    } catch {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const gitDir = await canonicalSafeDirectory(gitDirCandidate);
    if (!gitDir) return gitIdentity(checkoutRoot, "unknown");
    const commonRead = await readSmallRegularFile(path4.join(gitDir, "commondir"));
    if (commonRead.kind === "missing") {
      const gitDirParent = path4.dirname(gitDir);
      const looksLikeWorktreeAdmin = path4.basename(gitDirParent) === "worktrees" && path4.basename(path4.dirname(gitDirParent)) === ".git";
      if (looksLikeWorktreeAdmin) return gitIdentity(checkoutRoot, "unknown");
      return gitIdentity(checkoutRoot, "main");
    }
    if (commonRead.kind !== "ok" || commonRead.value.includes("\0")) {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const commonMatch = /^([^\r\n]+)\r?\n?$/.exec(commonRead.value);
    const commonValue = commonMatch?.[1];
    if (!commonValue) return gitIdentity(checkoutRoot, "unknown");
    let commonCandidate;
    try {
      commonCandidate = path4.isAbsolute(commonValue) ? commonValue : path4.resolve(gitDir, commonValue);
    } catch {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const commonDir = await canonicalSafeDirectory(commonCandidate);
    if (!commonDir) return gitIdentity(checkoutRoot, "unknown");
    const worktreesDir = path4.join(commonDir, "worktrees");
    if (path4.basename(commonDir) !== ".git" || gitDir === worktreesDir || !containedBy(worktreesDir, gitDir)) {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const repositoryRoot = path4.dirname(commonDir);
    const repositoryGitDir = await canonicalSafeDirectory(path4.join(repositoryRoot, ".git"));
    if (!repositoryGitDir || repositoryGitDir !== commonDir) {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const reverseRead = await readSmallRegularFile(path4.join(gitDir, "gitdir"));
    if (reverseRead.kind !== "ok" || reverseRead.value.includes("\0")) {
      return gitIdentity(checkoutRoot, "unknown");
    }
    const reverseMatch = /^([^\r\n]+)\r?\n?$/.exec(reverseRead.value);
    const reverseValue = reverseMatch?.[1];
    if (!reverseValue) return gitIdentity(checkoutRoot, "unknown");
    try {
      const reverseCandidate = path4.isAbsolute(reverseValue) ? reverseValue : path4.resolve(gitDir, reverseValue);
      const [reverseTarget, checkoutGitFile] = await Promise.all([
        fs2.realpath(reverseCandidate),
        fs2.realpath(gitEntry)
      ]);
      if (reverseTarget !== checkoutGitFile) return gitIdentity(checkoutRoot, "unknown");
    } catch {
      return gitIdentity(checkoutRoot, "unknown");
    }
    return gitIdentity(checkoutRoot, "worktree", repositoryRoot);
  }
  return gitIdentity(canonicalStart, "unknown");
}
async function findWorkspaceBinding(startDir) {
  const direct = await walkForWorkspaceBinding(startDir);
  const gitIdentity2 = await resolveGitWorkspaceIdentity(startDir);
  if (gitIdentity2.state !== "worktree") return direct;
  if (direct) {
    const bindingRoot = await fs2.realpath(direct.workspaceRoot).catch(() => path4.resolve(direct.workspaceRoot));
    if (containedBy(gitIdentity2.checkout_root, bindingRoot)) return direct;
  }
  return walkForWorkspaceBinding(gitIdentity2.repository_root);
}
async function writeWorkspaceBinding(workspaceRoot, binding) {
  if (typeof binding.account_id !== "string" || binding.account_id.length === 0) {
    throw new Error("Workspace binding account_id is required.");
  }
  const root = await fs2.realpath(path4.resolve(workspaceRoot));
  const rootEntry = await fs2.stat(root);
  if (!rootEntry.isDirectory()) throw new Error("Workspace root must be a directory.");
  const dir = path4.join(root, WORKSPACE_DIR_NAME);
  try {
    const entry = await fs2.lstat(dir);
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`Refusing an unsafe Memlin workspace directory at ${dir}`);
    }
  } catch (error) {
    if (!isFileNotFound(error)) throw error;
    await fs2.mkdir(dir, { mode: 448, recursive: true });
    const entry = await fs2.lstat(dir);
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`Refusing an unsafe Memlin workspace directory at ${dir}`);
    }
  }
  const file = path4.join(dir, WORKSPACE_BINDING_FILE);
  try {
    const existing = await fs2.lstat(file);
    if (!existing.isFile() || existing.isSymbolicLink()) {
      throw new Error(`Refusing to replace an unsafe workspace binding at ${file}`);
    }
  } catch (error) {
    if (!isFileNotFound(error)) throw error;
  }
  const body = JSON.stringify(
    {
      account_id: binding.account_id,
      project_id: binding.project_id ?? null,
      account_name: binding.account_name
    },
    null,
    2
  );
  const temporary = path4.join(dir, `.config.${randomUUID2()}.tmp`);
  let handle;
  try {
    handle = await fs2.open(temporary, "wx", 384);
    await handle.writeFile(body + "\n", "utf8");
    await handle.sync();
    await handle.close();
    handle = void 0;
    await fs2.rename(temporary, file);
    const installed = await fs2.lstat(file);
    if (!installed.isFile() || installed.isSymbolicLink()) {
      throw new Error(`Workspace binding verification failed at ${file}`);
    }
    return file;
  } finally {
    await handle?.close().catch(() => void 0);
    await fs2.unlink(temporary).catch(() => void 0);
  }
}
function isFileNotFound(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

// packages/plugin-core/dist/client.js
function exitClean(code) {
  void closeHttpSockets().finally(() => process.exit(code));
}
function globalConfigFilePath() {
  return process.env.MEMLIN_CONFIG_FILE || path5.join(os5.homedir(), ".config", "memlin", "config.json");
}
var CONFIG_DIR = path5.join(os5.homedir(), ".config", "memlin");
var TOKEN_FILE = path5.join(CONFIG_DIR, "token.json");
async function readConfig() {
  try {
    const raw = await fs3.readFile(globalConfigFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.account_id !== "string" || !parsed.account_id.trim() || typeof parsed.user_id !== "string" || !parsed.user_id.trim() || typeof parsed.auth0_sub !== "string" || !parsed.auth0_sub.trim()) {
      return null;
    }
    return {
      api_url: typeof parsed.api_url === "string" && parsed.api_url.trim() ? parsed.api_url : DEFAULT_API_URL,
      account_id: parsed.account_id,
      user_id: parsed.user_id,
      auth0_sub: parsed.auth0_sub,
      project_id: typeof parsed.project_id === "string" || parsed.project_id === null ? parsed.project_id : null
    };
  } catch {
    return null;
  }
}
function accessTokenSubject(accessToken) {
  try {
    const subject = decodeJwtPayload(accessToken).sub;
    return typeof subject === "string" && subject.length > 0 ? subject : null;
  } catch {
    return null;
  }
}
function configMatchesAccessToken(config, accessToken) {
  const subject = accessTokenSubject(accessToken);
  return subject !== null && subject === config.auth0_sub;
}
async function getIdentityBoundAccessToken(config) {
  const accessToken = await getValidAccessToken();
  if (!configMatchesAccessToken(config, accessToken)) {
    throw new Error("not signed in \u2014 saved Memlin account does not match the saved token");
  }
  return accessToken;
}
async function getApi(opts = {}) {
  const config = await readConfig();
  if (!config) return null;
  try {
    await getIdentityBoundAccessToken(config);
  } catch {
    return null;
  }
  const cwd = opts.cwd ?? process.cwd();
  const overlay = await findWorkspaceBinding(cwd);
  const { workspaceBound, workspaceRoot } = applyWorkspaceOverlay(config, overlay);
  const apiUrl = process.env.MEMLIN_API_URL?.trim() || config.api_url || resolveApiUrl();
  const api = new MemlinApiClient({
    baseUrl: apiUrl,
    getAccessToken: () => getIdentityBoundAccessToken(config),
    accountId: config.account_id
  });
  return { api, config, workspaceBound, workspaceRoot };
}
function applyWorkspaceOverlay(config, overlay) {
  if (!overlay) return { workspaceBound: false, workspaceRoot: null };
  config.account_id = overlay.binding.account_id;
  if (overlay.binding.project_id !== void 0) {
    config.project_id = overlay.binding.project_id;
  }
  return { workspaceBound: true, workspaceRoot: overlay.workspaceRoot };
}
function log(msg) {
  if (process.env.MEMLIN_DEBUG) {
    process.stderr.write(`[memlin] ${msg}
`);
  }
}

// apps/cli-plugin/src/hooks/session-start.ts
init_state();

// packages/plugin-core/dist/apply.js
init_state();
import { promises as fs5 } from "node:fs";
import { existsSync } from "node:fs";
import os7 from "node:os";
import path7 from "node:path";

// packages/plugin-core/dist/paths.js
var SLUG = /[^a-z0-9]+/g;
function slugify(s) {
  const cleaned = s.toLowerCase().replace(SLUG, "-").replace(/^-|-$/g, "");
  return cleaned || "untitled";
}
function inferLocalPath(kind, title, existing) {
  if (kind === "skill") {
    if (existing && existing.endsWith("/SKILL.md")) return existing;
    if (existing) {
      const stripped = existing.replace(/\.md$/i, "");
      return `${stripped}/SKILL.md`;
    }
    return `skills/${slugify(title)}/SKILL.md`;
  }
  if (existing) return existing;
  switch (kind) {
    case "goal":
      return `goals/${slugify(title)}.md`;
    case "schema":
      return `schemas/${slugify(title)}.json`;
    case "memory":
      return `memory/${slugify(title)}.md`;
    default:
      return `${kind}/${slugify(title)}.md`;
  }
}

// packages/plugin-core/dist/apply.js
init_host();
function archiveRoot() {
  return path7.join(os7.homedir(), ".config", "memlin", "archive");
}
async function archiveDestination(trackedRelPath) {
  const base = path7.join(archiveRoot(), trackedRelPath);
  if (!existsSync(base)) return base;
  const ext = path7.extname(base);
  const stem = base.slice(0, base.length - ext.length);
  for (let i = 1; i < 1e3; i++) {
    const candidate = `${stem}.${i}${ext}`;
    if (!existsSync(candidate)) return candidate;
  }
  return `${stem}.${Date.now()}${ext}`;
}
async function applyPullToLocal(docs, state, now, rootOverride) {
  const out = {
    written: [],
    unchanged: [],
    removed: [],
    archived: [],
    keptEdited: [],
    citations: {}
  };
  const currentPaths = /* @__PURE__ */ new Set();
  const root = rootOverride ?? resolveHost().homeDir();
  for (const d of docs) {
    if (d.kind === "brand_guidelines") continue;
    if (d.kind === "feedback") continue;
    const localPath = inferLocalPath(d.kind, d.title, d.path);
    currentPaths.add(localPath);
    const full = path7.join(root, localPath);
    const contentHash = hash(d.content);
    let needsWrite = true;
    try {
      const local = await fs5.readFile(full, "utf8");
      if (hash(local) === contentHash) needsWrite = false;
    } catch {
    }
    if (needsWrite) {
      await fs5.mkdir(path7.dirname(full), { recursive: true });
      await fs5.writeFile(full, d.content, "utf8");
      out.written.push(localPath);
    } else {
      out.unchanged.push(localPath);
    }
    state.documents[localPath] = stateRow(d, contentHash, now);
    out.citations[localPath] = {
      localPath,
      sourcePath: d.path ?? null,
      version_number: d.version_number ?? state.documents[localPath]?.version_number ?? 1,
      updated_at: d.updated_at ?? null
    };
  }
  for (const tracked of Object.keys(state.documents)) {
    if (currentPaths.has(tracked)) continue;
    const full = path7.join(root, tracked);
    if (existsSync(full)) {
      let userEdited = false;
      try {
        const local = await fs5.readFile(full, "utf8");
        const prior = state.documents[tracked]?.content_hash;
        userEdited = !prior || hash(local) !== prior;
      } catch {
        userEdited = true;
      }
      if (userEdited) {
        out.keptEdited.push(tracked);
        out.removed.push(`${tracked} (kept \u2014 locally edited)`);
      } else {
        const dest = await archiveDestination(tracked);
        try {
          await fs5.mkdir(path7.dirname(dest), { recursive: true });
          await fs5.rename(full, dest);
          out.archived.push(tracked);
          out.removed.push(`${tracked} (archived)`);
        } catch {
          out.keptEdited.push(tracked);
          out.removed.push(`${tracked} (kept \u2014 archive failed)`);
        }
      }
    }
    delete state.documents[tracked];
  }
  return out;
}
function stateRow(d, h, at) {
  return {
    document_id: d.id,
    version_id: "",
    version_number: d.version_number ?? 0,
    content_hash: h,
    last_synced_at: at,
    scope: d.scope,
    kind: d.kind
  };
}

// packages/plugin-core/dist/project-resolver.js
import { execSync } from "node:child_process";
import { existsSync as existsSync2, readdirSync } from "node:fs";
import path8 from "node:path";
var ALLOW_ACCOUNT_MISMATCH_ENV = "MEMLIN_ALLOW_ACCOUNT_MISMATCH";
function allowAccountMismatch(env = process.env) {
  const v = env[ALLOW_ACCOUNT_MISMATCH_ENV];
  return v === "1" || v === "true" || v === "yes";
}
function accountBindingHazard(r, opts = {}) {
  if (!r.hasGitRemote || !r.project_id) return "none";
  if (r.reason === "local-path") return opts.allowMismatch ? "warn" : "block";
  if (r.reason === "config") return "warn";
  return "none";
}
function formatAccountMismatchWarning(input) {
  if (input.hazard === "none") return null;
  const acct = input.accountName ? `"${input.accountName}"` : "this account";
  const proj = input.projectName ? `"${input.projectName}"` : "a project";
  const head = input.hazard === "block" ? "Memlin: account-binding mismatch \u2014 capture paused." : "Memlin: account-binding check.";
  return [
    head,
    `  This repo has a git remote, but it resolved to ${proj} under ${acct} via ${input.reason} \u2014`,
    `  that project does not own your git remote, so you may be recording to the wrong org.`,
    "  Fix: run `memlin login` to refresh your accounts, then `memlin add-project`",
    "  (or `memlin link <correct-org>`)." + (input.hazard === "block" ? ` To record here anyway, set ${ALLOW_ACCOUNT_MISMATCH_ENV}=1.` : "")
  ].join("\n");
}
async function resolveProject(api, cwd, configProjectId) {
  const absCwd = path8.resolve(cwd);
  const remotes = detectGitRemotes(cwd);
  const hasGitRemote = remotes.length > 0;
  try {
    const result = await api.resolveProject({
      // Primary remote (back-compat with the single-remote server path).
      git_remote: remotes[0] ?? null,
      // All detected remotes — for the workspace-root-of-repos case, this is
      // every sibling repo so the server resolves to the owning project.
      git_remotes: remotes,
      cwd: absCwd
    });
    if (result.project_id) {
      return {
        project_id: result.project_id,
        project_name: result.name,
        account_id: result.account_id,
        reason: result.reason === "none" ? "config" : result.reason,
        hasGitRemote
      };
    }
  } catch {
  }
  if (configProjectId) {
    return {
      project_id: configProjectId,
      project_name: null,
      account_id: null,
      reason: "config",
      hasGitRemote
    };
  }
  return { project_id: null, project_name: null, account_id: null, reason: "none", hasGitRemote };
}
function readGitRemote(cwd) {
  try {
    const url = execSync("git remote get-url origin", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    }).trim();
    return normalizeGitRemote(url);
  } catch {
    return null;
  }
}
var MAX_WORKSPACE_SCAN = 64;
function detectGitRemotes(cwd) {
  const enclosing = readGitRemote(cwd);
  if (enclosing) return [enclosing];
  const out = [];
  try {
    let scanned = 0;
    for (const entry of readdirSync(cwd, { withFileTypes: true })) {
      if (scanned >= MAX_WORKSPACE_SCAN) break;
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      scanned++;
      const child = path8.join(cwd, entry.name);
      if (!existsSync2(path8.join(child, ".git"))) continue;
      const remote = readGitRemote(child);
      if (remote && !out.includes(remote)) out.push(remote);
    }
  } catch {
  }
  return out;
}
function isWorkspaceActive(input) {
  return Boolean(input.resolvedProjectId) || input.workspaceBound;
}

// packages/plugin-core/dist/session-banner.js
init_state();
import { fileURLToPath as fileURLToPath2 } from "node:url";
var VERSION_URL = "https://raw.githubusercontent.com/memlin-ai/memlin-claude-plugin/main/.claude-plugin/marketplace.json";
var FRESHNESS_TTL_MS = 6 * 60 * 60 * 1e3;
function detectLocalPluginVersion() {
  try {
    const filePath = fileURLToPath2(import.meta.url);
    const match = filePath.match(/\/memlin-ai\/memlin\/(\d+\.\d+\.\d+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
function isOlderVersion(a, b) {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}
async function getLatestPublishedVersion(state) {
  const cache = state.plugin_version;
  if (cache && Date.now() - cache.checked_at < FRESHNESS_TTL_MS) {
    return cache.latest_version ?? null;
  }
  try {
    const res = await fetch(VERSION_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) return cache?.latest_version ?? null;
    const json = await res.json();
    const v = json.plugins?.[0]?.version;
    if (typeof v !== "string") return cache?.latest_version ?? null;
    state.plugin_version = { latest_version: v, checked_at: Date.now() };
    await writeState(state);
    return v;
  } catch {
    return cache?.latest_version ?? null;
  }
}
function formatBanner(opts) {
  const lines = [];
  if (opts.hazardWarning) lines.push(opts.hazardWarning);
  if (opts.binding) {
    const { accountName, projectName, source } = opts.binding;
    const sourceTag = source === "workspace" ? " (workspace pin)" : source === "cross-account-match" ? " (auto-matched)" : "";
    const projectPart = projectName ? ` / project "${projectName}"` : " / no project bound";
    lines.push(`Memlin \u2192 "${accountName}"${projectPart}${sourceTag}`);
  } else if (opts.authenticated) {
    lines.push(
      "Memlin: idle (this directory isn't a known Memlin project). Run /memlin-add-project to register it, or /memlin-link to pin it to an existing project."
    );
  }
  if (opts.localVersion && opts.latestVersion && isOlderVersion(opts.localVersion, opts.latestVersion)) {
    lines.push(`Memlin: plugin update available \u2014 ${opts.localVersion} \u2192 ${opts.latestVersion}`);
    lines.push(
      "  Update: /plugin marketplace update memlin-ai  then  /plugin update memlin  (restart after)"
    );
  }
  return lines.join("\n");
}
async function buildSessionBanner(binding, opts = { authenticated: true }) {
  const state = await readState();
  const localVersion = detectLocalPluginVersion();
  const latestVersion = localVersion ? await getLatestPublishedVersion(state) : null;
  return formatBanner({
    binding,
    authenticated: opts.authenticated,
    localVersion,
    latestVersion,
    hazardWarning: opts.hazardWarning ?? null
  });
}

// packages/plugin-core/dist/handoffs.js
init_host();
async function acceptPendingHandoffContext(api, projectId) {
  const targetAgentKind = resolveHost().kind;
  const { handoffs } = await api.listHandoffs({
    project_id: projectId ?? null,
    target_agent_kind: targetAgentKind,
    status: "pending",
    limit: 1
  });
  const handoff = handoffs[0];
  if (!handoff) return null;
  await api.updateHandoff(handoff.id, "accept").catch(() => null);
  return renderHandoffContext(handoff);
}
function renderHandoffContext(handoff) {
  return [
    "<memlin-handoff>",
    "# Assigned handoff accepted by Memlin session start.",
    "# Use this packet as the task brief. Mark complete with memlin_update_handoff when finished.",
    "",
    handoff.packet_markdown,
    "",
    `handoff_id: ${handoff.id}`,
    "</memlin-handoff>"
  ].join("\n");
}

// packages/plugin-core/dist/heartbeat.js
import crypto2 from "node:crypto";
import { promises as fs6 } from "node:fs";
import os8 from "node:os";
import path9 from "node:path";
init_host();
var DEFAULT_THROTTLE_MS = 6e4;
function statePath(cwd, host) {
  const key = crypto2.createHash("sha256").update(cwd).digest("hex").slice(0, 16);
  return path9.join(os8.tmpdir(), `memlin-${host}-heartbeat-${key}.json`);
}
async function recentlySent(file, throttleMs) {
  try {
    const raw = await fs6.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed.sent_at === "number" && Date.now() - parsed.sent_at < throttleMs;
  } catch {
    return false;
  }
}
async function recordInstallHeartbeat(cwd, reason, opts = {}) {
  const host = opts.host ?? resolveHost().kind;
  const throttleMs = opts.throttleMs ?? DEFAULT_THROTTLE_MS;
  const file = statePath(cwd, host);
  if (await recentlySent(file, throttleMs)) return;
  try {
    const ctx = await getApi({ cwd });
    if (!ctx) return;
    await ctx.api.getAccount();
    await fs6.writeFile(file, JSON.stringify({ sent_at: Date.now(), reason, host }), "utf8");
    log(`${host} activity recorded: ${reason}`);
  } catch (err) {
    log(`${host} activity failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// packages/plugin-core/dist/auto-bind.js
import { promises as fs7 } from "node:fs";
import path10 from "node:path";
async function findWorkspaceRoot(cwd) {
  let dir = path10.resolve(cwd);
  for (let i = 0; i < 64; i++) {
    try {
      const stat = await fs7.stat(path10.join(dir, ".git"));
      if (stat.isDirectory() || stat.isFile()) return dir;
    } catch {
    }
    const parent = path10.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path10.resolve(cwd);
}
async function autoBindWorkspaceIfMatched(args) {
  if (args.workspaceAlreadyBound) {
    return { bound: false, reason: "already-bound" };
  }
  if (args.resolved.reason !== "git-remote") {
    return { bound: false, reason: "low-confidence-match" };
  }
  if (!args.resolved.project_id || !args.resolved.account_id) {
    return { bound: false, reason: "incomplete-match" };
  }
  const observedRoot = await findWorkspaceRoot(args.cwd);
  const gitIdentity2 = await resolveGitWorkspaceIdentity(observedRoot);
  if (gitIdentity2.state === "unknown") {
    return {
      bound: false,
      reason: "write-failed",
      workspaceRoot: observedRoot,
      error: "Git metadata is unreadable or malformed; automatic binding was refused."
    };
  }
  const workspaceRoot = gitIdentity2.state === "worktree" ? gitIdentity2.repository_root : gitIdentity2.checkout_root;
  try {
    const bindingPath = await writeWorkspaceBinding(workspaceRoot, {
      account_id: args.resolved.account_id,
      project_id: args.resolved.project_id,
      account_name: args.accountName
    });
    return { bound: true, bindingPath, workspaceRoot };
  } catch (err) {
    return {
      bound: false,
      reason: "write-failed",
      workspaceRoot,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// apps/cli-plugin/src/hooks/session-start.ts
init_plan_sync();
init_companion_client();
async function readStdinJson() {
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    const chunks = [];
    let timeout = setTimeout(() => {
      timeout = null;
      resolve(null);
    }, 1e3);
    process.stdin.on("data", (c) => chunks.push(String(c)));
    process.stdin.on("end", () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      try {
        const text = chunks.join("");
        if (!text.trim()) {
          resolve(null);
          return;
        }
        resolve(JSON.parse(text));
      } catch {
        resolve(null);
      }
    });
    process.stdin.on("error", () => resolve(null));
  });
}
async function main() {
  const payload = await readStdinJson();
  const cwd = process.cwd();
  void recordInstallHeartbeat(cwd, "session-start", { throttleMs: 0, host: "claude-code" });
  const ctx = await getApi();
  if (!ctx) {
    log("not configured \u2014 skipping pull");
    return;
  }
  const { api, config, workspaceBound } = ctx;
  const companion = await companionForDelegation().catch(() => null);
  if (companion) {
    await companionReportSession({ cwd: process.cwd(), host: "claude-code" }).catch(() => false);
  }
  let resolved = null;
  if (companion) {
    resolved = await companionResolveWorkspace(process.cwd()).catch(() => null);
  }
  if (!resolved) {
    try {
      resolved = await resolveProject(api, process.cwd(), config.project_id);
    } catch (err) {
      log(`project resolve failed: ${err instanceof Error ? err.message : String(err)}`);
      resolved = {
        project_id: null,
        project_name: null,
        account_id: null,
        reason: "none",
        hasGitRemote: false
      };
    }
  }
  let autoBoundJustNow = false;
  try {
    const autoBindResult = await autoBindWorkspaceIfMatched({
      cwd: process.cwd(),
      resolved,
      workspaceAlreadyBound: workspaceBound
    });
    if (autoBindResult.bound) {
      autoBoundJustNow = true;
      process.stdout.write(
        `Memlin: auto-bound this workspace to project "${resolved.project_name ?? resolved.project_id?.slice(0, 8) ?? "?"}" via git remote (${autoBindResult.bindingPath}).
`
      );
    } else if (autoBindResult.reason === "write-failed") {
      log(`auto-bind write failed: ${autoBindResult.error ?? "unknown"}`);
    }
  } catch (err) {
    log(`auto-bind threw: ${err instanceof Error ? err.message : String(err)}`);
  }
  const active = autoBoundJustNow || isWorkspaceActive({
    resolvedProjectId: resolved.project_id,
    workspaceBound
  });
  if (!active) {
    const idleBanner = await buildSessionBanner(null, { authenticated: true });
    if (idleBanner) process.stdout.write(idleBanner + "\n");
    return;
  }
  try {
    let result;
    let planResult;
    let reconcile;
    if (companion) {
      await updateState(async (s) => {
        result = await applyPullToLocal([], s, (/* @__PURE__ */ new Date()).toISOString());
      });
      const synced = await companionSyncNow({
        cwd: process.cwd(),
        reason: "session-start"
      }).catch(() => null);
      planResult = { pulled: synced?.pulled ?? [], removed: [] };
      reconcile = { pushed: synced?.pushed ?? [], skipped: [], failed: synced?.failed ?? [] };
    } else {
      const state = await readState();
      result = await applyPullToLocal([], state, (/* @__PURE__ */ new Date()).toISOString());
      planResult = await pullPlans(ctx.api, {
        projectId: resolved.project_id
      });
      setLastPlanPullCursor(state, (/* @__PURE__ */ new Date()).toISOString());
      await writeState(state);
      reconcile = await reconcileKnownPlans(ctx.api, {
        cwd: process.cwd()
      }).catch((err) => {
        log(`plan reconcile failed: ${err instanceof Error ? err.message : String(err)}`);
        return { pushed: [], skipped: [], failed: [] };
      });
    }
    const parts = [];
    if (result && result.archived.length > 0)
      parts.push(
        `archived ${result.archived.length} superseded file(s) to ~/.config/memlin/archive (preserved, not deleted)`
      );
    if (result && result.keptEdited.length > 0)
      parts.push(`kept ${result.keptEdited.length} locally-edited file(s) in place`);
    if (planResult.pulled.length > 0) parts.push(`pulled ${planResult.pulled.length} plan(s)`);
    if (planResult.removed.length > 0)
      parts.push(`removed ${planResult.removed.length} stale plan(s)`);
    if (reconcile.pushed.length > 0) parts.push(`re-versioned ${reconcile.pushed.length} plan(s)`);
    const detail = parts.length > 0 ? parts.join(", ") : "nothing changed";
    log(
      `session-start: ${detail} (project ${resolved.project_id?.slice(0, 8) ?? "(none)"} via ${resolved.reason})`
    );
  } catch (err) {
    log(`session-start sync failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  let accountName = "(unknown account)";
  try {
    const acct = await api.getAccount();
    accountName = acct.name;
  } catch {
    accountName = `${config.account_id.slice(0, 8)}\u2026`;
  }
  let source = "config";
  if (workspaceBound) source = "workspace";
  else if (resolved.account_id && resolved.account_id !== config.account_id) {
    source = "cross-account-match";
  }
  const hazard = accountBindingHazard(resolved, { allowMismatch: allowAccountMismatch() });
  const hazardWarning = formatAccountMismatchWarning({
    hazard,
    accountName,
    projectName: resolved.project_name,
    reason: resolved.reason
  });
  const banner = await buildSessionBanner(
    {
      accountName,
      projectName: resolved.project_name,
      source
    },
    { authenticated: true, hazardWarning }
  );
  if (banner) {
    process.stdout.write(banner + "\n");
  }
  const isFreshSession = payload?.source === void 0 || payload.source === "startup";
  if (isFreshSession) {
    try {
      const handoffContext = await acceptPendingHandoffContext(api, resolved.project_id);
      if (handoffContext) process.stdout.write(`${handoffContext}
`);
    } catch {
    }
  }
  try {
    const { listUnboundPlans: listUnboundPlans2 } = await Promise.resolve().then(() => (init_plan_sync(), plan_sync_exports));
    const unbound = await listUnboundPlans2();
    if (unbound.length > 0) {
      process.stdout.write(
        `Memlin: ${unbound.length} local plan(s) not synced (unknown project). Run /memlin-bind-plans to review.
`
      );
    }
  } catch {
  }
  try {
    const { count } = await api.listInbox();
    if (count > 0) {
      process.stdout.write(
        `Memlin: ${count} proposal${count === 1 ? "" : "s"} waiting in your inbox \u2014 run /memlin-inbox.
`
      );
    }
  } catch {
  }
}
var SESSION_START_DEADLINE_MS = 15e3;
void Promise.race([
  main(),
  new Promise((resolve) => {
    const t = setTimeout(() => {
      log(`session-start: hit the ${SESSION_START_DEADLINE_MS}ms deadline \u2014 exiting (sync resumes next launch)`);
      resolve();
    }, SESSION_START_DEADLINE_MS);
    t.unref?.();
  })
]).catch((err) => log(`session-start failed: ${err instanceof Error ? err.message : String(err)}`)).finally(() => exitClean(0));
