import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPositionsFromSnapshots } from "@/lib/ranking/queries";

describe("buildPositionsFromSnapshots", () => {
  const members = [
    { profileId: "a", label: "Ana" },
    { profileId: "b", label: "Bruno" },
    { profileId: "c", label: "Carlos" },
  ];

  it("ordena por puntos acumulados descendente", () => {
    const snapshots = new Map([
      ["a", { cumulativePoints: 10, exactHits: 2 }],
      ["b", { cumulativePoints: 15, exactHits: 1 }],
      ["c", { cumulativePoints: 5, exactHits: 3 }],
    ]);

    const standings = buildPositionsFromSnapshots(members, snapshots);
    assert.deepEqual(
      standings.map((row) => row.profileId),
      ["b", "a", "c"]
    );
    assert.deepEqual(
      standings.map((row) => row.position),
      [1, 2, 3]
    );
  });

  it("desempata por exactos y luego por nombre", () => {
    const snapshots = new Map([
      ["a", { cumulativePoints: 10, exactHits: 1 }],
      ["b", { cumulativePoints: 10, exactHits: 3 }],
      ["c", { cumulativePoints: 10, exactHits: 1 }],
    ]);

    const standings = buildPositionsFromSnapshots(members, snapshots);
    assert.deepEqual(
      standings.map((row) => row.profileId),
      ["b", "a", "c"]
    );
  });

  it("asigna posición 1 a todos con 0 puntos ordenados alfabéticamente", () => {
    const snapshots = new Map([
      ["a", { cumulativePoints: 0, exactHits: 0 }],
      ["b", { cumulativePoints: 0, exactHits: 0 }],
      ["c", { cumulativePoints: 0, exactHits: 0 }],
    ]);

    const standings = buildPositionsFromSnapshots(members, snapshots);
    assert.deepEqual(
      standings.map((row) => ({ id: row.profileId, position: row.position })),
      [
        { id: "a", position: 1 },
        { id: "b", position: 2 },
        { id: "c", position: 3 },
      ]
    );
  });
});
