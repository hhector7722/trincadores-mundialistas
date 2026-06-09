import assert from "node:assert/strict";
import test from "node:test";
import { apiFootballGridToCoordinate } from "./api-football-grid";

test("apiFootballGridToCoordinate coloca portero abajo", () => {
  const gk = apiFootballGridToCoordinate("1:1");
  assert.ok(gk.y > 80);
});

test("apiFootballGridToCoordinate coloca delanteros arriba", () => {
  const st = apiFootballGridToCoordinate("4:3");
  assert.ok(st.y < 40);
});

test("apiFootballGridToCoordinate devuelve centro con grid inválido", () => {
  assert.deepEqual(apiFootballGridToCoordinate(null), { x: 50, y: 50 });
  assert.deepEqual(apiFootballGridToCoordinate("bad"), { x: 50, y: 50 });
});
