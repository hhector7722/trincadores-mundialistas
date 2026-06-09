import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAvatarBadgeObjectPosition, getPresetAvatarUrl } from "./presets";

describe("avatar presets", () => {
  it("resuelve ruta por alias normalizado", () => {
    assert.equal(getPresetAvatarUrl("Hector"), "/icons/avatar/hector.png");
    assert.equal(getPresetAvatarUrl("Solskjær"), "/icons/avatar/solskjaer.png");
    assert.equal(getPresetAvatarUrl("Solskaer"), "/icons/avatar/solskjaer.png");
  });

  it("ajusta object-position del badge por alias o ruta preset", () => {
    assert.equal(getAvatarBadgeObjectPosition("nacho"), "center 40%");
    assert.equal(getAvatarBadgeObjectPosition("/icons/avatar/solskjaer.png"), "center 58%");
    assert.equal(getAvatarBadgeObjectPosition("hector"), "center 22%");
    assert.equal(getAvatarBadgeObjectPosition(null), "center 22%");
  });
});
