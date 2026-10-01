// Can Laya pick the calendar assistant's tool? Tools, instructions and labelled
// messages live in cases.json (the UI at / uses the same file).
// Run: LAYA_URL=https://<app>.up.railway.app node test.ts   (or http://localhost:8000)

import { readFileSync } from "node:fs";

const URL_ = process.env.LAYA_URL ?? "http://localhost:8000";
const { instructions, tools, cases } = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf8")) as {
  instructions: string;
  tools: Record<string, string>;
  cases: { said: string; before?: string; want: string; real?: boolean }[];
};

// Same shape as index.html's stateFor(): today + the conversation so far + the message.
const TODAY = "Thursday 2026-10-01, 14:00";
const stateFor = (c: { said: string; before?: string }) => ({
  today: TODAY,
  conversation: c.before ? `Assistant: ${c.before}` : "(this is the first message)",
  latest_user_message: c.said,
});

const t0 = performance.now();
const res = await fetch(`${URL_}/v1/systemone/batch`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ states: cases.map(stateFor), questions: { tool: { type: "choice", instructions, criteria: tools } } }),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const ms = performance.now() - t0;
const { results } = (await res.json()) as { results: any[] };

let ok = 0;
const mixups = new Map<string, number>();
for (const [i, c] of cases.entries()) {
  const a = results[i].answers.tool;
  const hit = a.choice === c.want;
  ok += +hit;
  if (!hit) mixups.set(`${c.want} → ${a.choice}`, (mixups.get(`${c.want} → ${a.choice}`) ?? 0) + 1);
  const ctx = c.before ? `  [after: "${c.before.slice(0, 30)}…"]` : "";
  console.log(`${hit ? " " : "✗"} ${(c.said + ctx).slice(0, 78).padEnd(78)} ${a.choice} ${a.confidence.toFixed(2)}${hit ? "" : `  (want ${c.want})`}`);
}
const truncated = results.filter((r) => r.usage?.truncated).length;
console.log(`\n${ok}/${cases.length} right (${Math.round((100 * ok) / cases.length)}%)   ${Math.round(ms)} ms for the batch, ${Math.round(ms / cases.length)} ms/message incl. network${truncated ? `   ⚠ ${truncated} inputs truncated` : ""}`);
if (mixups.size) console.log("Mix-ups:", Object.fromEntries(mixups));
