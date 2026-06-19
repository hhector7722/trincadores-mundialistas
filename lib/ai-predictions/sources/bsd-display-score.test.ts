import assert from "node:assert/strict";
import test from "node:test";
import { resolveBsdDisplayScore } from "@/lib/ai-predictions/sources/bsd-display-score";

test("México favorito 56% no muestra 0-1 visitante", () => {
  assert.equal(
    resolveBsdDisplayScore({
      predicted: "H",
      probHome: 56,
      probDraw: 23,
      probAway: 22,
      mostLikely: "0-1",
      xgHome: 0.73,
      xgAway: 1.2,
    }),
    "2-1",
  );
});

test("conserva most_likely si coincide con favorito", () => {
  assert.equal(
    resolveBsdDisplayScore({
      predicted: "A",
      probHome: 20,
      probDraw: 25,
      probAway: 55,
      mostLikely: "0-2",
      xgHome: 0.8,
      xgAway: 1.9,
    }),
    "0-2",
  );
});

test("empate favorito genera marcador igualado", () => {
  assert.equal(
    resolveBsdDisplayScore({
      predicted: "D",
      probHome: 30,
      probDraw: 40,
      probAway: 30,
      mostLikely: "1-0",
      xgHome: 1.1,
      xgAway: 1.0,
    }),
    "1-1",
  );
});
