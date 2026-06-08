#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// packages/plugin-core/dist/stop-handler.js
import { execSync as execSync2 } from "node:child_process";
import { promises as fs5 } from "node:fs";

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

// packages/plugin-core/dist/host.js
import os2 from "node:os";
import path2 from "node:path";
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
    return path2.join(this.home, "plans");
  }
};
var ClaudeCodeHost = class extends BaseHost {
  constructor() {
    super("claude-code", path2.join(os2.homedir(), ".claude"));
  }
};
var CursorHost = class extends BaseHost {
  constructor() {
    super("cursor", path2.join(os2.homedir(), ".config", "memlin"));
  }
};
var CodexHost = class extends BaseHost {
  constructor() {
    super("codex", path2.join(os2.homedir(), ".config", "memlin"));
  }
};
var WindsurfHost = class extends BaseHost {
  constructor() {
    super("windsurf", path2.join(os2.homedir(), ".config", "memlin"));
  }
};
var AntigravityHost = class extends BaseHost {
  constructor() {
    super("antigravity", path2.join(os2.homedir(), ".config", "memlin"));
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

// packages/plugin-core/dist/memlin-api-client.js
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
  /** GET /inbox — pending scribe proposals (newest first). Pass
   *  `opts.accountId` to read a different account's inbox than the pinned one
   *  (e.g. `memlin status` showing the resolver-effective account). */
  async listInbox(opts = {}) {
    return this.request("GET", "/inbox", void 0, {
      accountId: opts.accountId
    });
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

// packages/plugin-core/dist/state.js
import { promises as fs4 } from "node:fs";
import path5 from "node:path";
import os5 from "node:os";
import crypto from "node:crypto";
var STATE_FILE = path5.join(os5.homedir(), ".config", "memlin", "state.json");
var EMPTY = { documents: {} };
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

// packages/plugin-core/dist/project-resolver.js
import { execSync } from "node:child_process";
import path6 from "node:path";
async function resolveProject(api, cwd, configProjectId) {
  const absCwd = path6.resolve(cwd);
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

// packages/plugin-core/dist/transcript.js
function summarizeToolUse(b) {
  const n = b.name || "tool";
  const i = b.input ?? {};
  if (n === "TodoWrite") return null;
  const filePath = typeof i.file_path === "string" ? i.file_path : null;
  if (filePath && ["Edit", "Write", "Read", "NotebookEdit"].includes(n)) {
    return `[${n} ${filePath}]`;
  }
  if (n === "Bash" && typeof i.command === "string") {
    return `[Bash] ${i.command.replace(/\s+/g, " ").slice(0, 160)}`;
  }
  const pattern = typeof i.pattern === "string" ? i.pattern : typeof i.query === "string" ? i.query : null;
  if (pattern && (n === "Grep" || n === "Glob")) return `[${n} ${pattern}]`;
  if ((n === "Agent" || n === "Task") && typeof i.description === "string") {
    return `[Agent: ${i.description}]`;
  }
  return `[${n}]`;
}
function flattenForScribe(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts = [];
  for (const b of content) {
    if (!b || !b.type) continue;
    if (b.type === "text") {
      if (b.text) parts.push(b.text);
    } else if (b.type === "tool_use") {
      const s = summarizeToolUse(b);
      if (s) parts.push(s);
    }
  }
  return parts.join("\n");
}

// packages/plugin-core/dist/stop-handler.js
var MEMORABLE_USER_PATTERNS = [
  // Explicit memory triggers.
  /\b(remember|save|note|memorize|don['’]?t forget) (this|that|it)\b/i,
  /\b(remember|save it) (for|to) memlin\b/i,
  /\b(for future|going forward|from now on|next time)\b/i,
  /\b(the rule is|the pattern is|the convention is|we decided|decision:)\b/i,
  // Corrections (user telling agent it's wrong).
  /\b(no[, ]+|actually[, ]+|that['’]?s wrong|that['’]?s incorrect|you['’]?re wrong)\b/i,
  /\b(it['’]?s not|not [a-z]+,?\s+it['’]?s)\b/i,
  /\bwe (don['’]?t|never) use\b/i,
  // Discovery of non-obvious facts.
  /\b(turns out|the answer is|actually it's|truth is)\b/i,
  /\b(root cause|core issue|diagnose|do not paper over|do not ask me to run)\b/i
];
var MEMORABLE_AGENT_PATTERNS = [
  // Agent admitting it was wrong / learning something.
  /\b(you['’]?re right|i was wrong|i was confused|let me correct)\b/i,
  /\b(noted|got it,? saved|i['’]?ll remember)\b/i,
  /\b(i had been (saying|assuming|thinking))\b/i,
  // Normal implementation work can establish durable project facts even when
  // nobody says "remember this". The server-side extractor still filters hard;
  // this just lets substantial operational learnings reach it.
  /\b(root cause|the issue was|this means|we now|i added|i changed|i fixed|i verified|pushed)\b/i,
  /\b(migration|schema|resolver|scribe|handoff|adapter|install health|memory quality)\b/i
];
var MIN_MEMORABLE_CHARS = 60;
var TIMEOUT_MS = 8e3;
function flattenContent(c) {
  if (typeof c === "string") return c;
  return c.map((b) => b.type === "text" ? b.text ?? "" : "").join("");
}
async function readLastExchange(transcriptPath) {
  let raw;
  try {
    raw = await fs5.readFile(transcriptPath, "utf8");
  } catch {
    return null;
  }
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return null;
  let assistantText = "";
  let userText = "";
  let foundAssistant = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line) continue;
    let turn;
    try {
      const parsed = JSON.parse(line);
      turn = "message" in parsed && parsed.message ? parsed.message : parsed;
    } catch {
      continue;
    }
    if (!turn || turn.role !== "user" && turn.role !== "assistant") continue;
    const text = flattenContent(turn.content).trim();
    if (!text) continue;
    if (!foundAssistant && turn.role === "assistant") {
      assistantText = text;
      foundAssistant = true;
      continue;
    }
    if (foundAssistant && turn.role === "user") {
      userText = text;
      break;
    }
  }
  if (!userText || !assistantText) return null;
  return { user_message: userText, agent_message: assistantText };
}
function isMemorable(exchange) {
  if (exchange.user_message.length + exchange.agent_message.length < MIN_MEMORABLE_CHARS) {
    return false;
  }
  const u = exchange.user_message;
  const a = exchange.agent_message;
  for (const re of MEMORABLE_USER_PATTERNS) if (re.test(u)) return true;
  for (const re of MEMORABLE_AGENT_PATTERNS) if (re.test(a)) return true;
  return false;
}
async function heartbeat(ctx) {
  try {
    await ctx.api.getAccount();
    log("session stop recorded");
  } catch (err) {
    log(`stop heartbeat failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
function readGitRemote2(cwd) {
  try {
    const url = execSync2("git remote get-url origin", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    }).trim();
    return normalizeGitRemote(url);
  } catch {
    return null;
  }
}
async function maybeProposeMemory(ctx, payload) {
  if (!payload.transcript_path) return;
  const exchange = await readLastExchange(payload.transcript_path);
  if (!exchange) {
    log("memory propose: skipped \u2014 no user/assistant exchange found");
    return;
  }
  if (!isMemorable(exchange)) {
    log("memory propose: skipped \u2014 exchange did not match memorable prefilter");
    return;
  }
  const cwd = payload.cwd ?? process.cwd();
  const gitRemote = readGitRemote2(cwd);
  let accountOverride;
  let resolvedProjectId = null;
  try {
    const resolved = await resolveProject(ctx.api, cwd, ctx.config.project_id);
    resolvedProjectId = resolved.project_id;
    if (resolved.account_id && resolved.account_id !== ctx.config.account_id) {
      accountOverride = resolved.account_id;
    }
  } catch {
  }
  const active = isWorkspaceActive({
    resolvedProjectId,
    workspaceBound: ctx.workspaceBound
  });
  if (!active) {
    log("memory propose: skipped \u2014 not a known Memlin workspace");
    return;
  }
  const propose = ctx.api.proposeMemory(
    {
      user_message: exchange.user_message,
      agent_message: exchange.agent_message,
      cwd,
      git_remote: gitRemote
    },
    accountOverride ? { accountId: accountOverride } : {}
  );
  const timeout = new Promise((resolve) => setTimeout(() => resolve({ ok: false, proposed: 0 }), TIMEOUT_MS));
  try {
    const result = await Promise.race([propose, timeout]);
    if (result.proposed > 0) {
      const parts = [
        `${result.proposed} candidate(s) processed`,
        `${result.auto_created ?? 0} auto-created`,
        `${result.queued ?? 0} queued`
      ];
      if (result.skipped) parts.push(`${result.skipped} skipped`);
      if (result.duplicates) parts.push(`${result.duplicates} duplicate`);
      log(`memory propose: ${parts.join(", ")}`);
    }
  } catch (err) {
    log(`memory propose failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function maybeRecordOutcome(ctx, payload) {
  const state = await readState();
  if (!state.last_resolve || !state.last_resolve.audit_id) return;
  const cwd = payload.cwd ?? process.cwd();
  if (cwd !== state.last_resolve.cwd) return;
  if (!payload.transcript_path) return;
  const exchange = await readLastExchange(payload.transcript_path);
  if (!exchange) return;
  let isNegative = false;
  const u = exchange.user_message;
  const a = exchange.agent_message;
  const USER_CORRECTION_PATTERNS = [
    /\b(no[, ]+|actually[, ]+|that['’]?s wrong|that['’]?s incorrect|you['’]?re wrong)\b/i,
    /\b(it['’]?s not|not [a-z]+,?\s+it['’]?s)\b/i
  ];
  const AGENT_APOLOGY_PATTERNS = [
    /\b(you['’]?re right|i was wrong|i was confused|let me correct)\b/i
  ];
  for (const re of USER_CORRECTION_PATTERNS) {
    if (re.test(u)) isNegative = true;
  }
  for (const re of AGENT_APOLOGY_PATTERNS) {
    if (re.test(a)) isNegative = true;
  }
  const outcome = isNegative ? "negative" : "positive";
  try {
    await ctx.api.writeUsageEvent({
      event_type: "resolve.outcome",
      metadata: {
        audit_id: state.last_resolve.audit_id,
        outcome
      }
    });
    log(`recorded resolve.outcome: ${outcome} for audit ${state.last_resolve.audit_id}`);
    if (outcome === "negative") {
      const gitRemote = readGitRemote2(cwd);
      log(
        `resolver outcome is negative; proposing prompt patch for audit ${state.last_resolve.audit_id}...`
      );
      ctx.api.proposeMemory({
        user_message: exchange.user_message,
        agent_message: exchange.agent_message,
        cwd,
        git_remote: gitRemote,
        negative_outcome_audit_id: state.last_resolve.audit_id
      }).catch((err) => {
        log(
          `failed to propose prompt patch: ${err instanceof Error ? err.message : String(err)}`
        );
      });
    }
  } catch (err) {
    log(`failed to record resolve.outcome: ${err instanceof Error ? err.message : String(err)}`);
  }
}
var SCRIBE_MIN_INTERVAL_MS = 5 * 60 * 1e3;
var SCRIBE_MIN_GROWTH_CHARS = 1500;
var SCRIBE_MIN_TRANSCRIPT_CHARS = 2e3;
var SCRIBE_TIMEOUT_MS = 12e3;
var INSISTENCE_FORCE_FLUSH_PATTERNS = [
  /\b(said|told|repeated).{0,20}\b(\d+|several|many|a hundred)\s*times?\b/i,
  /\bfor the (third|fourth|fifth|tenth|hundredth|umpteenth|last|nth)\s+time\b/i,
  /\b(STOP|ALWAYS|NEVER|MUST|DO NOT|DON['’]?T)\b/
  // case-sensitive — caps are the signal
];
function lastTurnHasInsistence(raw) {
  const tail = raw.length > 5e3 ? raw.slice(-5e3) : raw;
  const lines = tail.split("\n").filter((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    let parsed;
    try {
      parsed = JSON.parse(lines[i] ?? "");
    } catch {
      continue;
    }
    const turn = "message" in parsed && parsed.message ? parsed.message : parsed;
    if (turn.role !== "user") continue;
    const text = flattenContent(turn.content ?? "").trim();
    if (!text) continue;
    return INSISTENCE_FORCE_FLUSH_PATTERNS.some((re) => re.test(text));
  }
  return false;
}
async function maybeScribeSession(ctx, payload) {
  if (!payload.transcript_path) return;
  let raw;
  try {
    raw = await fs5.readFile(payload.transcript_path, "utf8");
  } catch {
    return;
  }
  if (raw.length < SCRIBE_MIN_TRANSCRIPT_CHARS) return;
  const sessionId = payload.transcript_path.split("/").pop()?.replace(/\.jsonl$/, "") ?? "session";
  const state = await readState();
  const prev = state.session_scribe;
  const now = Date.now();
  const insistenceFlush = lastTurnHasInsistence(raw);
  if (prev && prev.session_id === sessionId && !insistenceFlush) {
    const tooSoon = now - prev.at < SCRIBE_MIN_INTERVAL_MS;
    const tooLittleNew = raw.length - prev.transcript_chars < SCRIBE_MIN_GROWTH_CHARS;
    if (tooSoon || tooLittleNew) return;
  }
  if (insistenceFlush) {
    log("scribe force-flush \u2014 insistence signal in last user turn");
  }
  const cwd = payload.cwd ?? process.cwd();
  let resolvedProjectId = null;
  let accountOverride;
  try {
    const resolved = await resolveProject(ctx.api, cwd, ctx.config.project_id);
    resolvedProjectId = resolved.project_id;
    if (resolved.account_id && resolved.account_id !== ctx.config.account_id) {
      accountOverride = resolved.account_id;
    }
  } catch {
  }
  if (!isWorkspaceActive({ resolvedProjectId, workspaceBound: ctx.workspaceBound })) {
    return;
  }
  const lines = raw.split("\n").filter((l) => l.trim());
  const turns = [];
  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    const turn = "message" in parsed && parsed.message ? parsed.message : parsed;
    if (turn.role !== "user" && turn.role !== "assistant") continue;
    const text = flattenForScribe(turn.content ?? "").trim();
    if (text) turns.push(`### ${turn.role}
${text}`);
  }
  const transcript = turns.join("\n\n");
  const prevFlattened = prev && prev.session_id === sessionId ? prev.flattened_chars ?? 0 : 0;
  const delta = transcript.length < prevFlattened ? transcript : transcript.slice(prevFlattened);
  if (delta.length < SCRIBE_MIN_TRANSCRIPT_CHARS) return;
  const scribe = ctx.api.scribeSession(
    // resolvedProjectId was computed above for the workspace gate — pass
    // it through so the captured memories attach to this project instead
    // of landing project-less at the team scope.
    { session_id: sessionId, transcript: delta, project_id: resolvedProjectId },
    accountOverride ? { accountId: accountOverride } : {}
  );
  const timeout = new Promise(
    (resolve) => setTimeout(() => resolve({ proposals_persisted: 0 }), SCRIBE_TIMEOUT_MS)
  );
  try {
    const result = await Promise.race([scribe, timeout]);
    if (result.proposals_persisted > 0) {
      log(`session scribe: ${result.proposals_persisted} proposal(s) queued`);
      const carried = state.scribe_notice && state.scribe_notice.session_id === sessionId ? state.scribe_notice.unsurfaced : 0;
      state.scribe_notice = {
        unsurfaced: carried + result.proposals_persisted,
        session_id: sessionId,
        at: now
      };
    }
    state.session_scribe = {
      at: now,
      transcript_chars: raw.length,
      session_id: sessionId,
      flattened_chars: transcript.length
    };
    await writeState(state);
  } catch (err) {
    log(`session scribe failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function runStopHandler(payload) {
  const ctx = await getApi();
  if (!ctx) return;
  await Promise.allSettled([
    heartbeat(ctx),
    maybeProposeMemory(ctx, payload),
    maybeScribeSession(ctx, payload),
    maybeRecordOutcome(ctx, payload)
  ]);
}

// apps/cli-plugin/src/hooks/stop.ts
function readStdinJson() {
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    const chunks = [];
    const timeout = setTimeout(() => resolve(null), 500);
    process.stdin.on("data", (c) => chunks.push(String(c)));
    process.stdin.on("end", () => {
      clearTimeout(timeout);
      try {
        const text = chunks.join("");
        resolve(text.trim() ? JSON.parse(text) : null);
      } catch {
        resolve(null);
      }
    });
    process.stdin.on("error", () => resolve(null));
  });
}
async function main() {
  const payload = await readStdinJson() ?? {};
  await runStopHandler(payload);
}
void main();
