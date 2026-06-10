import assert from "node:assert/strict";
import test from "node:test";
import {
  FORMATION_SLOT_ANCHORS,
  getFormationCoordinates,
  TACTICAL_X,
  TACTICAL_Y,
} from "./formation-coordinates";
import type { FormationId } from "./types";

const FORMATIONS = Object.keys(FORMATION_SLOT_ANCHORS) as FormationId[];

test("cada formación tiene 11 slots con coordenadas explícitas", () => {
  for (const formation of FORMATIONS) {
    const anchors = FORMATION_SLOT_ANCHORS[formation];
    assert.equal(anchors.length, 11, `${formation} debe tener 11 slots`);
    for (const anchor of anchors) {
      assert.ok(Number.isFinite(anchor.coord.x));
      assert.ok(Number.isFinite(anchor.coord.y));
    }
  }
});

test("pares espejados comparten la misma distancia al centro", () => {
  for (const formation of FORMATIONS) {
    const anchors = FORMATION_SLOT_ANCHORS[formation];
    const byKey = new Map(anchors.map((anchor) => [anchor.key, anchor.coord]));

    const mirrorPairs: [string, string][] = [
      ["LB", "RB"],
      ["LCB", "RCB"],
      ["LM", "RM"],
      ["LCM", "RCM"],
      ["LW", "RW"],
      ["LST", "RST"],
      ["LDM", "RDM"],
      ["LWB", "RWB"],
    ];

    for (const [left, right] of mirrorPairs) {
      const l = byKey.get(left);
      const r = byKey.get(right);
      if (!l || !r) continue;

      assert.equal(l.y, r.y, `${formation}: ${left}/${right} deben compartir línea`);
      assert.equal(
        Math.abs(50 - l.x),
        Math.abs(50 - r.x),
        `${formation}: ${left}/${right} deben ser simétricos`
      );
    }
  }
});

test("separación vertical mínima entre líneas tácticas distintas", () => {
  const minGap = 8;

  for (const formation of FORMATIONS) {
    const ys = [...new Set(getFormationCoordinates(formation).map((coord) => coord.y))].sort(
      (a, b) => a - b
    );

    for (let i = 1; i < ys.length; i += 1) {
      assert.ok(
        ys[i]! - ys[i - 1]! >= minGap,
        `${formation}: líneas demasiado juntas (${ys[i - 1]} → ${ys[i]})`
      );
    }
  }
});

test("portero y delanteros ocupan bandas oficiales", () => {
  for (const formation of FORMATIONS) {
    const coords = getFormationCoordinates(formation);
    const gkY = Math.max(...coords.map((coord) => coord.y));
    const fwY = Math.min(...coords.map((coord) => coord.y));

    assert.ok(gkY >= TACTICAL_Y.GOALKEEPER - 2, `${formation}: portero demasiado adelantado`);
    assert.ok(fwY <= TACTICAL_Y.FORWARD + 2, `${formation}: delanteros demasiado atrás`);
  }
});

test("coordenadas horizontales usan la rejilla estándar", () => {
  const allowedX = new Set<number>([
    TACTICAL_X.UL,
    TACTICAL_X.L,
    TACTICAL_X.IL,
    TACTICAL_X.C,
    TACTICAL_X.IR,
    TACTICAL_X.R,
    TACTICAL_X.UR,
    TACTICAL_X.DL,
    TACTICAL_X.DR,
  ]);

  for (const formation of FORMATIONS) {
    for (const coord of getFormationCoordinates(formation)) {
      assert.ok(allowedX.has(coord.x), `${formation}: x=${coord.x} fuera de rejilla`);
    }
  }
});
