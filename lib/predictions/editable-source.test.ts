import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname ?? __dirname);

describe("1c.1 editable source of truth", () => {
  it("queries no usa isMatchLikelyEditable", () => {
    const src = readFileSync(join(root, "queries.ts"), "utf8");
    assert.equal(src.includes("isMatchLikelyEditable"), false);
    assert.equal(src.includes("fetchEditableByMatchIds"), true);
    assert.equal(src.includes("fetchMatchEditableFromDb"), true);
  });

  it("edit-state no exporta isMatchLikelyEditable", () => {
    const src = readFileSync(join(root, "edit-state.ts"), "utf8");
    assert.equal(src.includes("isMatchLikelyEditable"), false);
  });

  it("detalle usa key de remount en page", () => {
    const src = readFileSync(
      join(root, "..", "..", "app", "(app)", "predictions", "[matchId]", "page.tsx"),
      "utf8"
    );
    assert.equal(src.includes("key={formKey}"), true);
    assert.equal(src.includes("updated_at"), true);
  });

  it("savePrediction devuelve valores persistidos", () => {
    const src = readFileSync(join(root, "..", "..", "actions", "predictions.ts"), "utf8");
    assert.equal(src.includes("updatedAt: saved.updated_at"), true);
    assert.equal(src.includes("home: saved.home_goals"), true);
  });
});