import assert from "node:assert/strict";
import test from "node:test";
import type { QuizFact } from "./facts";
import { generateQuestionFromFact } from "./generate-question";
import { validateGeneratedQuestion } from "./quality";

const facts: QuizFact[] = [
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
    tags: [],
    image_url: null,
  },
  {
    id: "wc1966-winner",
    category: "history",
    fact_type: "first_winner",
    subject: "Mundial 1966",
    value: "Inglaterra",
    year: 1966,
    source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/1966england",
    source_label: "FIFA",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
  {
    id: "wc2010-host",
    category: "hosts",
    fact_type: "host_country",
    subject: "Mundial 2010",
    value: "Sudáfrica",
    year: 2010,
    source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/2010southafrica",
    source_label: "FIFA",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
  {
    id: "wc1982-winner",
    category: "history",
    fact_type: "first_winner",
    subject: "Mundial 1982",
    value: "Italia",
    year: 1982,
    source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/1982spain",
    source_label: "FIFA",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
  {
    id: "wc2014-host",
    category: "hosts",
    fact_type: "host_country",
    subject: "Mundial 2014",
    value: "Brasil",
    year: 2014,
    source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/2014brazil",
    source_label: "FIFA",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
  {
    id: "brazil-titles",
    category: "teams",
    fact_type: "titles_count",
    subject: "Brasil",
    value: "5",
    year: null,
    source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/articles/brazil-five-time-winners",
    source_label: "FIFA",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
];

test("generateQuestionFromFact includes source metadata", () => {
  const q = generateQuestionFromFact({
    fact: facts[0],
    allFacts: facts,
    sortOrder: 1,
    seed: 12345,
  });
  assert.ok(q.prompt.includes("1930"));
  assert.equal(q.fact_id, "wc1930-winner");
  assert.ok(q.source_url.startsWith("https://"));
  assert.equal(validateGeneratedQuestion(q).ok, true);
});
