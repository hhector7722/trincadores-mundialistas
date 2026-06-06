import assert from "node:assert/strict";
import test from "node:test";
import { buildDistractorLabels, buildMcqOptions } from "./distractors";
import type { QuizFact } from "./facts";
import { mulberry32 } from "./rng";

const sampleFacts: QuizFact[] = [
  {
    id: "a",
    category: "history",
    fact_type: "first_winner",
    subject: "Mundial 1930",
    value: "Uruguay",
    year: 1930,
    source_url: "https://example.com/a",
    source_label: "A",
    difficulty: "easy",
    tags: [],
  },
  {
    id: "b",
    category: "history",
    fact_type: "first_winner",
    subject: "Mundial 1966",
    value: "Inglaterra",
    year: 1966,
    source_url: "https://example.com/b",
    source_label: "B",
    difficulty: "easy",
    tags: [],
  },
  {
    id: "c",
    category: "hosts",
    fact_type: "host_country",
    subject: "Mundial 2010",
    value: "Sudáfrica",
    year: 2010,
    source_url: "https://example.com/c",
    source_label: "C",
    difficulty: "easy",
    tags: [],
  },
  {
    id: "d",
    category: "teams",
    fact_type: "titles_count",
    subject: "Brasil",
    value: "5",
    year: null,
    source_url: "https://example.com/d",
    source_label: "D",
    difficulty: "easy",
    tags: [],
  },
];

test("buildDistractorLabels returns 3 unique labels", () => {
  const rng = mulberry32(42);
  const labels = buildDistractorLabels(sampleFacts[0], "Uruguay", sampleFacts, rng, 3);
  assert.equal(labels.length, 3);
  assert.ok(!labels.some((l) => l.toLowerCase() === "uruguay"));
});

test("buildMcqOptions shuffles correct answer", () => {
  const rng = mulberry32(7);
  const result = buildMcqOptions("Uruguay", ["Inglaterra", "Sudáfrica", "5"], rng);
  assert.equal(result.options.length, 4);
  const correct = result.options.find((o) => o.id === result.correct_option_id);
  assert.equal(correct?.label, "Uruguay");
});
