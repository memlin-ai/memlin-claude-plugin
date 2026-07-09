import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// apps/cli-plugin/src/hooks/user-prompt-submit.ts
import { spawn as spawn2 } from "node:child_process";
import { promises as fs3 } from "node:fs";
import path3 from "node:path";
import os3 from "node:os";
import { fileURLToPath } from "node:url";

// packages/plugin-core/dist/state.js
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
var STATE_FILE = path.join(os.homedir(), ".config", "memlin", "state.json");
var EMPTY = { documents: {} };
async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }
}
async function writeState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(tmp, STATE_FILE);
}

// packages/plugin-core/dist/continuity.js
var CONTINUITY_WINDOW_MS = 10 * 60 * 1e3;
var CONTINUATION_PATTERNS = [
  /^\s*(and|also|then|now|next|plus|but|or|so)\b/i,
  /^\s*(what about|how about|tell me more|go on|continue|keep going)\b/i,
  /^\s*(explain|show me|expand|elaborate)\s+(that|this|it|the|more)\b/i,
  /^\s*(yes|yeah|ok|sure|right),?\s+(now|and|so|continue|keep)\b/i,
  /^\s*(can you|could you)\s+(also|now|then|continue|elaborate)\b/i,
  /\b(the one|that|those|these)\b.*\?$/i
  // referential question
];
function isContinuation(prompt, cwd, host, last, sessionId) {
  if (last.host !== host) return false;
  if (sessionId && last.session_id && last.session_id !== sessionId) return false;
  if (last.delivered === false) return false;
  if (last.cwd !== cwd) return false;
  if (Date.now() - last.resolved_at > CONTINUITY_WINDOW_MS) return false;
  if (!last.had_content) return false;
  const trimmed = prompt.trim();
  if (trimmed.length <= 80) return true;
  for (const re of CONTINUATION_PATTERNS) {
    if (re.test(trimmed)) return true;
  }
  return false;
}
function buildContinuityMarker(auditId) {
  return [
    "<memlin-context-unchanged>",
    `# This turn is a follow-up to the prior turn. The same Memlin context applies.`,
    `# Refer to the bundle injected on the previous turn (audit_id: ${auditId}).`,
    "# If you need fresh context, ask the user to rephrase or invoke memlin_resolve_task directly.",
    "</memlin-context-unchanged>"
  ].join("\n");
}

// packages/plugin-core/dist/pending-bundle.js
import { spawn } from "node:child_process";
import { promises as fs2 } from "node:fs";
import path2 from "node:path";
import os2 from "node:os";
var PENDING_BUNDLE_MAX_AGE_MS = 10 * 60 * 1e3;
function pendingBundlePath() {
  return process.env.MEMLIN_RESOLVE_OUT ?? path2.join(os2.homedir(), ".config", "memlin", "pending-bundle.json");
}
async function takePendingBundle(cwd, host) {
  const file = pendingBundlePath();
  let bundle;
  try {
    bundle = JSON.parse(await fs2.readFile(file, "utf8"));
  } catch {
    return null;
  }
  if (typeof bundle !== "object" || bundle === null || typeof bundle.rendered !== "string" || bundle.rendered.length === 0) {
    await fs2.rm(file, { force: true }).catch(() => {
    });
    return null;
  }
  const expired = Date.now() - bundle.completed_at > PENDING_BUNDLE_MAX_AGE_MS;
  if (expired) {
    await fs2.rm(file, { force: true }).catch(() => {
    });
    return null;
  }
  if (bundle.cwd !== cwd || bundle.host !== host) {
    return null;
  }
  await fs2.rm(file, { force: true }).catch(() => {
  });
  return bundle;
}
var DEFAULT_RESOLVE_BUDGET_MS = 6e3;
function resolveBudgetMs() {
  const v = Number(process.env.MEMLIN_RESOLVE_BUDGET_MS);
  return Number.isFinite(v) && v >= 1e3 ? Math.floor(v) : DEFAULT_RESOLVE_BUDGET_MS;
}
function runResolveWithBudget(opts) {
  const budget = opts.budgetMs ?? resolveBudgetMs();
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, [opts.resolveBin, opts.task], {
        cwd: opts.cwd,
        env: {
          ...process.env,
          MEMLIN_HOST: opts.host,
          // Handoff contract with cli/resolve.ts: write the compiled bundle
          // to this file (atomic), and report a resolve.delivery telemetry
          // row when the deadline was missed.
          MEMLIN_RESOLVE_OUT: pendingBundlePath(),
          MEMLIN_RESOLVE_DEADLINE_MS: String(budget),
          // Forward the agent's session id so the resolve's usage_event is
          // attributable to this session (concurrent-work awareness).
          ...opts.sessionId ? { MEMLIN_SESSION_ID: opts.sessionId } : {}
        },
        // Detached + no shared stdio: when the caller stops waiting, the
        // child owns its own lifetime and finishes in the background.
        detached: true,
        stdio: "ignore"
      });
    } catch {
      resolve({ bundle: null, stillRunning: false });
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.unref();
      resolve({ bundle: null, stillRunning: true });
    }, budget);
    child.on("exit", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void takePendingBundle(opts.cwd, opts.host).then(
        (bundle) => resolve({ bundle, stillRunning: false })
      );
    });
    child.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ bundle: null, stillRunning: false });
    });
  });
}
function buildLateDeliveryEnvelope(bundle) {
  return [
    "<memlin-late-context>",
    "# Memlin context resolved for the PREVIOUS prompt \u2014 it finished after that",
    `# turn's delivery deadline. Task it was resolved for: ${JSON.stringify(bundle.task.slice(0, 140))}`,
    "# Treat as background context; invoke memlin_resolve_task if this turn needs fresh context.",
    "",
    bundle.rendered,
    "</memlin-late-context>"
  ].join("\n");
}

