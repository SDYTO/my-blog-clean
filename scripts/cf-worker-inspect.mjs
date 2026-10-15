/**
 * 只读排查指定 Worker：脚本元数据、绑定、路由归属、错误构成。
 * 用法：node scripts/cf-worker-inspect.mjs rin-server 2025rin-server my-blog flare-blog
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ACCOUNT_ID = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const TARGETS = process.argv.slice(2);
if (TARGETS.length === 0) throw new Error("usage: node cf-worker-inspect.mjs <scriptName...>");

const TOKEN = readFileSync(
  join(homedir(), ".wrangler", "config", "default.toml"),
  "utf8",
).match(/oauth_token\s*=\s*"([^"]+)"/)[1];

async function api(path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) {
    return { error: res.status, msg: JSON.stringify(json.errors ?? json).slice(0, 250) };
  }
  return json.result;
}

async function graphql(query, variables) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) return { error: JSON.stringify(json.errors).slice(0, 300) };
  return json.data;
}

console.log("### 1. 脚本元数据（大小 / 创建时间 / 修改时间）");
const settingsList = await api(`/accounts/${ACCOUNT_ID}/workers/scripts`);
const byName = new Map();
if (Array.isArray(settingsList)) {
  for (const s of settingsList) byName.set(s.id, s);
}
for (const name of TARGETS) {
  const s = byName.get(name);
  console.log(
    name,
    s
      ? JSON.stringify({
          created: s.created_on,
          modified: s.modified_on,
          usage_model: s.usage_model,
          placement: s.placement_mode,
          handlers: s.handlers,
          last_deploy: s.etag ? undefined : undefined,
          observed: s.observability?.enabled,
        })
      : "NOT FOUND",
  );
}

console.log("\n### 2. Worker 路由（Zone 级别 */*）");
const zones = await api(`/zones?per_page=50`);
if (Array.isArray(zones)) {
  for (const z of zones) {
    const routes = await api(`/zones/${z.id}/workers/routes`);
    if (Array.isArray(routes) && routes.length) {
      console.log(`zone ${z.name} (${z.id}):`);
      for (const r of routes) {
        console.log(
          `   ${r.pattern}  ->  ${r.script ?? "(none)"}   [${r.id}]`,
        );
      }
    }
  }
} else {
  console.log("zones:", JSON.stringify(zones).slice(0, 300));
}

console.log("\n### 3. 错误构成（本月，按 status / errorCode）");
const q = `query($a:String!,$s:String!,$e:String!){
  viewer { accounts(filter:{accountTag:$a}) {
    byStatus: workersInvocationsAdaptive(limit:100, filter:{date_geq:$s, date_leq:$e}, orderBy:[sum_requests_DESC]){
      sum { requests errors subrequests cpuTimeUs }
      dimensions { scriptName status errorCategory }
    }
  } }
}`;
const data = await graphql(q, { a: ACCOUNT_ID, s: "2026-10-01", e: "2026-10-14" });
if (data?.error) {
  console.log("byStatus error:", data.error);
} else {
  const rows = data?.viewer?.accounts?.[0]?.byStatus ?? [];
  const filtered = rows.filter((r) => TARGETS.includes(r.dimensions.scriptName));
  for (const r of filtered) {
    const d = r.dimensions;
    if (d.status !== "success" || r.sum.errors > 0) {
      console.log(
        `${d.scriptName}  status=${d.status} cat=${d.errorCategory}  req=${r.sum.requests} err=${r.sum.errors}`,
      );
    }
  }
  console.log("--- 总量核对 ---");
  for (const name of TARGETS) {
    const own = rows.filter((r) => r.dimensions.scriptName === name);
    const req = own.reduce((a, r) => a + r.sum.requests, 0);
    const err = own.reduce((a, r) => a + r.sum.errors, 0);
    console.log(`${name}: requests=${req} errors=${err}`);
  }
}

console.log("\n### 4. 分日趋势（排查错误是否仍在发生）");
const q2 = `query($a:String!,$s:String!,$e:String!){
  viewer { accounts(filter:{accountTag:$a}) {
    workersInvocationsAdaptive(limit:300, filter:{date_geq:$s, date_leq:$e}, orderBy:[date_ASC]){
      sum { requests errors cpuTimeUs }
      dimensions { date scriptName }
    }
  } }
}`;
const d2 = await graphql(q2, { a: ACCOUNT_ID, s: "2026-10-01", e: "2026-10-14" });
if (d2?.error) {
  console.log("daily error:", d2.error);
} else {
  const rows = d2?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [];
  for (const name of TARGETS) {
    const own = rows.filter((r) => r.dimensions.scriptName === name);
    if (!own.length) continue;
    console.log(`-- ${name}`);
    for (const r of own) {
      console.log(
        `   ${r.dimensions.date}  req=${String(r.sum.requests).padStart(6)}  err=${String(r.sum.errors).padStart(5)}  cpu=${(r.sum.cpuTimeUs / 1e6).toFixed(1)}s`,
      );
    }
  }
}
