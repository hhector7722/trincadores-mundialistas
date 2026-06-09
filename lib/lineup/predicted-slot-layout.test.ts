import assert from "node:assert/strict";
import test from "node:test";
import { dedupeBenchAgainstStarters } from "./bench-dedupe";
import { getFormationTemplateCoordinates } from "./formation-templates";
import { layoutPredictedStarters } from "./predicted-slot-layout";

test("layoutPredictedStarters usa plantilla fija en 4-2-3-1", () => {
  const starters = [
    { slotKey: "GK", role: "GK" as const },
    { slotKey: "LB", role: "DF" as const },
    { slotKey: "CB", role: "DF" as const },
    { slotKey: "CB", role: "DF" as const },
    { slotKey: "RB", role: "DF" as const },
    { slotKey: "DM", role: "MF" as const },
    { slotKey: "DM", role: "MF" as const },
    { slotKey: "LW", role: "MF" as const },
    { slotKey: "AM", role: "MF" as const },
    { slotKey: "RW", role: "MF" as const },
    { slotKey: "ST", role: "FW" as const },
  ];

  const positioned = layoutPredictedStarters(starters, "4-2-3-1");
  const template = getFormationTemplateCoordinates("4-2-3-1");

  assert.deepEqual(
    positioned.map((slot) => ({ x: slot.x, y: slot.y })),
    template
  );
});

test("dedupeBenchAgainstStarters elimina titulares y duplicados por dorsal", () => {
  const bench = dedupeBenchAgainstStarters(
    [
      { key: "pedri-20", name: "Pedri", shirtNumber: 20, position: "MF" },
      { key: "merino-6", name: "Merino", shirtNumber: 6, position: "MF" },
      { key: "merino-6-dup", name: "Merino", shirtNumber: 6, position: "MF" },
      { key: "zubi-18", name: "Zubimendi", shirtNumber: 18, position: "MF" },
    ],
    [
      {
        key: "pedri-20",
        name: "Pedri",
        shirtNumber: 20,
        positionLabel: "MED",
        role: "MF",
        isPlaceholder: false,
        x: 50,
        y: 50,
      },
    ]
  );

  assert.deepEqual(bench.map((player) => player.name), ["Merino", "Zubimendi"]);
});