// packages/plugin-core/dist/scribe-notice.js
async function takeScribeNotice(currentSessionId) {
  let state;
  try {
    state = await readState();
  } catch {
    return "";
  }
  const notice = state.scribe_notice;
  const n = notice?.unsurfaced ?? 0;
  if (n <= 0) return "";
  try {
    delete state.scribe_notice;
    await writeState(state);
  } catch {
  }
  if (currentSessionId && notice?.session_id && notice.session_id !== currentSessionId) {
    return "";
  }
  return [
    "<memlin-notice>",
    "# Status line for the user \u2014 surface it, do not act on it.",
    `Memlin auto-captured ${n} new proposal${n === 1 ? "" : "s"} \u2014 review and accept/reject with /memlin-inbox.`,
    "</memlin-notice>",
    ""
  ].join("\n");
}
async function takeCorrectionNotice(currentSessionId) {
  let state;
  try {
    state = await readState();
  } catch {
    return "";
  }
  const notice = state.correction_notice;
  if (!notice || !notice.rule_title) return "";
  try {
    delete state.correction_notice;
    await writeState(state);
  } catch {
  }
  if (currentSessionId && notice.session_id && notice.session_id !== currentSessionId) {
    return "";
  }
  return [
    "<memlin-notice>",
    "# Status line for the user \u2014 surface it, do not act on it.",
    `\u26A1 Memlin captured a correction \u2192 rule: "${notice.rule_title}". It's active now; review or undo with /memlin-inbox.`,
    "</memlin-notice>",
    ""
  ].join("\n");
}

// apps/cli-plugin/src/hooks/user-prompt-submit.ts
var hookDir = path3.dirname(fileURLToPath(import.meta.url));
var RESOLVE_BIN = path3.resolve(hookDir, "../cli/resolve.js");
var PULL_PLANS_BIN = path3.resolve(hookDir, "../cli/pull-plans.js");
function firePlanSync(cwd) {
  try {
    const child = spawn2(process.execPath, [PULL_PLANS_BIN], {
      cwd,
      env: process.env,
      detached: true,
      stdio: "ignore"
    });
    child.unref();
  } catch {
  }
}
var TRIVIAL_PATTERNS = [
  /^\s*(hi|hey|hello|yo|sup|thanks?|thx|ty|ok|okay|cool|nice|got it|sounds good)[!.\s]*$/i,
  /^\s*(yes|no|yep|nope|sure|maybe|idk)[!.\s]*$/i,
  /^\s*\/[a-z-]+/i,
  // slash commands like /clear, /memlin-status — agent will handle.
  /^\s*[<>][a-z]/i
  // tags or partial XML
];
function isTrivial(prompt) {
  const trimmed = prompt.trim();
  if (!trimmed) return true;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length < 4) return true;
  return TRIVIAL_PATTERNS.some((re) => re.test(trimmed));
}
async function readPersistedTokenFreshness() {
  try {
    const raw = await fs3.readFile(
      path3.join(os3.homedir(), ".config", "memlin", "token.json"),
      "utf8"
    );
    const t = JSON.parse(raw);
    return Boolean(t.access_token);
  } catch {
    return false;
  }
}
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
  if (!payload?.prompt) {
    process.exit(0);
  }
  const prompt = payload.prompt;
  const cwd = payload.cwd || process.cwd();
  if (isTrivial(prompt)) {
    process.exit(0);
  }
  if (!await readPersistedTokenFreshness()) {
    process.exit(0);
  }
  const scribeNotice = await takeCorrectionNotice(payload.session_id) + await takeScribeNotice(payload.session_id);
  try {
    const state = await readState();
    if (state.last_resolve && isContinuation(prompt, cwd, "claude-code", state.last_resolve, payload.session_id ?? null)) {
      process.stdout.write(scribeNotice + buildContinuityMarker(state.last_resolve.audit_id));
      process.exit(0);
    }
  } catch {
  }
  const lateBundle = await takePendingBundle(cwd, "claude-code");
  firePlanSync(cwd);
  const outcome = await runResolveWithBudget({
    resolveBin: RESOLVE_BIN,
    task: prompt,
    cwd,
    host: "claude-code",
    sessionId: payload.session_id ?? null
  });
  if (outcome.bundle?.rendered) {
    process.stdout.write(
      scribeNotice + [
        "<memlin-resolved-context>",
        "# Auto-resolved by Memlin \u2014 authoritative project context. Apply skills, honor",
        "# goals, validate schemas, cite sources; do not re-invoke memlin_resolve_task.",
        "",
        outcome.bundle.rendered,
        "</memlin-resolved-context>"
      ].join("\n")
    );
    process.exit(0);
  }
  if (lateBundle) {
    process.stdout.write(scribeNotice + buildLateDeliveryEnvelope(lateBundle));
    try {
      const state = await readState();
      if (state.last_resolve && state.last_resolve.audit_id === lateBundle.audit_id) {
        state.last_resolve.delivered = true;
        await writeState(state);
      }
    } catch {
    }
    process.exit(0);
  }
  if (scribeNotice) process.stdout.write(scribeNotice);
  process.exit(0);
}
main().catch(() => process.exit(0));
