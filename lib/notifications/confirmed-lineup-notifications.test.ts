import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildConfirmedLineupNotificationCopy } from "./confirmed-lineup-notifications";

describe("confirmed lineup notifications", () => {
  it("buildConfirmedLineupNotificationCopy usa banderas, abreviaturas y titulo confirmado", () => {
    const copy = buildConfirmedLineupNotificationCopy("Spain", "Brazil");
    assert.equal(copy.title, "Alineaciones confirmadas ✅");
    assert.match(copy.body, /🇪🇸 ESP - BRA 🇧🇷/);
  });
});
