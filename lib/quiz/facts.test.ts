import assert from "node:assert/strict";
import test from "node:test";
import { parseFactsFile } from "./facts";

test("parseFactsFile validates required fields", () => {
  const facts = parseFactsFile([
    {
      id: "wc1930-winner",
      category: "history",
      fact_type: "first_winner",
      subject: "Mundial 1930",
      value: "Uruguay",
      year: 1930,
      source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/1930uruguay",
      source_label: "FIFA",
      difficulty: "easy",
      tags: ["1930"],
    },
  ]);
  assert.equal(facts.length, 1);
  assert.equal(facts[0].id, "wc1930-winner");
});

test("parseFactsFile rejects missing source", () => {
  assert.throws(() =>
    parseFactsFile([
      {
        id: "bad",
        category: "history",
        fact_type: "first_winner",
        subject: "X",
        value: "Y",
        year: 1930,
        source_url: "",
        source_label: "FIFA",
        difficulty: "easy",
        tags: [],
      },
    ])
  );
});
