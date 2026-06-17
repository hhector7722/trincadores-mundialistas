import assert from "node:assert/strict";
import test from "node:test";
import { composeDrillSessionPicks, type DrillHistoricalQuiz } from "./compose-drill-session";

function quiz(
  id: string,
  quizDate: string,
  playFormats: unknown,
  questionIds: string[]
): DrillHistoricalQuiz {
  return {
    id,
    quizDate,
    settingsJson: playFormats ? { play_formats: playFormats } : {},
    questions: questionIds.map((qid, index) => ({
      id: qid,
      sort_order: index + 1,
    })),
  };
}

test("composeDrillSessionPicks mezcla max 1 silueta e imagen", () => {
  const historical: DrillHistoricalQuiz[] = [
    quiz("q-old-1", "2026-06-06", null, ["c1", "c2", "c3"]),
    quiz("q-old-2", "2026-06-14", [
      { sort_order: 1, format: "classic" },
      { sort_order: 2, format: "image_trivia" },
      { sort_order: 3, format: "guess_player_silhouette" },
    ], ["n1", "i1", "s1"]),
    quiz("q-old-3", "2026-06-15", [
      { sort_order: 1, format: "classic" },
      { sort_order: 2, format: "image_trivia" },
      { sort_order: 3, format: "guess_player_silhouette" },
    ], ["n2", "i2", "s2"]),
  ];

  let call = 0;
  const picks = composeDrillSessionPicks({
    todayQuizId: "q-today",
    todayQuizDate: "2026-06-17",
    historicalQuizzes: historical,
    rng: () => {
      call += 1;
      return call % 10 === 0 ? 0.99 : 0;
    },
  });

  assert.equal(picks.length, 3);
  assert.equal(picks.filter((p) => p.format === "guess_player_silhouette").length, 1);
  assert.equal(picks.filter((p) => p.format === "image_trivia").length, 1);
  assert.deepEqual(
    picks.map((p) => p.displaySortOrder),
    [1, 2, 3]
  );
});

test("composeDrillSessionPicks solo clasicas si no hay formatos lab", () => {
  const historical: DrillHistoricalQuiz[] = [
    quiz("q1", "2026-06-06", null, ["a1", "a2", "a3"]),
    quiz("q2", "2026-06-07", null, ["b1", "b2", "b3"]),
    quiz("q3", "2026-06-08", null, ["c1", "c2", "c3"]),
  ];

  const picks = composeDrillSessionPicks({
    todayQuizId: "q-today",
    todayQuizDate: "2026-06-17",
    historicalQuizzes: historical,
    rng: () => 0,
  });

  assert.equal(picks.length, 3);
  assert.ok(picks.every((p) => p.format === "classic"));
});

test("composeDrillSessionPicks excluye quiz de hoy", () => {
  assert.throws(
    () =>
      composeDrillSessionPicks({
        todayQuizId: "only",
        todayQuizDate: "2026-06-17",
        historicalQuizzes: [quiz("only", "2026-06-17", null, ["x1"])],
        rng: () => 0,
      }),
    /No hay quizzes historicos/
  );
});
