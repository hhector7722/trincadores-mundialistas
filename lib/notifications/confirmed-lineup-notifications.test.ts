import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildConfirmedLineupNotificationCopy } from "./confirmed-lineup-notifications";

describe("confirmed lineup notifications", () => {
  it("buildConfirmedLineupNotificationCopy describe el partido", () => {
    const copy = buildConfirmedLineupNotificationCopy("España", "Brasil");
    assert.equal(copy.title, "Alineaciones oficiales");
    assert.match(copy.body, /España vs Brasil/);
    assert.match(copy.body, /confirmadas/);
  });
});
