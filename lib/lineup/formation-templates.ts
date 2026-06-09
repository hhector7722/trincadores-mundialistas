import { clampToPlayable } from "@/lib/lineup/field-layout";
import type { FieldCoordinate, FormationId, PositionRole } from "@/lib/lineup/types";

/** Formaciones con plantilla visual fija (misma disposición siempre). */
export type FormationTemplateId = "4-3-3" | "4-4-2" | "4-2-3-1";

type TemplateAnchor = {
  key: string;
  accept: readonly string[];
  coord: FieldCoordinate;
};

const TEMPLATES: Record<FormationTemplateId, TemplateAnchor[]> = {
  "4-3-3": [
    { key: "GK", accept: ["GK"], coord: { x: 50, y: 78 } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: 20, y: 66 } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: 40, y: 66 } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: 60, y: 66 } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: 80, y: 66 } },
    { key: "LM", accept: ["LM", "LCM", "CM"], coord: { x: 26, y: 44 } },
    { key: "CM", accept: ["CM"], coord: { x: 50, y: 44 } },
    { key: "RM", accept: ["RM", "RCM", "CM"], coord: { x: 74, y: 44 } },
    { key: "LW", accept: ["LW"], coord: { x: 22, y: 18 } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: 50, y: 18 } },
    { key: "RW", accept: ["RW"], coord: { x: 80, y: 18 } },
  ],
  "4-4-2": [
    { key: "GK", accept: ["GK"], coord: { x: 50, y: 78 } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: 20, y: 66 } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: 40, y: 66 } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: 60, y: 66 } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: 80, y: 66 } },
    { key: "LM", accept: ["LM", "LW"], coord: { x: 20, y: 44 } },
    { key: "LCM", accept: ["CM", "DM", "LCM"], coord: { x: 40, y: 44 } },
    { key: "RCM", accept: ["CM", "DM", "RCM"], coord: { x: 60, y: 44 } },
    { key: "RM", accept: ["RM", "RW"], coord: { x: 80, y: 44 } },
    { key: "LST", accept: ["ST", "CF", "LST", "DC"], coord: { x: 38, y: 18 } },
    { key: "RST", accept: ["ST", "CF", "SS", "RST", "DC"], coord: { x: 62, y: 18 } },
  ],
  "4-2-3-1": [
    { key: "GK", accept: ["GK"], coord: { x: 50, y: 78 } },
    { key: "LB", accept: ["LB", "LWB"], coord: { x: 20, y: 66 } },
    { key: "LCB", accept: ["CB", "LCB", "DFC"], coord: { x: 40, y: 66 } },
    { key: "RCB", accept: ["CB", "RCB", "DFC"], coord: { x: 60, y: 66 } },
    { key: "RB", accept: ["RB", "RWB"], coord: { x: 80, y: 66 } },
    { key: "LDM", accept: ["DM", "CDM", "LDM", "MCD"], coord: { x: 36, y: 54 } },
    { key: "RDM", accept: ["DM", "CDM", "RDM", "MCD"], coord: { x: 64, y: 54 } },
    { key: "LW", accept: ["LW"], coord: { x: 22, y: 34 } },
    { key: "AM", accept: ["AM", "CAM", "SS"], coord: { x: 50, y: 34 } },
    { key: "RW", accept: ["RW"], coord: { x: 80, y: 34 } },
    { key: "ST", accept: ["ST", "CF"], coord: { x: 50, y: 18 } },
  ],
};

const SLOT_KEY_ALIASES: Record<string, string> = {
  G: "GK",
  GOALKEEPER: "GK",
  D: "CB",
  DF: "CB",
  DFC: "CB",
  CDM: "DM",
  CAM: "AM",
  LWB: "LB",
  RWB: "RB",
  CF: "ST",
  LCM: "CM",
  RCM: "CM",
  MCD: "DM",
  MC: "CM",
  MI: "LM",
  MD: "RM",
  MP: "AM",
  EI: "LW",
  ED: "RW",
  DC: "ST",
  LI: "LB",
  LD: "RB",
  POR: "GK",
};

export function normalizeFormationTemplate(label: string | null | undefined): FormationTemplateId {
  const value = (label ?? "").trim();
  if (value === "4-4-2") return "4-4-2";
  if (value === "4-2-3-1") return "4-2-3-1";
  return "4-3-3";
}

export function normalizeSlotKey(raw: string | null | undefined): string {
  const key = (raw ?? "CM").trim().toUpperCase();
  return SLOT_KEY_ALIASES[key] ?? key;
}

export function getFormationTemplate(formation: FormationTemplateId): TemplateAnchor[] {
  return TEMPLATES[formation];
}

export function getFormationTemplateCoordinates(
  formation: FormationTemplateId
): FieldCoordinate[] {
  return TEMPLATES[formation].map((anchor) => anchor.coord);
}

