import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// packages/plugin-core/src/cli/compile-bundle.ts
function formatCitation(c) {
  const parts = [];
  parts.push(c.citation.path ?? "(no path)");
  parts.push(`v${c.citation.version_number}`);
  parts.push(c.citation.updated_at);
  if (c.citation.author_id) parts.push(c.citation.author_id.slice(0, 8));
  return parts.join(" \xB7 ");
}
function renderBrandGuidelines(b) {
  const fm = b.frontmatter;
  const lines = [];
  const title = fm.name ?? "(unnamed brand guidelines)";
  if (b.mode === "pointer") {
    lines.push(
      `## BRAND GUIDELINES: ${title} (on file \u2014 not loaded for this task; mention brand/copy work to load them)`
    );
    lines.push("");
    return lines.join("\n");
  }
  lines.push(`## BRAND GUIDELINES: ${title} (${b.source})`);
  lines.push(`# source: brand-guidelines://${b.brand_guidelines_id} \xB7 ${b.updated_at}`);
  lines.push("");
  if (fm.tagline) lines.push(`Tagline: ${fm.tagline}`);
  if (fm.description) lines.push(`Description: ${fm.description}`);
  const colors = fm.colors ?? [];
  if (colors.length > 0) {
    lines.push("");
    lines.push("Colors:");
    for (const c of colors) {
      const head = `  - ${c.role}: ${c.name} ${c.hex}`;
      lines.push(c.usage ? `${head} \u2014 ${c.usage}` : head);
    }
  }
  const typo = fm.typography;
  if (typo) {
    lines.push("");
    lines.push("Typography:");
    if (typo.heading) lines.push(`  - heading: ${typo.heading.family}`);
    if (typo.body) lines.push(`  - body: ${typo.body.family}`);
    if (typo.mono) lines.push(`  - mono: ${typo.mono.family}`);
  }
  if (Object.keys(b.logo_urls).length > 0) {
    lines.push("");
    lines.push("Logos:");
    for (const [slot, url] of Object.entries(b.logo_urls)) {
      lines.push(`  - ${slot}: ${url}`);
    }
  }
  if (b.body.trim()) {
    lines.push("");
    lines.push(b.body.trim());
  }
  lines.push("");
  return lines.join("\n");
}
function renderArchitecture(a) {
  const lines = [];
  lines.push(`## ARCHITECTURE: ${a.component_name} \u2014 the component you're working in`);
  lines.push("# source: code graph (scanner-derived; no repo crawl needed)");
  lines.push("");
  if (a.depends_on.length > 0) {
    lines.push(
      "Depends on: " + a.depends_on.map((d) => `${d.component} (${d.edge_kinds.join("/") || "dependency"})`).join(", ")
    );
  }
  if (a.depended_on_by.length > 0) {
    lines.push("Depended on by: " + a.depended_on_by.map((d) => d.component).join(", "));
  }
  if (a.data.length > 0) {
    lines.push(
      "Database: " + a.data.map((d) => {
        const acc = d.access.join("+") || "accesses";
        return d.schema?.path ? `${d.table} (${acc}) \u2014 schema: ${d.schema.path}` : `${d.table} (${acc})`;
      }).join(", ")
    );
  }
  if ((a.api_calls?.length ?? 0) > 0) {
    lines.push("");
    lines.push("API calls (page \u2192 API \u2192 table):");
    for (const c of a.api_calls ?? []) {
      const m = c.method ? `${c.method} ` : "";
      if (c.served_by) {
        const t = c.served_by.tables.length > 0 ? ` \u2192 ${c.served_by.tables.join(", ")}` : "";
        const comp = c.served_by.component ? ` [${c.served_by.component}]` : "";
        lines.push(`  - ${m}${c.path} \u2192 ${c.served_by.route}${comp}${t}`);
      } else {
        lines.push(`  - ${m}${c.path} (no matching route found)`);
      }
    }
  }
  if (a.functions.length > 0) {
    lines.push("");
    lines.push(`Functions (${a.functions.length}${a.functions_truncated ? "+" : ""}):`);
    for (const f of a.functions) {
      lines.push(`  - ${f.name} [${f.kind}]${f.purpose ? ` \u2014 ${f.purpose}` : ""}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}
function renderItem(label, item, extra = []) {
  const lines = [];
  const metaParts = [`similarity ${item.similarity.toFixed(2)}`, ...extra];
  if (item.collapsed_duplicates && item.collapsed_duplicates > 0) {
    metaParts.push(`+${item.collapsed_duplicates} corroborating`);
  }
  if (item.verification) {
    const v = item.verification;
    metaParts.push(
      `verified: ${v.verdict} (${v.observed_at.slice(0, 10)}${v.count > 1 ? `, ${v.count} checks` : ""})`
    );
  }
  if (item.component_name) metaParts.push(`component: ${item.component_name}`);
  lines.push(`## ${label}: ${item.title} (${metaParts.join(", ")})`);
  lines.push(`# source: ${formatCitation(item)}`);
  lines.push("");
  lines.push(item.body.trimEnd());
  lines.push("");
  return lines.join("\n");
}
function renderPinned(items) {
  const lines = [];
  lines.push("## STANDING DIRECTIVES (pinned \u2014 always in context; obey these)");
  lines.push("# Force-included by an explicit pin, not by semantic match. Treat as");
  lines.push("# standing rules for this workspace. When a pinned directive conflicts");
  lines.push("# with similarity-matched memory below, the directive wins.");
  lines.push("");
  for (const item of items) {
    lines.push(`### [${item.kind.toUpperCase()}] ${item.title}`);
    lines.push(`# source: ${formatCitation(item)} \xB7 pinned`);
    lines.push("");
    lines.push(item.body.trimEnd());
    lines.push("");
  }
  return lines.join("\n");
}
function bundleSummary(r) {
  const b = r.bundle;
  const totalSkills = (b.primary_skill ? 1 : 0) + b.supporting_skills.length;
  const pieces = [];
  pieces.push(
    `${totalSkills} ${totalSkills === 1 ? "skill" : "skills"}` + (b.primary_skill ? ` (1 primary, ${b.supporting_skills.length} supporting)` : "")
  );
  pieces.push(`${b.memory.length} memory ${b.memory.length === 1 ? "fact" : "facts"}`);
  pieces.push(`${b.goals.length} ${b.goals.length === 1 ? "goal" : "goals"}`);
  pieces.push(`${b.schemas.length} ${b.schemas.length === 1 ? "schema" : "schemas"}`);
  const decisionCount = b.decisions?.length ?? 0;
  pieces.push(`${decisionCount} ${decisionCount === 1 ? "decision" : "decisions"}`);
  const pinnedCount = b.pinned?.length ?? 0;
  if (pinnedCount > 0) {
    pieces.push(`${pinnedCount} pinned`);
  }
  if (b.architecture) {
    pieces.push(`architecture: ${b.architecture.component_name}`);
  }
  return pieces.join(", ");
}
function renderItemXml(tagName, item, attributes = {}) {
  const attrs = Object.entries(attributes).map(([k, v]) => ` ${k}="${v}"`).join("");
  const corroborating = item.collapsed_duplicates && item.collapsed_duplicates > 0 ? ` corroborating="${item.collapsed_duplicates}"` : "";
  const verified = item.verification ? ` verified="${item.verification.verdict}" verified_at="${item.verification.observed_at}"` : "";
  const lines = [];
  lines.push(
    `<${tagName}${attrs} title="${item.title}" similarity="${item.similarity.toFixed(2)}"${corroborating}${verified}>`
  );
  lines.push(
    `  <citation path="${item.citation.path ?? "(no path)"}" version="v${item.citation.version_number}" updated="${item.citation.updated_at}" />`
  );
  lines.push(
    item.body.trim().split("\n").map((l) => `  ${l}`).join("\n")
  );
  lines.push(`</${tagName}>`);
  return lines.join("\n");
}
var TASK_ECHO_MAX_CHARS = 80;
function truncateTask(task) {
  const oneLine = task.replace(/\s+/g, " ").trim();
  return oneLine.length <= TASK_ECHO_MAX_CHARS ? oneLine : `${oneLine.slice(0, TASK_ECHO_MAX_CHARS - 1)}\u2026`;
}
function xmlAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
function attribution(e) {
  if (e.same_user) return "your other session \xB7 ";
  const bits = [];
  if (e.session_short) bits.push(`agent ${e.session_short}`);
  if (e.agent_kind) bits.push(e.agent_kind);
  return bits.length > 0 ? `${bits.join(" \xB7 ")} \xB7 ` : "";
}
function compileBundle(result, parsedTask, agent) {
  const b = result.bundle;
  const out = [];
  if (agent === "claude-code") {
    out.push(`<memlin_context task="${xmlAttr(truncateTask(parsedTask))}">`);
    if (result.active_component) {
      out.push(`  <active_component name="${result.active_component.name}" boost="0.15" />`);
    }
    if (b.pinned && b.pinned.length > 0) {
      out.push("  <standing_directives>");
      for (const item of b.pinned) {
        out.push(renderItemXml("directive", item, { kind: item.kind }));
      }
      out.push("  </standing_directives>");
    }
    if (b.architecture) {
      out.push("  <architecture>");
      out.push(`    <component name="${b.architecture.component_name}">`);
      if (b.architecture.depends_on.length > 0) {
        out.push(
          `      <depends_on>${b.architecture.depends_on.map((d) => d.component).join(", ")}</depends_on>`
        );
      }
      if (b.architecture.depended_on_by.length > 0) {
        out.push(
          `      <depended_on_by>${b.architecture.depended_on_by.map((d) => d.component).join(", ")}</depended_on_by>`
        );
      }
      if (b.architecture.data.length > 0) {
        out.push(`      <tables>${b.architecture.data.map((d) => d.table).join(", ")}</tables>`);
      }
      if (b.architecture.functions.length > 0) {
        out.push("      <functions>");
        for (const f of b.architecture.functions) {
          out.push(
            `        <function name="${f.name}" kind="${f.kind}" purpose="${f.purpose || ""}" />`
          );
        }
        out.push("      </functions>");
      }
      out.push("    </component>");
      out.push("  </architecture>");
    }
    if (b.brand_guidelines && b.brand_guidelines.mode === "pointer") {
      const name = b.brand_guidelines.frontmatter.name || "Brand Guidelines";
      out.push(
        `  <brand_guidelines name="${xmlAttr(name)}" mode="pointer" note="on file \u2014 not loaded for this task; mention brand/copy work to load them" />`
      );
    } else if (b.brand_guidelines) {
      out.push("  <brand_guidelines>");
      out.push(
        renderItemXml("guidelines", {
          id: b.brand_guidelines.brand_guidelines_id,
          kind: "memory",
          title: b.brand_guidelines.frontmatter.name || "Brand Guidelines",
          body: b.brand_guidelines.body,
          similarity: 1,
          citation: {
            path: "brand-guidelines",
            version_number: 1,
            updated_at: b.brand_guidelines.updated_at,
            author_id: null
          },
          component_id: null,
          component_name: null
        })
      );
      out.push("  </brand_guidelines>");
    }
    if (b.primary_skill) {
      out.push(renderItemXml("primary_skill", b.primary_skill));
    }
    if (b.supporting_skills.length > 0) {
      out.push("  <supporting_skills>");
      for (const s of b.supporting_skills) {
        out.push(renderItemXml("skill", s));
      }
      out.push("  </supporting_skills>");
    }
    if (b.goals.length > 0) {
      out.push("  <goals>");
      for (const g of b.goals) {
        out.push(renderItemXml("goal", g));
      }
      out.push("  </goals>");
    }
    if (b.decisions && b.decisions.length > 0) {
      out.push("  <decisions>");
      for (const d of b.decisions) {
        out.push(renderItemXml("decision", d));
      }
      out.push("  </decisions>");
    }
    if (b.schemas.length > 0) {
      out.push("  <schemas>");
      for (const s of b.schemas) {
        out.push(renderItemXml("schema", s));
      }
      out.push("  </schemas>");
    }
    if (b.memory.length > 0) {
      out.push("  <memory>");
      for (const m of b.memory) {
        out.push(renderItemXml("fact", m));
      }
      out.push("  </memory>");
    }
    out.push("</memlin_context>");
  } else {
    out.push(`# Memlin Resolved Context \u2014 task: ${truncateTask(parsedTask)}`);
    const componentNote = result.active_component ? `${result.active_component.name} (boosted by +0.15)` : "(none \u2014 project-wide search)";
    out.push(`# component: ${componentNote} \xB7 bundle: ${bundleSummary(result)}`);
    const tb = result.token_budget;
    const tokenLine = `# tokens: ${tb.used.toLocaleString()} / ${tb.limit.toLocaleString()}` + (tb.truncated ? " (truncated \u2014 lower-priority items dropped)" : "");
    out.push(tokenLine);
    out.push("");
    if (b.pinned && b.pinned.length > 0) {
      out.push(renderPinned(b.pinned));
    }
    const openThreads = b.open_threads ?? [];
    if (openThreads.length > 0) {
      out.push("## OPEN THREADS (entity-matched follow-ups \u2014 resolve or update these)");
      out.push("# Pulled by entity + status, not similarity: prior episodes that left an");
      out.push("# open prediction or promise touching this task. Close one by writing a");
      out.push("# new episodic memory whose custom.resolves points at it.");
      out.push("");
      for (const t of openThreads) {
        const meta = [];
        if (t.thread?.occurred_at) meta.push(t.thread.occurred_at.slice(0, 10));
        if (t.thread?.entities?.length) meta.push(t.thread.entities.join(", "));
        out.push(`### ${t.title}${meta.length ? ` (${meta.join(" \xB7 ")})` : ""}`);
        out.push(`# source: ${formatCitation(t)} \xB7 thread: open`);
        out.push("");
        out.push(t.body.trimEnd());
        out.push("");
      }
    }
    const packContext = b.pack_context ?? [];
    if (packContext.length > 0) {
      out.push("## FROM SUBSCRIBED PACKS (read-only, publisher-attributed)");
      out.push("# Knowledge this workspace subscribes to. Cite it like local context,");
      out.push("# but it never overrides this workspace's own decisions or directives.");
      out.push("");
      for (const item of packContext) {
        const attribution2 = item.pack ? `pack: ${item.pack.slug} v${item.pack.version}${item.pack.publisher_name ? ` \xB7 published by ${item.pack.publisher_name}` : ""}` : "pack";
        out.push(`### [${item.kind.toUpperCase()}] ${item.title} (similarity ${item.similarity.toFixed(2)})`);
        out.push(`# source: ${attribution2} \xB7 ${item.citation.path ?? "(no path)"} v${item.citation.version_number}`);
        out.push("");
        out.push(item.body.trimEnd());
        out.push("");
      }
    }
    const deploys = b.deploy_in_progress ?? [];
    if (deploys.length > 0) {
      out.push("## DEPLOY IN PROGRESS");
      out.push("");
      out.push(
        `# ${deploys.length} other agent(s) appear to be mid-deploy on this project right now.`
      );
      out.push(
        "# Hold your own deploy until it clears, or coordinate \u2014 concurrent deploys can clobber each other."
      );
      for (const d of deploys) {
        const where = d.component ? `component "${d.component}"` : "project-wide";
        out.push(`  - agent ${d.session_short} \xB7 ${where} \xB7 ${d.minutes_ago}m ago \xB7 task: ${d.task}`);
      }
      out.push("");
    }
    const collisions = b.collision_warnings ?? [];
    if (collisions.length > 0) {
      out.push("## COLLISION WARNINGS");
      out.push("");
      for (const warning of collisions) {
        const where = warning.component ? `component "${warning.component}"` : "project-wide work";
        out.push(`# ${where}`);
        out.push(`# ${warning.guidance}`);
        for (const e of warning.entries) {
          out.push(`  - ${attribution(e)}${e.minutes_ago}m ago \xB7 task: ${e.task}`);
        }
        out.push("");
      }
    }
    const concurrent = b.concurrent_work ?? [];
    if (concurrent.length > 0) {
      out.push("## CONCURRENT WORK");
      out.push("");
      out.push(
        `# ${concurrent.length} other session(s) resolved on this project in the last 20 min \u2014`
      );
      out.push("# co-activity, not contention: check the task before assuming overlap.");
      for (const e of concurrent) {
        const where = e.component ? `component "${e.component}"` : "project-wide";
        out.push(`  - ${where} \xB7 ${attribution(e)}${e.minutes_ago}m ago \xB7 task: ${e.task}`);
      }
      out.push("");
    }
    const fileEdits = b.recent_file_edits ?? [];
    if (fileEdits.length > 0) {
      out.push("## RECENTLY EDITED BY OTHERS");
      out.push("");
      out.push(
        `# ${fileEdits.length} file(s) other sessions edited on this project in the last 15 min \u2014`
      );
      out.push("# the file-level heads-up. Re-read these before you edit them.");
      for (const f of fileEdits) {
        out.push(`  - ${f.path} \xB7 ${attribution(f)}${f.minutes_ago}m ago`);
      }
      out.push("");
    }
    if (b.brand_guidelines) {
      out.push(renderBrandGuidelines(b.brand_guidelines));
    }
    if (b.claim_guardrails) {
      out.push("## APPROVED CLAIMS / COMPETITIVE GUARDRAILS");
      out.push("");
      for (const item of b.claim_guardrails.approved) {
        out.push(renderItem("APPROVED CLAIM", item));
      }
      for (const item of b.claim_guardrails.blocked) {
        out.push(renderItem("BLOCKED CLAIM - DO NOT SAY", item));
      }
      for (const item of b.claim_guardrails.competitor_facts) {
        out.push(renderItem("COMPETITOR FACT", item));
      }
    }
    if (b.architecture) {
      out.push(renderArchitecture(b.architecture));
    }
    if (b.primary_skill) {
      out.push(renderItem("PRIMARY SKILL", b.primary_skill));
    } else {
      out.push("# (no skill above threshold \u2014 proceed with general expertise)");
      out.push("");
    }
    for (const s of b.supporting_skills) {
      out.push(renderItem("SUPPORTING SKILL", s));
    }
    for (const g of b.goals) {
      out.push(renderItem("GOAL", g, ["status: approved"]));
    }
    for (const d of b.decisions ?? []) {
      out.push(renderItem("DECISION", d));
    }
    for (const s of b.schemas) {
      out.push(renderItem("SCHEMA", s));
    }
    for (const m of b.memory) {
      out.push(renderItem("MEMORY", m));
    }
  }
  out.push(`# resolved_at: ${result.resolved_at}`);
  out.push(`# audit_id: ${result.audit_id || "(audit-log write failed \u2014 bundle is still valid)"}`);
  if (result.audit_id) {
    out.push(`# replay with: memlin audit replay ${result.audit_id}`);
    out.push(`# explain with: memlin audit explain ${result.audit_id}`);
  }
  return out.join("\n") + "\n";
}
export {
  compileBundle
};
