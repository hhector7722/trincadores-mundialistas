import assert from "node:assert/strict";
import test from "node:test";
import {
  hasDuplicateStarterShirts,
  isPredictedLineupCacheStale,
} from "./lineup-cache-stale";
import type { ResolvedLineup } from "./types";

function predictedLineup(
  shirts: Array<number | null>,
  overrides?: Partial<ResolvedLineup>
): ResolvedLineup {
  return {
    formation: "4-3-3",
    formationLabel: "4-3-3",
    slots: shirts.map((shirtNumber, index) => ({
      slotKey: "CM",
      role: "MF" as const,
      key: `p-${index}`,
      name: `Player ${index}`,
      shirtNumber,
      positionLabel: "MC",
      isPlaceholder: shirtNumber == null,
      x: 50,
      y: 50,
    })),
    bench: [],
    benchCount: 0,
    isProbable: true,
    sourceKind: "predicted",
    dataSourceCode: "bsd",
    fetchedAt: new Date().toISOString(),
    ...overrides,
  };
}

test("hasDuplicateStarterShirts detecta dorsales repetidos", () => {
  assert.equal(hasDuplicateStarterShirts(predictedLineup([1, 5, 10, 10])), true);
  assert.equal(hasDuplicateStarterShirts(predictedLineup([1, 5, 10, 14])), false);
});

test("isPredictedLineupCacheStale detecta titulares sin dorsal", () => {
  const lineup = predictedLineup([1, 5, 4, 10]);
  lineup.slots[2] = { ...lineup.slots[2]!, shirtNumber: null };
  assert.equal(isPredictedLineupCacheStale(lineup), true);
});

test("isPredictedLineupCacheStale detecta placeholders Por confirmar", () => {
  const lineup = predictedLineup([1, 5, 4, 10]);
  lineup.slots[3] = {
    ...lineup.slots[3]!,
    name: "Por confirmar",
    shirtNumber: null,
    isPlaceholder: true,
  };
  assert.equal(isPredictedLineupCacheStale(lineup), true);
});

test("isPredictedLineupCacheStale detecta duplicados y dorsal BSD inválido", () => {
  assert.equal(isPredictedLineupCacheStale(predictedLineup([1, 5, 25, 25])), true);
  assert.equal(isPredictedLineupCacheStale(predictedLineup([1, 5, 4, 37])), true);
  assert.equal(isPredictedLineupCacheStale(predictedLineup([1, 5, 4, 10])), false);
  assert.equal(
    isPredictedLineupCacheStale(
      predictedLineup([1, 5, 4, 10], { sourceKind: "confirmed" })
    ),
    false
  );
});
