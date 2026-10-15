/**
 * 拉取 Cloudflare 账户的 Workers / Pages / D1 / KV / R2 / Queues / DO 用量与资源配置。
 * 认证：复用 wrangler 的 OAuth 令牌（~/.wrangler/config/default.toml）。
 * 用法：node scripts/cf-usage-report.mjs [accountId]
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ACCOUNT_ID = process.argv[2] ?? "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

function readToken() {
  const p = join(homedir(), ".wrangler", "config", "default.toml");
  const raw = readFileSync(p, "utf8");
  const m = raw.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (!m) throw new Error("oauth_token not found in wrangler config");
  return m[1];
}

const TOKEN = readToken();

async function api(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: res.ok, status: res.status, raw: text.slice(0, 300) };
  }
  return { ok: res.ok, status: res.status, ...json };
}

async function graphql(query, variables = {}) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) return { error: json.errors };
  return json.data;
}

/** 安全取数组：结果不是数组时记录错误信息，返回 [] */
function arr(res, label) {
  if (Array.isArray(res?.result)) return res.result;
  const err = res?.errors?.map((e) => `${e.code}:${e.message}`).join("; ");
  console.error(
    `[warn] ${label} 拉取失败 status=${res?.status} ${err ?? JSON.stringify(res).slice(0, 200)}`,
  );
  return [];
}

const out = {};
const now = new Date();
const day = (d) => d.toISOString().slice(0, 10);
const since1 = day(new Date(now.getTime() - 24 * 3600 * 1000));
const since7 = day(new Date(now.getTime() - 7 * 24 * 3600 * 1000));
const since30 = day(new Date(now.getTime() - 30 * 24 * 3600 * 1000));
const sinceMonthStart = `${now.toISOString().slice(0, 7)}-01`;
const today = day(now);

