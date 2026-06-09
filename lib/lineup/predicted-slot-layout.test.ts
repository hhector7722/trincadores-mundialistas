import assert from "node:assert/strict";
import test from "node:test";
import { dedupeBenchAgainstStarters } from "./bench-dedupe";
import { layoutPredictedStarters } from "./predicted-slot-layout";

test("layoutPredictedStarters coloca portería abajo y delantero arriba", () => {
  const positioned = layoutPredictedStarters(
    [
      { slotKey: "GK", role: "GK" },
      { slotKey: "ST", role: "FW" },
    ],
    "4-2-3-1"
  );

  const gk = positioned.find((slot) => slot.slotKey === "GK");
  const st = positioned.find((slot) => slot.slotKey === "ST");
  assert.ok(gk && st);
  assert.ok(gk.y > st.y);
});

test("layoutPredictedStarters usa carril táctico en 4-2-3-1", () => {
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
  const st = positioned.find((slot) => slot.slotKey === "ST");
  const rw = positioned.find((slot) => slot.slotKey === "RW");
  const dm = positioned.filter((slot) => slot.slotKey === "DM");

  assert.ok(st && rw);
  assert.equal(st.x, 50);
  assert.equal(rw.x, 80);
  assert.equal(dm[0]!.x, 36);
  assert.equal(dm[1]!.x, 64);
  assert.ok(st.y < rw.y);
});

test("layoutPredictedStarters separa líneas en 4-2-3-1 por slot, no por índice", () => {
  const starters = [
    { slotKey: "ST", role: "FW" as const },
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
  ];

  const positioned = layoutPredictedStarters(starters, "4-2-3-1");
  const gk = positioned.find((slot) => slot.slotKey === "GK");
  const st = positioned.find((slot) => slot.slotKey === "ST");
  const dm = positioned.filter((slot) => slot.slotKey === "DM");

  assert.ok(gk && st);
  assert.equal(dm.length, 2);
  assert.ok(gk.y > dm[0]!.y);
  assert.ok(dm[0]!.y > st.y);
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
