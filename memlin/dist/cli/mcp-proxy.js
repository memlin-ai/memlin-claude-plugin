import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// packages/plugin-core/src/cli/mcp-proxy.ts
import { createInterface } from "node:readline";

// packages/plugin-core/src/auth.ts
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

// packages/plugin-core/src/cli/mcp-proxy.ts
var MCP_URL = process.env.MEMLIN_MCP_URL || "https://memlin.ai/mcp";
function emit(payload) {
  const line = typeof payload === "string" ? payload.replace(/\r?\n/g, " ") : JSON.stringify(payload);
  process.stdout.write(line + "\n");
}
function errorResponse(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}
async function forward(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  const isRequest = msg.id !== void 0 && msg.id !== null;
  let token;
  try {
    token = await getValidAccessToken();
  } catch (err) {
    if (isRequest) {
      emit(errorResponse(msg.id, -32001, `Memlin: ${err instanceof Error ? err.message : String(err)}`));
    }
    return;
  }
  let res;
  try {
    res = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      body: line
    });
  } catch (err) {
    if (isRequest) {
      emit(errorResponse(msg.id, -32003, `Memlin MCP unreachable: ${err instanceof Error ? err.message : String(err)}`));
    }
    return;
  }
  const text = await res.text().catch(() => "");
  if (!isRequest || res.status === 204) return;
  if (!text) {
    emit(errorResponse(msg.id, -32002, `Memlin MCP returned HTTP ${res.status} with no body`));
    return;
  }
  emit(text);
}
var chain = Promise.resolve();
var rl = createInterface({ input: process.stdin });
rl.on("line", (raw) => {
  const line = raw.trim();
  if (!line) return;
  chain = chain.then(() => forward(line)).catch(() => {
  });
});
rl.on("close", () => {
  chain.finally(() => process.exit(0));
});
process.on("uncaughtException", (err) => {
  process.stderr.write(`memlin mcp-proxy: uncaught ${err instanceof Error ? err.stack ?? err.message : String(err)}
`);
});
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`memlin mcp-proxy: unhandled ${reason instanceof Error ? reason.message : String(reason)}
`);
});
