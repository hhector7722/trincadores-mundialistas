import assert from "node:assert/strict";
import test from "node:test";
import { findMvpOptionBySaved, mvpSelectionKey } from "./mvp-selection-key";

test("mvpSelectionKey prioriza dorsal sobre nombre", () => {
  const byShirt = mvpSelectionKey("Spain", { name: "Rodri", shirtNumber: 16 });
  const byAlias = mvpSelectionKey("Spain", { name: "Rodri Hernández", shirtNumber: 16 });
  assert.equal(byShirt, byAlias);
  assert.equal(byShirt, "Spain::16");
});

test("findMvpOptionBySaved tolera alias de nombre", () => {
  const options = [
    {
      key: "Spain::10",
      name: "Pedri",
      teamName: "Spain",
      shirtNumber: 10,
    },
  ];

  const match = findMvpOptionBySaved(options, "Pedri González", "Spain");
  assert.equal(match?.key, "Spain::10");
});
