import { readFileSync } from "node:fs";

const path = process.argv[2];
const d = JSON.parse(readFileSync(path, "utf8"));

const LIMITS = {
  workersFree: { requestsPerDay: 100_000, cpuMsPerInvocation: 10 },
  workersPaid: { requestsPerMonth: 10_000_000, cpuMsPerMonth: 30_000_000 },
  d1Free: { rowsReadPerDay: 5_000_000, rowsWrittenPerDay: 100_000 },
  d1Paid: { rowsReadPerMonth: 25_000_000_000, rowsWrittenPerMonth: 50_000_000 },
  kvFree: { readsPerDay: 100_000, writesPerDay: 1_000 },
  kvPaid: { readsPerMonth: 10_000_000, writesPerMonth: 1_000_000 },
  pagesFree: { buildsPerMonth: 500 },
  r2Free: { classAOpsPerMonth: 1_000_000, classBOpsPerMonth: 10_000_000 },
};

console.log("### 资源清单");
console.log("Workers:", d.resources.workers.map((w) => w.id).join(", "));
console.log("Pages:", d.resources.pages.map((p) => p.name).join(", "));
console.log("D1:", d.resources.d1.map((x) => `${x.name}(${x.id.slice(0, 8)})`).join(", "));
console.log("KV:", d.resources.kv.map((x) => x.title).join(", "));
console.log("Queues:", JSON.stringify(d.resources.queues));

console.log("\n### 套餐");
console.log(JSON.stringify(d.subscription).slice(0, 900));
console.log("account:", JSON.stringify(d.account).slice(0, 400));

function rows(key) {
  const node = d[key];
  if (!node) return [];
  if (node.error) return [{ error: JSON.stringify(node.error).slice(0, 200) }];
  const holder = node.workersInvocationsAdaptive ?? node.d1AnalyticsAdaptiveGroups ??
    node.kvOperationsAdaptiveGroups ?? node.r2OperationsAdaptiveGroups ??
    node.durableObjectsInvocationsAdaptiveGroups ?? node.queueMessageOperationsAdaptiveGroups ??
    node.workersBuildsAdaptiveGroups;
  return Array.isArray(holder) ? holder : [];
}

const dayKey = (k) => (k === "workersMonth" ? "scriptName" : "date");

console.log("\n### Workers 本月合计（按脚本）");
for (const r of rows("workersMonth")) {
  const s = r.sum;
  console.log(
    `  ${r.dimensions?.scriptName}: req=${s?.requests} err=${s?.errors} subreq=${s?.subrequests} cpuMs=${((s?.cpuTimeUs ?? 0) / 1000).toFixed(0)}`,
  );
}

console.log("\n### Workers 近30天总计");
let tot = { requests: 0, errors: 0, subrequests: 0, cpuTimeUs: 0 };
for (const r of rows("workersDaily30")) {
  tot.requests += r.sum?.requests ?? 0;
  tot.errors += r.sum?.errors ?? 0;
  tot.subrequests += r.sum?.subrequests ?? 0;
  tot.cpuTimeUs += r.sum?.cpuTimeUs ?? 0;
}
console.log(JSON.stringify({
  requests: tot.requests,
  requestsPerDayAvg: Math.round(tot.requests / 30),
  errors: tot.errors,
  subrequests: tot.subrequests,
  cpuMsTotal: Math.round(tot.cpuTimeUs / 1000),
}));

console.log("\n### Workers 近24小时（按小时聚合，前10条）");
for (const r of rows("workersHourly24").slice(0, 10)) {
  console.log(`  ${r.dimensions?.datetimeHour} ${r.dimensions?.scriptName}: req=${r.sum?.requests} cpuMs=${((r.sum?.cpuTimeUs ?? 0) / 1000).toFixed(1)}`);
}

console.log("\n### Workers 近30天（按天 × 脚本，仅打印我的站点）");
for (const r of rows("workersDaily30")) {
  if (!["my-blog", "flare-blog"].includes(r.dimensions?.scriptName)) continue;
  console.log(`  ${r.dimensions.date} ${r.dimensions.scriptName}: req=${r.sum?.requests} err=${r.sum?.errors} subreq=${r.sum?.subrequests} cpuMs=${((r.sum?.cpuTimeUs ?? 0) / 1000).toFixed(0)}`);
}

console.log("\n### D1 本月（按库）");
for (const r of rows("d1Month")) {
  const s = r.sum;
  console.log(`  ${r.dimensions?.databaseId}: read=${s?.readQueries} write=${s?.writeQueries} rowsRead=${s?.rowsRead} rowsWritten=${s?.rowsWritten}`);
}

console.log("\n### D1 近7天（按天 × 库）");
for (const r of rows("d1Daily7")) {
  const s = r.sum;
  console.log(`  ${r.dimensions?.date} ${String(r.dimensions?.databaseId).slice(0, 8)}: read=${s?.readQueries} write=${s?.writeQueries} rowsRead=${s?.rowsRead} rowsWritten=${s?.rowsWritten}`);
}

console.log("\n### KV 本月（按命名空间 × 动作）");
for (const r of rows("kvMonth")) {
  console.log(`  ${r.dimensions?.namespaceId} ${r.dimensions?.actionType}: ${r.sum?.requests}`);
}

console.log("\n### KV 近7天（按天）");
for (const r of rows("kvDaily7")) {
  console.log(`  ${r.dimensions?.date} ${String(r.dimensions?.namespaceId).slice(0, 8)} ${r.dimensions?.actionType}: ${r.sum?.requests}`);
}

console.log("\n### R2 本月");
console.log(JSON.stringify(rows("r2Month")).slice(0, 900));

console.log("\n### DO 近7天");
console.log(JSON.stringify(rows("doDaily7")).slice(0, 600));

console.log("\n### Queues 本月");
console.log(JSON.stringify(rows("queueMonth")).slice(0, 600));

console.log("\n### Workers Builds 本月");
console.log(JSON.stringify(rows("workersBuildsMonth")).slice(0, 600));

console.log("\n### Pages 近30天构建");
console.log(JSON.stringify(d.pagesBuilds, null, 1));

console.log("\n### 免费额度参照");
console.log(JSON.stringify(LIMITS, null, 1));
