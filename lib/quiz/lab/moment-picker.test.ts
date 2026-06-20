import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePlayerKey,
  pickImageTriviaMoment,
  pickSilhouetteSourceMoment,
} from "@/lib/quiz/lab/moment-picker";

test("normalizePlayerKey ignora acentos", () => {
  assert.equal(normalizePlayerKey("Héctor"), "hector");
});

test("pickImageTriviaMoment excluye preguntas de rival (camisetas visibles)", () => {
  for (let seed = 0; seed < 200; seed++) {
    const moment = pickImageTriviaMoment({ seed, minDifficulty: "easy" });
    assert.ok(moment);
    assert.notEqual(moment.quiz.answer_type, "opponent");
    assert.notEqual(moment.quiz.prompt, "¿Contra qué selección fue este partido?");
  }
});

test("pickSilhouetteSourceMoment excluye jugadores ya usados en otra pregunta", () => {
  const moment = pickSilhouetteSourceMoment({
    seed: 42,
    excludePlayerKeys: [normalizePlayerKey("Hristo Stoichkov")],
  });

  assert.ok(moment);
  assert.ok(
    !moment.players.some(
      (player) => normalizePlayerKey(player) === normalizePlayerKey("Hristo Stoichkov")
    )
  );
});