/** Agrupa coords de plantilla por rol (orden de anclas) para el fallback dorsal+posición. */
export function getRoleCoordinatesFromTemplate(
  formation: FormationId
): Record<PositionRole, FieldCoordinate[]> {
  const templateId = normalizeFormationTemplate(formation);
  const anchors = TEMPLATES[templateId];
  const buckets: Record<PositionRole, FieldCoordinate[]> = {
    GK: [],
    DF: [],
    MF: [],
    FW: [],
  };

  for (const anchor of anchors) {
    const key = normalizeSlotKey(anchor.accept[0] ?? "CM");
    if (key === "GK") buckets.GK.push(anchor.coord);
    else if (["LB", "CB", "RB", "LWB", "RWB", "LCB", "RCB"].includes(key)) buckets.DF.push(anchor.coord);
    else if (["ST", "CF", "SS", "LW", "RW", "LST", "RST"].includes(key)) buckets.FW.push(anchor.coord);
    else buckets.MF.push(anchor.coord);
  }

  return buckets;
}

/** Slot sintético cuando la fuente solo aporta rol + índice (fallback / confirmada). */
export function fallbackSlotKeyForRole(
  formation: FormationTemplateId,
  role: PositionRole,
  index: number
): string {
  if (role === "GK") return "GK";

  if (role === "DF") {
    return (["LB", "LCB", "RCB", "RB"] as const)[index] ?? "CB";
  }

  if (formation === "4-4-2") {
    if (role === "MF") return (["LM", "LCM", "RCM", "RM"] as const)[index] ?? "CM";
    return index === 0 ? "LST" : "RST";
  }

  if (formation === "4-2-3-1") {
    if (role === "MF") return (["LDM", "RDM", "AM"] as const)[index] ?? "CM";
    if (role === "FW") return (["LW", "ST", "RW"] as const)[index] ?? "ST";
    return "CM";
  }

  // 4-3-3
  if (role === "MF") return (["LM", "CM", "RM"] as const)[index] ?? "CM";
  if (role === "FW") return (["LW", "ST", "RW"] as const)[index] ?? "ST";
  return "CM";
}

type LayoutInput = {
  slotKey: string;
  role: PositionRole;
};

function expandedAccept(
  formation: FormationTemplateId,
  accept: readonly string[]
): string[] {
  const keys = new Set(accept.map((key) => normalizeSlotKey(key)));

  if (formation === "4-3-3") {
    const midfieldLine = ["LM", "LCM", "CM", "RM", "RCM"];
    if ([...keys].some((key) => midfieldLine.includes(key))) {
      keys.add("DM");
      keys.add("AM");
    }
  }

  if (formation === "4-2-3-1") {
    if (keys.has("AM")) {
      keys.add("CM");
    }
    if (keys.has("LW") || keys.has("RW")) {
      keys.add("LM");
      keys.add("RM");
    }
  }

  return [...keys];
}

function starterMatchesAnchor(
  starter: LayoutInput,
  formation: FormationTemplateId,
  accept: readonly string[]
): boolean {
  const key = normalizeSlotKey(starter.slotKey);
  const keys = expandedAccept(formation, accept);
  if (keys.includes(key)) return true;

  if (keys.includes("CB") && starter.role === "DF" && key === "CB") return true;
  if (keys.includes("CM") && starter.role === "MF" && key === "CM") return true;
  if (keys.includes("ST") && starter.role === "FW" && (key === "ST" || key === "CF")) return true;
  if (keys.includes("DM") && starter.role === "MF" && key === "DM") return true;

  return false;
}

/**
 * Asigna coordenadas fijas de plantilla según slot táctico y formación.
 * Todos los equipos con la misma formación comparten la misma geometría.
 */
export function assignFormationTemplateCoordinates<T extends LayoutInput>(
  starters: T[],
  formationLabel: string | null | undefined
): Array<T & FieldCoordinate & { slotKey: string }> {
  const formation = normalizeFormationTemplate(formationLabel);
  const anchors = TEMPLATES[formation];
  const pool = starters.map((starter, index) => ({ starter, index }));
  const positioned: Array<T & FieldCoordinate & { slotKey: string }> = [];
  const usedAnchors = new Set<number>();

  for (let anchorIndex = 0; anchorIndex < anchors.length; anchorIndex++) {
    const anchor = anchors[anchorIndex]!;
    const matchIndex = pool.findIndex(({ starter }) =>
      starterMatchesAnchor(starter, formation, anchor.accept)
    );

    if (matchIndex === -1) continue;

    const [{ starter }] = pool.splice(matchIndex, 1);
    usedAnchors.add(anchorIndex);
    positioned.push({
      ...starter,
      slotKey: anchor.key,
      ...clampToPlayable(anchor.coord),
    });
  }

  for (let anchorIndex = 0; anchorIndex < anchors.length && pool.length > 0; anchorIndex++) {
    if (usedAnchors.has(anchorIndex)) continue;
    const anchor = anchors[anchorIndex]!;
    const [{ starter }] = pool.splice(0, 1);
    usedAnchors.add(anchorIndex);
    positioned.push({
      ...starter,
      slotKey: anchor.key,
      ...clampToPlayable(anchor.coord),
    });
  }

  return positioned;
}
