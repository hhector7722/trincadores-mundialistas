import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPresetAvatarUrl } from "./presets";

describe("avatar presets", () => {
  it("resuelve ruta por alias normalizado", () => {
    assert.equal(getPresetAvatarUrl("Hector"), "/icons/avatar/hector.png");
  });
});
