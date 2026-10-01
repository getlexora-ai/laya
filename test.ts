// Can Laya pick find-time's tool instead of Gemini? No calendar, no Gemini:
// labelled messages → Laya → which tool, how sure, how fast.
// Run: LAYA_URL=https://<app>.up.railway.app node test.ts   (or http://localhost:8000)

const URL_ = process.env.LAYA_URL ?? "http://localhost:8000";

// find-time's chat tools (src/server/ai/chat.ts), described the way a user would see them.
const TOOLS = {
  propose_blocks: "find a free slot for something; the user did not say a clock time (\"find time for gym this week\", \"two hours tomorrow evening\")",
  place_at: "put something on the calendar at a clock time the user said (\"gym 6-8pm\", \"dentist friday 9:30 for 30 min\")",
  ask_clarification: "something needed is missing or unclear: no day, no length, am or pm unknown, or which thing is meant",
  record_rule: "a standing rule for the future (\"never book me before 10\", \"keep Fridays free\")",
  block_time_off: "the user will be away or unavailable for a stretch (vacation, trip, sick, day off)",
  answer: "a question or remark that needs words, not a calendar change (\"what's on Friday?\", \"why that slot?\", \"thanks\")",
};

type Case = { said: string; before?: string; want: keyof typeof TOOLS };
// `before` = the assistant's previous message, when the message is a reply to it.
const CASES: Case[] = [
  // Real messages from find-time's ai_messages (Sep 2026)
  { said: "I want to go to gym when can i do it, it takes 2 hours to go and come from gym", want: "ask_clarification" },
  { said: "i need it for today in the evening", before: "When would you like to fit in gym?", want: "propose_blocks" },
  { said: "Gym today in the evening, 2 hours", want: "propose_blocks" },
  { said: "gym today at 6pm for 2 hours", want: "place_at" },
  { said: "Find three 45-minute review slots this week", want: "propose_blocks" },
  { said: "17th from 6pm till 22nd 6pm i am on vacation, going to copenhagen", want: "block_time_off" },
  { said: "i am going on vacation from 17th september evening till 22nd sep evening. block my calendar for that", want: "block_time_off" },
  { said: "when am i going for vacation", want: "answer" },
  { said: "did you book the entire slots? or just noted?", want: "answer" },
  // Exact times
  { said: "i am planning to do gym 6-8pm", want: "place_at" },
  { said: "dentist friday 9:30-10am", want: "place_at" },
  { said: "call with Priya tomorrow 15:00-15:30", want: "place_at" },
  // Missing or ambiguous
  { said: "gym at 6", want: "ask_clarification" },
  { said: "run at 5:30", want: "ask_clarification" },
  { said: "schedule a meeting", want: "ask_clarification" },
  { said: "put yoga on my calendar", want: "ask_clarification" },
  { said: "dentist tomorrow at 9am", want: "ask_clarification" }, // start but no length
  // Answers to a question: only the previous message makes these readable
  { said: "18:00", before: "Did you mean 18:00 or 06:00?", want: "place_at" },
  { said: "1 hour", before: "How long do you need for deep work?", want: "propose_blocks" },
  { said: "Tomorrow", before: "When would you like to fit in gym?", want: "ask_clarification" }, // length still unknown
  // Finding time
  { said: "block 2 hours of deep work tomorrow morning", want: "propose_blocks" },
  { said: "find me an hour this week for a haircut", want: "propose_blocks" },
  { said: "too early, make it later", before: "I've found time for a 2-hour gym session for you.", want: "propose_blocks" },
  { said: "make it 90 minutes", before: "I've found time for deep work.", want: "propose_blocks" },
  // Rules
  { said: "never book me before 10", want: "record_rule" },
  { said: "keep fridays meeting free", want: "record_rule" },
  { said: "always leave 15 minutes after a call", want: "record_rule" },
  // Time away
  { said: "I'm out friday afternoon", want: "block_time_off" },
  { said: "at a wedding all weekend", want: "block_time_off" },
  { said: "sick today", want: "block_time_off" },
  // Words only
  { said: "what's on my calendar tomorrow?", want: "answer" },
  { said: "why did you pick that slot?", want: "answer" },
  { said: "thanks!", want: "answer" },
  { said: "what's the weather like", want: "answer" },
];

const questions = {
  tool: {
    type: "choice",
    instructions: "Which action should the calendar assistant take for the user's latest message? Read it as a reply to the assistant's previous message, if there is one.",
    criteria: TOOLS,
  },
};

const t0 = performance.now();
const res = await fetch(`${URL_}/v1/systemone/batch`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    states: CASES.map((c) => (c.before ? { assistant_said: c.before, user_said: c.said } : { user_said: c.said })),
    questions,
  }),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const ms = performance.now() - t0;
const { results } = (await res.json()) as { results: any[] };

let ok = 0;
const mixups = new Map<string, number>();
for (const [i, c] of CASES.entries()) {
  const a = results[i].answers.tool;
  const hit = a.choice === c.want;
  ok += +hit;
  if (!hit) mixups.set(`${c.want} → ${a.choice}`, (mixups.get(`${c.want} → ${a.choice}`) ?? 0) + 1);
  const ctx = c.before ? `  [after: "${c.before.slice(0, 30)}…"]` : "";
  console.log(`${hit ? " " : "✗"} ${(c.said + ctx).slice(0, 78).padEnd(78)} ${a.choice} ${a.confidence.toFixed(2)}${hit ? "" : `  (want ${c.want})`}`);
}
console.log(`\n${ok}/${CASES.length} right (${Math.round((100 * ok) / CASES.length)}%)   ${Math.round(ms)} ms for the batch, ${Math.round(ms / CASES.length)} ms/message incl. network`);
if (mixups.size) console.log("Mix-ups:", Object.fromEntries(mixups));
