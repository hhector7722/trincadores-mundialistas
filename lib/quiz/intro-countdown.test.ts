import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { introCountdownFromRemaining } from "./intro-countdown";

describe("introCountdownFromRemaining", () => {
  it("muestra espera antes de los últimos 3 segundos", () => {
    const view = introCountdownFromRemaining(8);
    assert.equal(view.emphasis, false);
    assert.match(view.main, /momento/i);
  });

  it("cuenta 3, 2, 1 en el tramo final", () => {
    assert.equal(introCountdownFromRemaining(2.9).main, "3");
    assert.equal(introCountdownFromRemaining(1.8).main, "2");
    assert.equal(introCountdownFromRemaining(0.6).main, "1");
  });
});
