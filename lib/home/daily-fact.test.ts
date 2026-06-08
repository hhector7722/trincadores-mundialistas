import assert from "node:assert/strict";
import test from "node:test";
import {
  parseDailyFactsFile,
  pickDailyFactForDate,
  todayDateKey,
} from "./daily-fact";

const FIXTURE: unknown = [
  { id: "a", text: "Curiosidad A." },
  { id: "b", text: "Curiosidad B." },
  { id: "c", text: "Curiosidad C." },
];

test("parseDailyFactsFile valida ids y textos", () => {
  const facts = parseDailyFactsFile(FIXTURE);
  assert.equal(facts.length, 3);
  assert.equal(facts[0].id, "a");
});

test("pickDailyFactForDate es determinista por fecha", () => {
  const facts = parseDailyFactsFile(FIXTURE);
  const first = pickDailyFactForDate("2026-06-08", facts);
  const second = pickDailyFactForDate("2026-06-08", facts);
  assert.ok(first);
  assert.deepEqual(first, second);
});

test("pickDailyFactForDate reparte distintos datos a lo largo del calendario", () => {
  const facts = parseDailyFactsFile(FIXTURE);
  const seen = new Set(
    Array.from({ length: 30 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return pickDailyFactForDate(`2026-06-${day}`, facts)?.id;
    }).filter(Boolean)
  );
  assert.ok(seen.size > 1);
});

test("todayDateKey usa formato YYYY-MM-DD", () => {
  const key = todayDateKey(new Date("2026-06-08T12:00:00Z"));
  assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
});
