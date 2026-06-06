import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDistractorLabels,
  buildMcqOptions,
  getOptionSemanticType,
} from "./distractors";
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
    image_url: null,
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
    image_url: null,
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
    image_url: null,
  },
  {
    id: "h",
    category: "history",
    fact_type: "first_winner",
    subject: "Mundial 1982",
    value: "Italia",
    year: 1982,
    source_url: "https://example.com/h",
    source_label: "H",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
  {
    id: "i",
    category: "hosts",
    fact_type: "host_country",
    subject: "Mundial 2014",
    value: "Brasil",
    year: 2014,
    source_url: "https://example.com/i",
    source_label: "I",
    difficulty: "easy",
    tags: [],
    image_url: null,
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
    image_url: null,
  },
  {
    id: "e",
    category: "players",
    fact_type: "curiosity",
    subject: "Jugador",
    value: "Roger Milla",
    year: 1994,
    source_url: "https://example.com/e",
    source_label: "E",
    difficulty: "hard",
    tags: [],
    image_url: null,
  },
  {
    id: "f",
    category: "players",
    fact_type: "top_scorer",
    subject: "Goleador",
    value: "Miroslav Klose",
    year: null,
    source_url: "https://example.com/f",
    source_label: "F",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
  {
    id: "g",
    category: "players",
    fact_type: "curiosity",
    subject: "Capitan",
    value: "Lionel Messi",
    year: 2022,
    source_url: "https://example.com/g",
    source_label: "G",
    difficulty: "medium",
    tags: [],
    image_url: null,
  },
  {
    id: "h2",
    category: "players",
    fact_type: "curiosity",
    subject: "Capitan Brasil",
    value: "Cafu",
    year: 2002,
    source_url: "https://example.com/h2",
    source_label: "H2",
    difficulty: "hard",
    tags: [],
    image_url: null,
  },
];

test("buildDistractorLabels returns 3 unique labels", () => {
  const rng = mulberry32(42);
  const labels = buildDistractorLabels(sampleFacts[0], "Uruguay", sampleFacts, rng, 3);
  assert.equal(labels.length, 3);
  assert.ok(!labels.some((l) => l.toLowerCase() === "uruguay"));
});

test("buildDistractorLabels keeps player semantic type", () => {
  const rng = mulberry32(99);
  const labels = buildDistractorLabels(sampleFacts[4], "Roger Milla", sampleFacts, rng, 3);
  assert.equal(labels.length, 3);
  for (const label of labels) {
    assert.ok(!label.toLowerCase().startsWith("mundial "));
    assert.ok(!label.includes("segundos"));
  }
});

test("getOptionSemanticType maps player curiosity", () => {
  const roger = sampleFacts.find((f) => f.id === "e");
  assert.equal(getOptionSemanticType(roger!), "player");
});

test("buildMcqOptions shuffles correct answer", () => {
  const rng = mulberry32(7);
  const result = buildMcqOptions("Uruguay", ["Inglaterra", "Sudáfrica", "5 títulos"], rng);
  assert.equal(result.options.length, 4);
  const correct = result.options.find((o) => o.id === result.correct_option_id);
  assert.equal(correct?.label, "Uruguay");
});
