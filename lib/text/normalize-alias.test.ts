import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeAlias, normalizeText } from "./normalize-alias";

describe("normalizeText", () => {
  it("ignora mayusculas y espacios", () => {
    assert.equal(normalizeText("  DAMO  "), "damo");
    assert.equal(normalizeText("Gabri"), "gabri");
  });

  it("quita acentos", () => {
    assert.equal(normalizeText("Héctor"), "hector");
  });
});

describe("normalizeAlias", () => {
  it("trata Solskjær, Solskjaer y Solskaer como equivalentes", () => {
    const variants = [
      "Solskjær",
      "Solskjaer",
      "Solskaer",
      "SOLSKJÆR",
      "solskjaer",
      "solskaer",
      "  SolskJÆR  ",
    ];
    for (const variant of variants) {
      assert.equal(normalizeAlias(variant), "solskjaer", variant);
    }
  });

  it("normaliza alias con acentos y mayusculas", () => {
    assert.equal(normalizeAlias("Héctor"), "hector");
    assert.equal(normalizeAlias("DAMO"), "damo");
    assert.equal(normalizeAlias("gabri"), "gabri");
  });
});
