import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TOKEN = readFileSync(
  join(homedir(), ".wrangler", "config", "default.toml"),
  "utf8",
).match(/oauth_token\s*=\s*"([^"]+)"/)[1];

const ACCOUNT = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

const queries = [
  [
    "AI 推理（近7天）",
    `query($a:String!,$s:String!,$e:String!){viewer{accounts(filter:{accountTag:$a}){aiInferenceAdaptiveGroups(limit:100,filter:{date_geq:$s,date_leq:$e}){sum{totalNeurons}dimensions{date modelId}}}}}`,
    { a: ACCOUNT, s: "2026-10-01", e: "2026-10-14" },
  ],
  [
    "Workers 请求（本月按脚本，含 CPU）",
    `query($a:String!,$s:String!,$e:String!){viewer{accounts(filter:{accountTag:$a}){workersInvocationsAdaptive(limit:200,filter:{date_geq:$s,date_leq:$e}){sum{requests errors subrequests cpuTimeUs}dimensions{scriptName}}}}}`,
    { a: ACCOUNT, s: "2026-10-01", e: "2026-10-14" },
  ],
];

for (const [label, query, variables] of queries) {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  console.log(`### ${label}`);
  if (json.errors) {
    console.log("  ERR:", JSON.stringify(json.errors).slice(0, 300));
    continue;
  }
  const acc = json.data?.viewer?.accounts?.[0];
  const list =
    acc?.aiInferenceAdaptiveGroups ?? acc?.workersInvocationsAdaptive ?? [];
  for (const r of list) {
    console.log("  ", JSON.stringify(r));
  }
}
