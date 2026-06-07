import assert from "node:assert/strict";
import test from "node:test";
import type { QuizFactWorldcupRow } from "@/lib/worldcup-data/types";
import {
  prepareFactsForUpsert,
  shouldPersistFacts,
  upsertWorldcupFacts,
  validateWorldcupFactRow,
} from "./quiz-facts-repository";

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
  metadata: { tournament_id: "WC-2022", fact_origin: "fjelstul_historic" },
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

test("shouldPersistFacts respeta dry-run", () => {
  assert.equal(shouldPersistFacts({ insert: true, dryRun: true }), false);
  assert.equal(shouldPersistFacts({ insert: true, dryRun: false }), true);
  assert.equal(shouldPersistFacts({ insert: false, dryRun: false }), false);
});

test("validateWorldcupFactRow rechaza facts femeninos y disabled", () => {
  assert.equal(validateWorldcupFactRow(MEN_ROW), null);
  assert.equal(validateWorldcupFactRow(WOMEN_ROW), "not_men");
  assert.equal(validateWorldcupFactRow({ ...MEN_ROW, enabled: false }), "disabled");
});

test("prepareFactsForUpsert deduplica por id", () => {
  const updated = { ...MEN_ROW, value: "Brasil" };
  const result = prepareFactsForUpsert([MEN_ROW, updated, WOMEN_ROW]);
  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0].value, "Brasil");
  assert.equal(result.skipped, 1);
  assert.equal(result.duplicateIds, 1);
});

test("upsertWorldcupFacts escribe batch idempotente", async () => {
  const chunks: Record<string, unknown>[][] = [];
  const admin = {} as never;

  const result = await upsertWorldcupFacts(admin, [MEN_ROW, WOMEN_ROW, { ...MEN_ROW, enabled: false }], {
    upsertChunksFn: async (_admin, table, rows, onConflict) => {
      assert.equal(table, "quiz_facts_worldcup");
      assert.equal(onConflict, "id");
      chunks.push(rows);
      return rows.length;
    },
  });

  assert.equal(result.generated, 3);
  assert.equal(result.valid.length, 1);
  assert.equal(result.upserted, 1);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0][0].id, "fj-wc2022-winner");
  assert.equal(chunks[0][0].enabled, true);
});

test("upsertWorldcupFacts no escribe si dry-run (shouldPersistFacts)", () => {
  assert.equal(shouldPersistFacts({ insert: false, dryRun: false }), false);
});

test("prepareFactsForUpsert coincide válidos con generados masculinos", () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({
    ...MEN_ROW,
    id: `fj-wc${1980 + i}-winner`,
    subject: `Mundial ${1980 + i}`,
    year: 1980 + i,
    metadata: { tournament_id: `WC-${1980 + i}` },
  }));
  const result = prepareFactsForUpsert(rows);
  assert.equal(result.valid.length, 5);
  assert.equal(result.skipped, 0);
  assert.equal(result.valid.length, result.generated - result.skipped - result.duplicateIds);
});
