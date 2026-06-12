import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMatchHighlightNotificationCopy } from "./match-highlight-notifications";

describe("match highlight notifications", () => {
  it("buildMatchHighlightNotificationCopy incluye banderas, abreviaturas y marcador", () => {
    const copy = buildMatchHighlightNotificationCopy("Canada", "Bosnia & Herzegovina", 1, 1);

    assert.equal(copy.title, "Resumen disponible");
    assert.match(copy.body, /Ya está disponible el resumen del/);
    assert.match(copy.body, /🇨🇦/);
    assert.match(copy.body, /CAN/);
    assert.match(copy.body, /1 - 1/);
    assert.match(copy.body, /BIH/);
    assert.match(copy.body, /🇧🇦/);
  });

  it("buildMatchHighlightNotificationCopy omite marcador si falta resultado", () => {
    const copy = buildMatchHighlightNotificationCopy("Spain", "Brazil", null, null);

    assert.match(copy.body, /🇪🇸 ESP - BRA 🇧🇷/);
    assert.doesNotMatch(copy.body, /\d - \d/);
  });
});
