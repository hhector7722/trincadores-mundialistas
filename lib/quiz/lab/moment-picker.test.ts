import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePlayerKey,
  pickSilhouetteSourceMoment,
} from "@/lib/quiz/lab/moment-picker";

test("normalizePlayerKey ignora acentos", () => {
  assert.equal(normalizePlayerKey("Héctor"), "hector");
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
