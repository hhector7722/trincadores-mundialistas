import assert from "node:assert/strict";
import test from "node:test";
import type { QuizFact } from "./facts";
import { generateQuizDayFromSources } from "./generate-day";
import type { QuizFactWorldcupRow } from "@/lib/worldcup-data/types";
import {
  isMenQuizFact,
  loadQuizFactsWithFallback,
  mapWorldcupRowToQuizFact,
  parseWorldcupFactsRows,
} from "./worldcup-facts-source";

const MEN_ROW: QuizFactWorldcupRow = {
  id: "fj-wc2022-winner",
  category: "history",
  fact_type: "first_winner",
  subject: "Mundial 2022",
  value: "Argentina",
  year: 2022,
  difficulty: "easy",
  option_semantic_type: "country",
  distractor_pool: ["Brasil", "Francia"],
  metadata: { tournament_id: "WC-2022" },
  source_url: "https://github.com/jfjelstul/worldcup",
  source_label: "Fjelstul",
  enabled: true,
};

const WOMEN_ROW: QuizFactWorldcupRow = {
  ...MEN_ROW,
  id: "fj-wc2019-winner",
  subject: "Mundial 2019",
  value: "United States",
  year: 2019,
  metadata: { tournament_id: "WC-2019", tournament_name: "2019 FIFA Women's World Cup" },
};

const JSON_FIXTURE: QuizFact[] = [
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
    id: "wc1998-winner",
    category: "history",
    fact_type: "first_winner",
    subject: "Mundial 1998",
    value: "Francia",
    year: 1998,
    source_url: "https://www.fifa.com/en/tournaments/mens/worldcup/1998france",
    source_label: "FIFA",
    difficulty: "easy",
    tags: [],
    image_url: null,
  },
];

function dbPoolFrom(rows: QuizFactWorldcupRow[]): QuizFact[] {
  return parseWorldcupFactsRows(rows);
}

test("isMenQuizFact excluye torneos femeninos", () => {
  assert.equal(isMenQuizFact(MEN_ROW), true);
  assert.equal(isMenQuizFact(WOMEN_ROW), false);
  assert.equal(isMenQuizFact({ year: 2019, subject: "Mundial 2019" }), false);
});

test("parseWorldcupFactsRows ignora enabled=false y facts femeninos", () => {
  const disabled: QuizFactWorldcupRow = { ...MEN_ROW, id: "fj-disabled", enabled: false };
  const facts = parseWorldcupFactsRows([MEN_ROW, WOMEN_ROW, disabled]);
  assert.equal(facts.length, 1);
  assert.equal(facts[0].id, "fj-wc2022-winner");
});

test("mapWorldcupRowToQuizFact tolera metadata incompleta", () => {
  const bare: QuizFactWorldcupRow = {
    ...MEN_ROW,
    id: "fj-titles-brazil",
    fact_type: "titles_count",
    subject: "Brasil",
    value: "5",
    year: null,
    metadata: { team: "Brazil" },
  };
  const fact = mapWorldcupRowToQuizFact(bare);
  assert.ok(fact);
  assert.equal(fact?.year, null);
  assert.equal(fact?.value, "5");
});

test("loadQuizFactsWithFallback usa DB cuando hay pool suficiente", async () => {
  const dbRows = Array.from({ length: 6 }, (_, i) => ({
    ...MEN_ROW,
    id: `fj-men-${i}`,
    subject: `Mundial ${1980 + i}`,
    year: 1980 + i,
    metadata: { tournament_id: `WC-${1980 + i}` },
  }));

  const result = await loadQuizFactsWithFallback({
    fetchDb: async () => dbPoolFrom(dbRows),
    loadJson: () => JSON_FIXTURE,
    log: () => {},
  });

  assert.equal(result.source, "quiz_facts_worldcup");
  assert.equal(result.facts.length, 6);
});

test("loadQuizFactsWithFallback cae al JSON si DB falla", async () => {
  const logs: string[] = [];
  const result = await loadQuizFactsWithFallback({
    fetchDb: async () => {
      throw new Error("tabla ausente");
    },
    loadJson: () => JSON_FIXTURE,
    log: (m) => logs.push(m),
  });

  assert.equal(result.source, "world-cup-facts.json");
  assert.equal(result.facts.length, JSON_FIXTURE.length);
  assert.ok(logs.some((l) => l.includes("no disponible")));
});

test("loadQuizFactsWithFallback mezcla hybrid con pool DB pequeño", async () => {
  const smallDb = dbPoolFrom([
    MEN_ROW,
    { ...MEN_ROW, id: "fj-wc2018-winner", year: 2018, subject: "Mundial 2018", value: "Francia", metadata: { tournament_id: "WC-2018" } },
    { ...MEN_ROW, id: "fj-wc2014-winner", year: 2014, subject: "Mundial 2014", value: "Alemania", metadata: { tournament_id: "WC-2014" } },
    { ...MEN_ROW, id: "fj-wc2010-host", fact_type: "host_country", year: 2010, subject: "Mundial 2010", value: "Sudáfrica", metadata: { tournament_id: "WC-2010" } },
  ]);

  const result = await loadQuizFactsWithFallback({
    fetchDb: async () => smallDb,
    loadJson: () => JSON_FIXTURE,
    minPool: 6,
    log: () => {},
  });

  assert.equal(result.source, "hybrid");
  assert.ok(result.facts.length >= 6);
  assert.ok(result.facts.some((f) => f.id === "fj-wc2022-winner"));
  assert.ok(result.facts.some((f) => f.id === "wc1930-winner"));
});

test("generateQuizDayFromSources produce sesión válida con facts de DB", async () => {
  const winners = [
    ["1930", "Uruguay"],
    ["1966", "Inglaterra"],
    ["1982", "Italia"],
    ["1998", "Francia"],
    ["2002", "Brasil"],
  ] as const;
  const hosts = [
    ["2010", "Sudáfrica"],
    ["2014", "Brasil"],
    ["2018", "Rusia"],
  ] as const;

  const dbRows: QuizFactWorldcupRow[] = [
    ...winners.map(([year, value]) => ({
      ...MEN_ROW,
      id: `fj-wc${year}-winner`,
      fact_type: "first_winner" as const,
      category: "history" as const,
      subject: `Mundial ${year}`,
      value,
      year: Number(year),
      metadata: { tournament_id: `WC-${year}` },
    })),
    ...hosts.map(([year, value]) => ({
      ...MEN_ROW,
      id: `fj-wc${year}-host`,
      fact_type: "host_country" as const,
      category: "hosts" as const,
      subject: `Mundial ${year}`,
      value,
      year: Number(year),
      metadata: { tournament_id: `WC-${year}` },
    })),
  ];

  const day = await generateQuizDayFromSources({
    quizDate: "2026-06-10",
    factsDeps: {
      fetchDb: async () => dbPoolFrom(dbRows),
      loadJson: () => JSON_FIXTURE,
      log: () => {},
    },
  });

  assert.equal(day.official.questions.length, 3);
  assert.equal(day._meta?.facts_source, "quiz_facts_worldcup");
  assert.ok(!day._meta?.fact_ids.some((id) => id.includes("2019")));
});
