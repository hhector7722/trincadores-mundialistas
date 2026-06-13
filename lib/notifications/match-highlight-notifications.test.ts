import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMatchHighlightNotificationCopy } from "./match-highlight-notifications";

describe("match highlight notifications", () => {
  it("buildMatchHighlightNotificationCopy pone el partido en el título y deja el cuerpo vacío", () => {
    const copy = buildMatchHighlightNotificationCopy("Canada", "Bosnia & Herzegovina", 1, 1);

    assert.equal(copy.body, "");
    assert.match(copy.title, /^Resumen /);
    assert.match(copy.title, /🇨🇦/);
    assert.match(copy.title, /CAN/);
    assert.match(copy.title, /1 - 1/);
    assert.match(copy.title, /BIH/);
    assert.match(copy.title, /🇧🇦/);
  });

  it("buildMatchHighlightNotificationCopy omite marcador si falta resultado", () => {
    const copy = buildMatchHighlightNotificationCopy("Spain", "Brazil", null, null);

    assert.equal(copy.body, "");
    assert.match(copy.title, /Resumen 🇪🇸 ESP - BRA 🇧🇷/);
    assert.doesNotMatch(copy.title, /\d - \d/);
  });
});