// ---- 资源清单 ----
const [workers, pages, d1, kv, queues, buckets] = await Promise.all([
  api(`/accounts/${ACCOUNT_ID}/workers/scripts`),
  api(`/accounts/${ACCOUNT_ID}/pages/projects`),
  api(`/accounts/${ACCOUNT_ID}/d1/database`),
  api(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`),
  api(`/accounts/${ACCOUNT_ID}/queues`),
  api(`/accounts/${ACCOUNT_ID}/r2/buckets`),
]);

out.resources = {
  workers: arr(workers, "workers/scripts").map((w) => ({
    id: w.id,
    modified: w.modified_on,
    usage_model: w.usage_model,
    placement: w.placement_mode,
    compat: w.compatibility_date,
  })),
  pages: arr(pages, "pages/projects").map((p) => ({
    name: p.name,
    domain: p.subdomain,
    created: p.created_on,
    latestDeploy: p.latest_deployment
      ? {
          created: p.latest_deployment.created_on,
          stage: p.latest_deployment.latest_stage?.name,
          status: p.latest_deployment.latest_stage?.status,
        }
      : null,
    buildConfig: p.build_config
      ? {
          cmd: p.build_config.build_command,
          dest: p.build_config.destination_dir,
        }
      : null,
  })),
  d1: arr(d1, "d1/database").map((d) => ({
    name: d.name,
    id: d.uuid,
    created: d.created_at,
    version: d.version,
  })),
  kv: arr(kv, "storage/kv/namespaces").map((k) => ({
    id: k.id,
    title: k.title,
  })),
  queues: arr(queues, "queues").map((q) => ({
    name: q.queue_name,
    consumers: q.consumers?.length ?? 0,
    producers: q.producers?.length ?? 0,
  })),
  r2: arr(buckets, "r2/buckets").map((b) => ({
    name: b.name,
    created: b.creation_date,
    location: b.location,
  })),
};

// ---- 用量（GraphQL 数据集，逐个容错） ----
const queries = {
  // 近 30 天按天：请求数/错误/子请求/CPU 时间（按脚本维度）
  workersDaily30: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      workersInvocationsAdaptive(limit:1000, filter:{date_geq:$s, date_leq:$e}, orderBy:[date_ASC]){
        sum { requests errors subrequests cpuTimeUs }
        dimensions { date scriptName }
      } } } }`,
    v: { a: ACCOUNT_ID, s: since30, e: today },
  },
  // 本月合计（账单口径）
  workersMonth: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      workersInvocationsAdaptive(limit:1000, filter:{date_geq:$s, date_leq:$e}){
        sum { requests errors subrequests cpuTimeUs }
        dimensions { scriptName }
      } } } }`,
    v: { a: ACCOUNT_ID, s: sinceMonthStart, e: today },
  },
  // 近 24 小时按小时（看峰谷）
  workersHourly24: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      workersInvocationsAdaptive(limit:2000, filter:{date_geq:$s, date_leq:$e}, orderBy:[datetimeHour_ASC]){
        sum { requests errors subrequests cpuTimeUs }
        dimensions { datetimeHour scriptName }
      } } } }`,
    v: { a: ACCOUNT_ID, s: since1, e: today },
  },
  d1Daily7: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      d1AnalyticsAdaptiveGroups(limit:200, filter:{date_geq:$s, date_leq:$e}, orderBy:[date_ASC]){
        sum { readQueries writeQueries rowsRead rowsWritten }
        dimensions { date databaseId }
      } } } }`,
    v: { a: ACCOUNT_ID, s: since7, e: today },
  },
  d1Month: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      d1AnalyticsAdaptiveGroups(limit:200, filter:{date_geq:$s, date_leq:$e}){
        sum { readQueries writeQueries rowsRead rowsWritten }
        dimensions { databaseId }
      } } } }`,
    v: { a: ACCOUNT_ID, s: sinceMonthStart, e: today },
  },
  kvDaily7: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      kvOperationsAdaptiveGroups(limit:300, filter:{date_geq:$s, date_leq:$e}, orderBy:[date_ASC]){
        sum { requests }
        dimensions { date namespaceId actionType }
      } } } }`,
    v: { a: ACCOUNT_ID, s: since7, e: today },
  },
  kvMonth: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      kvOperationsAdaptiveGroups(limit:300, filter:{date_geq:$s, date_leq:$e}){
        sum { requests }
        dimensions { namespaceId actionType }
      } } } }`,
    v: { a: ACCOUNT_ID, s: sinceMonthStart, e: today },
  },
  r2Daily7: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      r2OperationsAdaptiveGroups(limit:300, filter:{date_geq:$s, date_leq:$e}, orderBy:[date_ASC]){
        sum { requests }
        dimensions { date actionType bucketName }
      } } } }`,
    v: { a: ACCOUNT_ID, s: since7, e: today },
  },
  r2Month: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      r2OperationsAdaptiveGroups(limit:300, filter:{date_geq:$s, date_leq:$e}){
        sum { requests }
        dimensions { actionType bucketName }
      } } } }`,
    v: { a: ACCOUNT_ID, s: sinceMonthStart, e: today },
  },
  doDaily7: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      durableObjectsInvocationsAdaptiveGroups(limit:300, filter:{date_geq:$s, date_leq:$e}, orderBy:[date_ASC]){
        sum { requests }
        dimensions { date }
      } } } }`,
    v: { a: ACCOUNT_ID, s: since7, e: today },
  },
  queueMonth: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      queueMessageOperationsAdaptiveGroups(limit:300, filter:{date_geq:$s, date_leq:$e}){
        sum { billableOperations }
        dimensions { queueId }
      } } } }`,
    v: { a: ACCOUNT_ID, s: sinceMonthStart, e: today },
  },
  workersBuildsMonth: {
    q: `query($a:String!,$s:String!,$e:String!){ viewer { accounts(filter:{accountTag:$a}) {
      workersBuildsAdaptiveGroups(limit:200, filter:{date_geq:$s, date_leq:$e}){
        sum { buildsMinutes buildRuns }
        dimensions { date }
      } } } }`,
    v: { a: ACCOUNT_ID, s: sinceMonthStart, e: today },
  },
};

for (const [key, { q, v }] of Object.entries(queries)) {
  try {
    const data = await graphql(q, v);
    out[key] = data?.viewer?.accounts?.[0] ?? data;
  } catch (err) {
    out[key] = { error: String(err) };
  }
}

// ---- 套餐信息 ----
try {
  out.subscription = await api(`/accounts/${ACCOUNT_ID}/subscriptions`);
} catch (err) {
  out.subscription = { error: String(err) };
}
try {
  out.account = await api(`/accounts/${ACCOUNT_ID}`);
} catch (err) {
  out.account = { error: String(err) };
}

// ---- Pages 近 30 天构建次数（REST 部署列表） ----
const pagesBuilds = {};
for (const p of out.resources.pages) {
  try {
    const res = await api(
      `/accounts/${ACCOUNT_ID}/pages/projects/${p.name}/deployments?per_page=100`,
    );
    const list = Array.isArray(res.result) ? res.result : [];
    const cutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000).getTime();
    const recent = list.filter(
      (d) => new Date(d.created_on).getTime() >= cutoff,
    );
    pagesBuilds[p.name] = {
      deploymentsLast30d: recent.length,
      deploymentsTotalFetched: list.length,
      lastCreated: list[0]?.created_on ?? null,
    };
  } catch (err) {
    pagesBuilds[p.name] = { error: String(err) };
  }
}
out.pagesBuilds = pagesBuilds;

console.log(JSON.stringify(out, null, 1));
