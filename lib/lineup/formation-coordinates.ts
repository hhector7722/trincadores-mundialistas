import type { FieldCoordinate, FormationId } from "@/lib/lineup/types";

/**
 * Sistema maestro de coordenadas tácticas (% del campo).
 * x: ancho (0 = banda izquierda, 100 = banda derecha)
 * y: alto (0 = área rival, 100 = portería propia)
 *
 * Fuente única de verdad: cada formación tiene coordenadas fijas por slot.
 */

export const TACTICAL_X = {
  /** Muy abierto izquierda */
  UL: 10,
  /** Extremo izquierdo */
  L: 12,
  /** Interior izquierdo */
  IL: 32,
  /** Centro */
  C: 50,
  /** Interior derecho */
  IR: 68,
  /** Extremo derecho */
  R: 88,
  /** Muy abierto derecha */
  UR: 90,
  /** Carril defensivo izquierdo (5 at the back) */
  DL: 28,
  /** Carril defensivo derecho (5 at the back) */
  DR: 72,
} as const;

export const TACTICAL_Y = {
  /** Delanteros */
  FORWARD: 9,
  /** Mediapuntas */
  ATTACK: 26,
  /** Centrocampistas */
  MIDFIELD: 44,
  /** Pivotes */
  HOLDING: 61,
  /** Defensas */
  DEFENSE: 79,
  /** Portero */
  GOALKEEPER: 115,
} as const;

/** Alias usado por field-layout y proyección MVP. */
export const TACTICAL_LINE_Y = {
  GOALKEEPER: TACTICAL_Y.GOALKEEPER,
  DEFENSE: TACTICAL_Y.DEFENSE,
  HOLDING: TACTICAL_Y.HOLDING,
  MIDFIELD: TACTICAL_Y.MIDFIELD,
  ATTACK: TACTICAL_Y.ATTACK,
  FORWARD: TACTICAL_Y.FORWARD,
} as const;

export type FormationSlotAnchor = {
  key: string;
  accept: readonly string[];
  coord: FieldCoordinate;
};

/** Todas las formaciones con plantilla visual oficial. */
export const FORMATION_IDS: readonly FormationId[] = [
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "4-1-4-1",
  "3-5-2",
  "5-3-2",
  "5-4-1",
  "5-2-3",
  "3-4-3",
  "3-4-2-1",
];

const { x: X, y: Y } = { x: TACTICAL_X, y: TACTICAL_Y };

/**
 * Coordenadas oficiales por formación.
 * Simetría perfecta respecto al eje x = 50.
 */
