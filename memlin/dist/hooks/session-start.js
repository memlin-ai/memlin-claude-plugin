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

// packages/plugin-core/dist/host.js
import os2 from "node:os";
import path2 from "node:path";
function resolveHost() {
  const envHost = process.env.MEMLIN_HOST ?? (process.env.CURSOR_AGENT ? "cursor" : "claude-code");
  const make = HOSTS[envHost];
  return (make ?? HOSTS["claude-code"])();
}
var BaseHost, ClaudeCodeHost, CursorHost, CodexHost, WindsurfHost, AntigravityHost, HOSTS;
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
        return path2.join(this.home, "plans");
      }
    };
    ClaudeCodeHost = class extends BaseHost {
      constructor() {
        super("claude-code", path2.join(os2.homedir(), ".claude"));
      }
    };
    CursorHost = class extends BaseHost {
      constructor() {
        super("cursor", path2.join(os2.homedir(), ".config", "memlin"));
      }
    };
    CodexHost = class extends BaseHost {
      constructor() {
        super("codex", path2.join(os2.homedir(), ".config", "memlin"));
      }
    };
    WindsurfHost = class extends BaseHost {
      constructor() {
        super("windsurf", path2.join(os2.homedir(), ".config", "memlin"));
      }
    };
    AntigravityHost = class extends BaseHost {
      constructor() {
        super("antigravity", path2.join(os2.homedir(), ".config", "memlin"));
      }
    };
    HOSTS = {
      "claude-code": () => new ClaudeCodeHost(),
      cursor: () => new CursorHost(),
      codex: () => new CodexHost(),
      windsurf: () => new WindsurfHost(),
      antigravity: () => new AntigravityHost()
    };
  }
});

