import assert from "node:assert/strict";
import test from "node:test";
import { separateOverlappingSlots, SINGLE_TEAM_BOUNDS } from "./field-layout";
import {
  mapSlotsToAwayHalf,
  mapSlotsToHomeHalf,
  MVP_AWAY_BOUNDS,
  MVP_HOME_BOUNDS,
} from "./match-field-geometry";

test("mapSlotsToAwayHalf coloca portero arriba del campo MVP", () => {
  const mapped = mapSlotsToAwayHalf([
    {
      key: "gk",
      name: "GK",
      shirtNumber: 1,
      positionLabel: "POR",
      role: "GK",
      isPlaceholder: false,
      x: 50,
      y: 78,
    },
  ]);

  assert.equal(mapped[0]!.y, 8);
});

test("separateOverlappingSlots MVP no saca al portero del arco visitante", () => {
  const away = mapSlotsToAwayHalf([
    {
      key: "gk",
      name: "GK",
      shirtNumber: 1,
      positionLabel: "POR",
      role: "GK",
      isPlaceholder: false,
      x: 50,
      y: 78,
    },
    {
      key: "cb",
      name: "CB",
      shirtNumber: 4,
      positionLabel: "DFC",
      role: "DF",
      isPlaceholder: false,
      x: 50,
      y: 66,
    },
  ]);

  const separated = separateOverlappingSlots(away, MVP_AWAY_BOUNDS);
  const gk = separated.find((slot) => slot.role === "GK");
  assert.ok(gk);
  assert.ok(gk.y <= MVP_AWAY_BOUNDS.yMax);
  assert.ok(gk.y >= MVP_AWAY_BOUNDS.yMin);
});

test("mapSlotsToHomeHalf mantiene delantero en mitad inferior", () => {
  const mapped = mapSlotsToHomeHalf([
    {
      key: "st",
      name: "ST",
      shirtNumber: 9,
      positionLabel: "DC",
      role: "FW",
      isPlaceholder: false,
      x: 50,
      y: 18,
    },
  ]);

  assert.ok(mapped[0]!.y >= 70 && mapped[0]!.y <= 72);
});

test("separateOverlappingSlots respeta bounds de equipo individual", () => {
  const separated = separateOverlappingSlots(
    [
      {
        key: "a",
        name: "A",
        shirtNumber: 1,
        positionLabel: "POR",
        role: "GK",
        isPlaceholder: false,
        x: 50,
        y: 78,
      },
      {
        key: "b",
        name: "B",
        shirtNumber: 2,
        positionLabel: "DFC",
        role: "DF",
        isPlaceholder: false,
        x: 50,
        y: 78,
      },
    ],
    SINGLE_TEAM_BOUNDS
  );

  for (const slot of separated) {
    assert.ok(slot.y >= SINGLE_TEAM_BOUNDS.yMin);
    assert.ok(slot.y <= SINGLE_TEAM_BOUNDS.yMax);
  }
});