export const FORMATION_SLOT_ANCHORS: Record<FormationId, FormationSlotAnchor[]> = {
  "4-4-2": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: X.R, y: Y.DEFENSE } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: X.L, y: Y.DEFENSE } },
    { key: "LM", accept: ["LM", "LW"], coord: { x: X.R, y: Y.MIDFIELD } },
    { key: "LCM", accept: ["CM", "DM", "LCM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["CM", "DM", "RCM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "RM", accept: ["RM", "RW"], coord: { x: X.L, y: Y.MIDFIELD } },
    { key: "LST", accept: ["ST", "CF", "LST", "DC"], coord: { x: X.IR, y: Y.FORWARD } },
    { key: "RST", accept: ["ST", "CF", "SS", "RST", "DC"], coord: { x: X.IL, y: Y.FORWARD } },
  ],
  "4-3-3": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: X.R, y: Y.DEFENSE } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: X.L, y: Y.DEFENSE } },
    { key: "DM", accept: ["DM", "CDM", "MCD", "CM"], coord: { x: X.C, y: Y.HOLDING } },
    { key: "LCM", accept: ["LCM", "CM", "LM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM", "RM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "LW", accept: ["LW"], coord: { x: X.R, y: Y.FORWARD } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: Y.FORWARD } },
    { key: "RW", accept: ["RW"], coord: { x: X.L, y: Y.FORWARD } },
  ],
  "4-2-3-1": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: X.R, y: Y.DEFENSE } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: X.L, y: Y.DEFENSE } },
    { key: "LDM", accept: ["DM", "CDM", "LDM", "MCD"], coord: { x: X.IR, y: 48 } },
    { key: "RDM", accept: ["DM", "CDM", "RDM", "MCD"], coord: { x: X.IL, y: 48 } },
    { key: "LW", accept: ["LW"], coord: { x: X.R, y: Y.ATTACK } },
    { key: "AM", accept: ["AM", "CAM", "SS"], coord: { x: X.C, y: 46 } },
    { key: "RW", accept: ["RW"], coord: { x: X.L, y: Y.ATTACK } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: -4 } },
  ],
  "4-1-4-1": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: X.R, y: Y.DEFENSE } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: X.L, y: Y.DEFENSE } },
    { key: "DM", accept: ["DM", "CDM", "MCD"], coord: { x: X.C, y: Y.HOLDING } },
    { key: "LM", accept: ["LM", "LW"], coord: { x: X.R, y: Y.MIDFIELD } },
    { key: "LCM", accept: ["LCM", "CM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "RM", accept: ["RM", "RW"], coord: { x: X.L, y: Y.MIDFIELD } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: Y.FORWARD } },
  ],
  "3-5-2": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "CB", accept: ["CB", "DFC"], coord: { x: X.C, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "LWB", accept: ["LWB", "LB", "LM"], coord: { x: X.UR, y: Y.HOLDING } },
    { key: "LCM", accept: ["LCM", "CM", "DM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "CM", accept: ["CM"], coord: { x: X.C, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM", "DM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "RWB", accept: ["RWB", "RB", "RM"], coord: { x: X.UL, y: Y.HOLDING } },
    { key: "LST", accept: ["ST", "CF", "LST", "DC"], coord: { x: X.IR, y: Y.FORWARD } },
    { key: "RST", accept: ["ST", "CF", "SS", "RST", "DC"], coord: { x: X.IL, y: Y.FORWARD } },
  ],
  "5-3-2": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LWB", accept: ["LWB", "LB"], coord: { x: X.UR, y: 70 } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.DR, y: 70 } },
    { key: "CB", accept: ["CB", "DFC"], coord: { x: X.C, y: 70 } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.DL, y: 70 } },
    { key: "RWB", accept: ["RWB", "RB"], coord: { x: X.UL, y: 70 } },
    { key: "LCM", accept: ["LCM", "CM", "LM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "CM", accept: ["CM", "DM"], coord: { x: X.C, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM", "RM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "LST", accept: ["ST", "CF", "LST", "DC"], coord: { x: X.IR, y: Y.FORWARD } },
    { key: "RST", accept: ["ST", "CF", "SS", "RST", "DC"], coord: { x: X.IL, y: Y.FORWARD } },
  ],
  "5-4-1": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LWB", accept: ["LWB", "LB"], coord: { x: X.UR, y: 70 } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.DR, y: 70 } },
    { key: "CB", accept: ["CB", "DFC"], coord: { x: X.C, y: 70 } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.DL, y: 70 } },
    { key: "RWB", accept: ["RWB", "RB"], coord: { x: X.UL, y: 70 } },
    { key: "LM", accept: ["LM", "LW"], coord: { x: X.R, y: Y.MIDFIELD } },
    { key: "LCM", accept: ["LCM", "CM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "RM", accept: ["RM", "RW"], coord: { x: X.L, y: Y.MIDFIELD } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: Y.FORWARD } },
  ],
  "5-2-3": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LWB", accept: ["LWB", "LB"], coord: { x: X.UR, y: 70 } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.DR, y: 70 } },
    { key: "CB", accept: ["CB", "DFC"], coord: { x: X.C, y: 70 } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.DL, y: 70 } },
    { key: "RWB", accept: ["RWB", "RB"], coord: { x: X.UL, y: 70 } },
    { key: "LCM", accept: ["LCM", "CM", "DM"], coord: { x: X.IR, y: Y.HOLDING } },
    { key: "RCM", accept: ["RCM", "CM", "DM"], coord: { x: X.IL, y: Y.HOLDING } },
    { key: "LW", accept: ["LW"], coord: { x: X.R, y: Y.FORWARD } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: Y.FORWARD } },
    { key: "RW", accept: ["RW"], coord: { x: X.L, y: Y.FORWARD } },
  ],
  "3-4-3": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "CB", accept: ["CB", "DFC"], coord: { x: X.C, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "LM", accept: ["LM", "LWB"], coord: { x: X.R, y: Y.MIDFIELD } },
    { key: "LCM", accept: ["LCM", "CM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "RM", accept: ["RM", "RWB"], coord: { x: X.L, y: Y.MIDFIELD } },
    { key: "LW", accept: ["LW"], coord: { x: X.R, y: Y.FORWARD } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: Y.FORWARD } },
    { key: "RW", accept: ["RW"], coord: { x: X.L, y: Y.FORWARD } },
  ],
  "3-4-2-1": [
    { key: "GK", accept: ["GK"], coord: { x: X.C, y: Y.GOALKEEPER } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: X.IR, y: Y.DEFENSE } },
    { key: "CB", accept: ["CB", "DFC"], coord: { x: X.C, y: Y.DEFENSE } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: X.IL, y: Y.DEFENSE } },
    { key: "LM", accept: ["LM", "LWB"], coord: { x: X.R, y: Y.MIDFIELD } },
    { key: "LCM", accept: ["LCM", "CM"], coord: { x: X.IR, y: Y.MIDFIELD } },
    { key: "RCM", accept: ["RCM", "CM"], coord: { x: X.IL, y: Y.MIDFIELD } },
    { key: "RM", accept: ["RM", "RWB"], coord: { x: X.L, y: Y.MIDFIELD } },
    { key: "LAM", accept: ["AM", "LAM", "SS"], coord: { x: X.IR, y: Y.ATTACK } },
    { key: "RAM", accept: ["AM", "RAM", "SS"], coord: { x: X.IL, y: Y.ATTACK } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: X.C, y: Y.FORWARD } },
  ],
};

/** Alias legible del registro maestro de formaciones. */
export const FORMATIONS = FORMATION_SLOT_ANCHORS;

export function isFormationId(value: string): value is FormationId {
  return (FORMATION_IDS as readonly string[]).includes(value);
}

/** @deprecated Usar isFormationId */
export function isFormationTemplateId(value: string): value is FormationId {
  return isFormationId(value);
}

export function getFormationSlotAnchors(formation: FormationId): FormationSlotAnchor[] {
  return FORMATION_SLOT_ANCHORS[formation];
}

export function getFormationCoordinates(formation: FormationId): FieldCoordinate[] {
  return FORMATION_SLOT_ANCHORS[formation].map((anchor) => anchor.coord);
}