// packages/plugin-core/dist/state.js
import { promises as fs4 } from "node:fs";
import path5 from "node:path";
import os5 from "node:os";
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
  await fs4.mkdir(path5.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  await fs4.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs4.rename(tmp, STATE_FILE);
}
function hash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}
var STATE_FILE, EMPTY;
var init_state = __esm({
  "packages/plugin-core/dist/state.js"() {
    "use strict";
    STATE_FILE = path5.join(os5.homedir(), ".config", "memlin", "state.json");
    EMPTY = { documents: {} };
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
import { promises as fs7 } from "node:fs";
import path9 from "node:path";
function homeBase() {
  return resolveHost().homeDir();
}
function plansDir() {
  return resolveHost().plansDir();
}
async function pullPlans(api, opts = {}) {
  const fetchOpts = {};
  if (opts.projectId !== void 0) fetchOpts.project_id = opts.projectId;
  if (opts.since) fetchOpts.updated_after = opts.since;
  const list = await api.listPlans(fetchOpts);
  await fs7.mkdir(plansDir(), { recursive: true });
  const state = await readState();
  const pulled = [];
  const unchanged = [];
  const removed = [];
  const isFullSync = !opts.since;
  const seenPaths = /* @__PURE__ */ new Set();
  for (const p of list) {
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
    const filename = `${p.document_id.slice(0, 8)}-${slug || "plan"}.md`;
    const localPath = path9.join("plans", filename);
    const full = path9.join(plansDir(), filename);
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
    await fs7.writeFile(full, fileContent, "utf8");
    pulled.push(localPath);
    state.documents[localPath] = {
      document_id: p.document_id,
      version_id: "",
      version_number: p.version_number,
      content_hash: contentHash,
      last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
      scope: p.scope ?? "personal",
      kind: "plan"
    };
  }
  if (isFullSync) {
    for (const tracked of Object.keys(state.documents)) {
      if (!tracked.startsWith("plans/")) continue;
      if (seenPaths.has(tracked)) continue;
      delete state.documents[tracked];
    }
  }
  await writeState(state);
  return { pulled, unchanged, removed };
}
function resolveTargetDocId(stateEntry, binding) {
  return stateEntry?.document_id || binding?.documentId || void 0;
}
async function pushPlanFile(api, file, opts = {}) {
  const raw = await fs7.readFile(file, "utf8");
  const { title, body, binding: existingBinding } = parsePlanFile(raw);
  if (!body.trim()) {
    throw new Error("plan body is empty");
  }
  const relPath = path9.relative(homeBase(), file);
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
    const stampedUpdate = await fs7.readFile(file, "utf8").catch(() => raw);
    state.documents[relPath] = {
      document_id: result2.document_id,
      version_id: existing?.version_id ?? "",
      version_number: result2.version_number,
      content_hash: hash(stampedUpdate),
      last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
      scope: existing?.scope ?? (existingBinding?.projectId ? "project" : "personal"),
      kind: "plan"
    };
    await writeState(state);
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
  state.documents[relPath] = {
    document_id: result.document_id,
    version_id: "",
    version_number: result.version_number,
    content_hash: hash(raw),
    last_synced_at: (/* @__PURE__ */ new Date()).toISOString(),
    scope: result.project_id ? "project" : "personal",
    kind: "plan"
  };
  await writeState(state);
  await stampPlanFile(file, {
    documentId: result.document_id,
    projectId: result.project_id
  });
  const stamped = await fs7.readFile(file, "utf8").catch(() => raw);
  state.documents[relPath].content_hash = hash(stamped);
  await writeState(state);
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
    entries = await fs7.readdir(plansDir());
  } catch {
    return { pushed, skipped, failed };
  }
  const state = await readState();
  for (const f of entries) {
    if (!f.endsWith(".md")) continue;
    const abs = path9.join(plansDir(), f);
    let raw;
    try {
      const st = await fs7.stat(abs);
      if (!st.isFile() || st.size === 0) continue;
      raw = await fs7.readFile(abs, "utf8");
    } catch {
      continue;
    }
    const relPath = path9.relative(homeBase(), abs);
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
async function listUnboundPlans() {
  const out = [];
  let entries;
  try {
    entries = await fs7.readdir(plansDir());
  } catch {
    return out;
  }
  const state = await readState();
  for (const f of entries) {
    if (!f.endsWith(".md")) continue;
    const abs = path9.join(plansDir(), f);
    let raw;
    let size = 0;
    try {
      const st = await fs7.stat(abs);
      if (!st.isFile() || st.size === 0) continue;
      size = st.size;
      raw = await fs7.readFile(abs, "utf8");
    } catch {
      continue;
    }
    const relPath = path9.relative(homeBase(), abs);
    const { title, binding } = parsePlanFile(raw);
    if (state.documents[relPath]?.document_id || binding?.documentId) continue;
    out.push({ file: f, title, size });
  }
  return out;
}
async function stampPlanFile(file, binding) {
  let raw;
  try {
    raw = await fs7.readFile(file, "utf8");
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
  await fs7.writeFile(file, composed, "utf8");
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
import path4 from "node:path";
import os4 from "node:os";

// packages/plugin-core/dist/auth.js
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
var MEMLIN_PROD_AUTH0_DOMAIN = "memlin.us.auth0.com";
var MEMLIN_PROD_AUTH0_CLIENT_ID = "fyYMQ4Cxc6Nu5juVwL8Ihqq4fgAFecG9";
var AUTH0_DOMAIN = process.env.MEMLIN_AUTH0_DOMAIN || MEMLIN_PROD_AUTH0_DOMAIN;
var AUTH0_CLIENT_ID = process.env.MEMLIN_AUTH0_CLIENT_ID || MEMLIN_PROD_AUTH0_CLIENT_ID;
var AUTH0_AUDIENCE = process.env.MEMLIN_AUTH0_AUDIENCE ?? "https://api.memlin.ai";
function tokenFilePath() {
  return process.env.MEMLIN_TOKEN_FILE || path.join(os.homedir(), ".config", "memlin", "token.json");
}
async function readPersistedToken() {
  try {
    const raw = await fs.readFile(tokenFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function writePersistedToken(t) {
  const file = tokenFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = path.join(path.dirname(file), `token.json.tmp-${process.pid}`);
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
async function getValidAccessToken() {
  const persisted = await readPersistedToken();
  if (!persisted) throw new Error("not signed in \u2014 run `memlin login`");
  if (Date.now() < persisted.expires_at - 6e4) return persisted.access_token;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefresh(persisted).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}
async function doRefresh(stale) {
  const latest = await readPersistedToken();
  if (latest && Date.now() < latest.expires_at - 6e4) return latest.access_token;
  const refreshToken = latest?.refresh_token ?? stale.refresh_token;
  if (!refreshToken) {
    throw new Error("access token expired and no refresh token saved \u2014 run `memlin login`");
  }
  try {
    const fresh = await refreshAccessToken(refreshToken);
    await writePersistedToken(fresh);
    return fresh.access_token;
  } catch (err) {
    const after = await readPersistedToken();
    if (after && after.access_token !== stale.access_token && Date.now() < after.expires_at - 6e4) {
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

// packages/plugin-core/dist/memlin-api-client.js
import os3 from "node:os";

// packages/plugin-core/dist/runtime-shared.js
var AGENT_KIND_HEADER = "Memlin-Agent-Kind";
var AGENT_DEVICE_HEADER = "Memlin-Agent-Device";
var AGENT_VERSION_HEADER = "Memlin-Agent-Version";
var AGENT_CAPABILITIES_HEADER = "Memlin-Agent-Capabilities";
var AGENT_EXPECTED_CAPABILITIES = {
  "claude-code": ["cli", "commands", "hooks", "sync", "scribe", "resolve"],
  cursor: ["mcp", "commands", "hooks", "rules", "scribe", "resolve"],
  codex: ["mcp", "cli", "hooks", "rules", "scribe", "resolve"],
  windsurf: ["mcp", "cli", "hooks", "rules", "scribe", "resolve"],
  gemini: ["mcp", "rules", "resolve"],
  grok: ["mcp", "rules", "resolve"],
  hermes: ["mcp", "resolve"],
  openclaw: ["mcp", "rules", "resolve"],
  antigravity: ["mcp", "cli", "hooks", "commands", "rules", "sync", "scribe", "resolve"],
  mcp: ["mcp", "resolve"],
  "claude-ai": ["mcp", "resolve"]
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

// packages/plugin-core/dist/memlin-api-client.js
init_host();
var DEFAULT_API_URL = "https://memlin.ai/api/v1";
function agentDevice() {
  return process.env.MEMLIN_AGENT_DEVICE || os3.hostname() || "unknown";
}
function agentVersion() {
  return process.env.MEMLIN_AGENT_VERSION || "0.1.0";
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
      [AGENT_CAPABILITIES_HEADER]: agentCapabilities().join(",")
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
   *  tool.guardrail, action.invoke) and re-derives account_id and
   *  user_id from the auth context so callers can't forge rows for
   *  other workspaces. */
  async writeUsageEvent(input) {
    return this.request("POST", "/usage/event", input);
  }
  /** GET /documents — list, filtered. */
  async listDocuments(opts = {}) {
    const qs = new URLSearchParams();
    if (opts.kinds) for (const k of opts.kinds) qs.append("kind", k);
    if (opts.scopes) for (const s of opts.scopes) qs.append("scope", s);
    if (opts.statuses) for (const s of opts.statuses) qs.append("status", s);
    if (opts.project_id !== void 0) {
      qs.set("project_id", opts.project_id === null ? "null" : opts.project_id);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await this.request("GET", `/documents${suffix}`);
    return res.documents.map((d) => {
      const { status, ...rest } = d;
      return status == null ? rest : { ...rest, status };
    });
  }
  /** POST /documents — create or update a document. */
  async writeDocument(input) {
    return this.request("POST", "/documents", input);
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
import { promises as fs2 } from "node:fs";
import path3 from "node:path";
var WORKSPACE_DIR_NAME = ".memlin";
var WORKSPACE_BINDING_FILE = "config.json";
async function findWorkspaceBinding(startDir) {
  let dir = path3.resolve(startDir);
  for (let i = 0; i < 64; i++) {
    const candidate = path3.join(dir, WORKSPACE_DIR_NAME, WORKSPACE_BINDING_FILE);
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
    const parent = path3.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}
async function writeWorkspaceBinding(workspaceRoot, binding) {
  const dir = path3.join(path3.resolve(workspaceRoot), WORKSPACE_DIR_NAME);
  await fs2.mkdir(dir, { recursive: true });
  const file = path3.join(dir, WORKSPACE_BINDING_FILE);
  const body = JSON.stringify(
    {
      account_id: binding.account_id,
      project_id: binding.project_id ?? null,
      account_name: binding.account_name
    },
    null,
    2
  );
  await fs2.writeFile(file, body + "\n", "utf8");
  return file;
}

// packages/plugin-core/dist/client.js
var CONFIG_DIR = path4.join(os4.homedir(), ".config", "memlin");
var CONFIG_FILE = path4.join(CONFIG_DIR, "config.json");
var TOKEN_FILE = path4.join(CONFIG_DIR, "token.json");
async function readConfig() {
  try {
    const raw = await fs3.readFile(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.account_id || !parsed.user_id) return null;
    return {
      api_url: parsed.api_url ?? DEFAULT_API_URL,
      account_id: parsed.account_id,
      user_id: parsed.user_id,
      project_id: parsed.project_id ?? null
    };
  } catch {
    return null;
  }
}
async function getApi(opts = {}) {
  const config = await readConfig();
  if (!config) return null;
  try {
    await getValidAccessToken();
  } catch {
    return null;
  }
  const cwd = opts.cwd ?? process.cwd();
  let workspaceBound = false;
  let workspaceRoot = null;
  const overlay = await findWorkspaceBinding(cwd);
  if (overlay && overlay.binding.account_id !== config.account_id) {
    config.account_id = overlay.binding.account_id;
    if (overlay.binding.project_id !== void 0) {
      config.project_id = overlay.binding.project_id;
    }
    workspaceBound = true;
    workspaceRoot = overlay.workspaceRoot;
  }
  const apiUrl = process.env.MEMLIN_API_URL?.trim() || config.api_url || resolveApiUrl();
  const api = new MemlinApiClient({
    baseUrl: apiUrl,
    getAccessToken: getValidAccessToken,
    accountId: config.account_id
  });
  return { api, config, workspaceBound, workspaceRoot };
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
import os6 from "node:os";
import path6 from "node:path";

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
  return path6.join(os6.homedir(), ".config", "memlin", "archive");
}
async function archiveDestination(trackedRelPath) {
  const base = path6.join(archiveRoot(), trackedRelPath);
  if (!existsSync(base)) return base;
  const ext = path6.extname(base);
  const stem = base.slice(0, base.length - ext.length);
  for (let i = 1; i < 1e3; i++) {
    const candidate = `${stem}.${i}${ext}`;
    if (!existsSync(candidate)) return candidate;
  }
  return `${stem}.${Date.now()}${ext}`;
}
async function applyPullToLocal(docs, state, now) {
  const out = {
    written: [],
    unchanged: [],
    removed: [],
    archived: [],
    keptEdited: [],
    citations: {}
  };
  const currentPaths = /* @__PURE__ */ new Set();
  const root = resolveHost().homeDir();
  for (const d of docs) {
    if (d.kind === "brand_guidelines") continue;
    const localPath = inferLocalPath(d.kind, d.title, d.path);
    currentPaths.add(localPath);
    const full = path6.join(root, localPath);
    const contentHash = hash(d.content);
    let needsWrite = true;
    try {
      const local = await fs5.readFile(full, "utf8");
      if (hash(local) === contentHash) needsWrite = false;
    } catch {
    }
    if (needsWrite) {
      await fs5.mkdir(path6.dirname(full), { recursive: true });
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
    const full = path6.join(root, tracked);
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
          await fs5.mkdir(path6.dirname(dest), { recursive: true });
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
import path7 from "node:path";
async function resolveProject(api, cwd, configProjectId) {
  const absCwd = path7.resolve(cwd);
  const remote = readGitRemote(cwd);
  try {
    const result = await api.resolveProject({
      git_remote: remote,
      cwd: absCwd
    });
    if (result.project_id) {
      return {
        project_id: result.project_id,
        project_name: result.name,
        account_id: result.account_id,
        reason: result.reason === "none" ? "config" : result.reason
      };
    }
  } catch {
  }
  if (configProjectId) {
    return {
      project_id: configProjectId,
      project_name: null,
      account_id: null,
      reason: "config"
    };
  }
  return { project_id: null, project_name: null, account_id: null, reason: "none" };
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
function isWorkspaceActive(input) {
  return Boolean(input.resolvedProjectId) || input.workspaceBound;
}

// packages/plugin-core/dist/session-banner.js
init_state();
import { fileURLToPath } from "node:url";
var GITHUB_API = "https://api.github.com/repos/memlin-ai/memlin-claude-plugin/commits/main";
var SHORT_SHA_LEN = 12;
var FRESHNESS_TTL_MS = 6 * 60 * 60 * 1e3;
function detectLocalPluginSha() {
  try {
    const filePath = fileURLToPath(import.meta.url);
    const match = filePath.match(/\/memlin-ai\/memlin\/([0-9a-f]{8,40})\//i);
    return match ? match[1].slice(0, SHORT_SHA_LEN) : null;
  } catch {
    return null;
  }
}
async function getLatestMainSha(state) {
  const cache = state.plugin_version;
  if (cache && Date.now() - cache.checked_at < FRESHNESS_TTL_MS) {
    return cache.latest_main_sha;
  }
  try {
    const res = await fetch(GITHUB_API, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!res.ok) return cache?.latest_main_sha ?? null;
    const json = await res.json();
    if (typeof json.sha !== "string") return cache?.latest_main_sha ?? null;
    state.plugin_version = {
      latest_main_sha: json.sha.slice(0, SHORT_SHA_LEN),
      checked_at: Date.now()
    };
    await writeState(state);
    return state.plugin_version.latest_main_sha;
  } catch {
    return cache?.latest_main_sha ?? null;
  }
}
function formatBanner(opts) {
  const lines = [];
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
  if (opts.localSha && opts.latestSha && opts.localSha !== opts.latestSha) {
    lines.push(
      `Memlin: plugin update available \u2014 run /plugin update memlin (you: ${opts.localSha}, latest: ${opts.latestSha})`
    );
  }
  return lines.join("\n");
}
async function buildSessionBanner(binding, opts = { authenticated: true }) {
  const state = await readState();
  const localSha = detectLocalPluginSha();
  const latestSha = localSha ? await getLatestMainSha(state) : null;
  return formatBanner({
    binding,
    authenticated: opts.authenticated,
    localSha,
    latestSha
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

// packages/plugin-core/dist/auto-bind.js
import { promises as fs6 } from "node:fs";
import path8 from "node:path";
async function findWorkspaceRoot(cwd) {
  let dir = path8.resolve(cwd);
  for (let i = 0; i < 64; i++) {
    try {
      const stat = await fs6.stat(path8.join(dir, ".git"));
      if (stat.isDirectory() || stat.isFile()) return dir;
    } catch {
    }
    const parent = path8.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path8.resolve(cwd);
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
  const workspaceRoot = await findWorkspaceRoot(args.cwd);
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
async function main() {
  const ctx = await getApi();
  if (!ctx) {
    log("not configured \u2014 skipping pull");
    return;
  }
  const { api, config, workspaceBound } = ctx;
  let resolved;
  try {
    resolved = await resolveProject(api, process.cwd(), config.project_id);
  } catch (err) {
    log(`project resolve failed: ${err instanceof Error ? err.message : String(err)}`);
    resolved = { project_id: null, project_name: null, account_id: null, reason: "none" };
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
    const state = await readState();
    const result = await applyPullToLocal([], state, (/* @__PURE__ */ new Date()).toISOString());
    const planResult = await pullPlans(ctx.api, {
      projectId: resolved.project_id
    });
    setLastPlanPullCursor(state, (/* @__PURE__ */ new Date()).toISOString());
    await writeState(state);
    const reconcile = await reconcileKnownPlans(ctx.api, {
      cwd: process.cwd()
    }).catch((err) => {
      log(`plan reconcile failed: ${err instanceof Error ? err.message : String(err)}`);
      return { pushed: [], skipped: [], failed: [] };
    });
    const parts = [];
    if (result.archived.length > 0)
      parts.push(
        `archived ${result.archived.length} superseded file(s) to ~/.config/memlin/archive (preserved, not deleted)`
      );
    if (result.keptEdited.length > 0)
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
  const banner = await buildSessionBanner({
    accountName,
    projectName: resolved.project_name,
    source
  });
  if (banner) {
    process.stdout.write(banner + "\n");
  }
  try {
    const handoffContext = await acceptPendingHandoffContext(api, resolved.project_id);
    if (handoffContext) process.stdout.write(`${handoffContext}
`);
  } catch {
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
void main();
