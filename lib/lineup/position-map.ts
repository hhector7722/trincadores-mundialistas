import type { FieldCoordinate, FormationId, PositionRole } from "@/lib/lineup/types";

const ROLE_LABEL_ES: Record<PositionRole, string> = {
  GK: "POR",
  DF: "DEF",
  MF: "MED",
  FW: "DEL",
};

/** Normaliza position_name / position_code Fjelstul → rol táctico. */
export function normalizePositionRole(position: string | null): PositionRole {
  const raw = (position ?? "").toLowerCase().trim();
  if (raw === "gk" || raw.includes("goal")) return "GK";
  if (raw === "mf" || raw.includes("mid") || raw.includes("medio")) return "MF";
  if (raw === "df" || raw.startsWith("def")) return "DF";
  if (raw === "fw" || raw.startsWith("for") || raw.includes("delan")) return "FW";
  return "MF";
}

export function isGoalkeeperPosition(position: string | null): boolean {
  return normalizePositionRole(position) === "GK";
}

export function positionLabelEs(role: PositionRole, rawPosition: string | null): string {
  const code = (rawPosition ?? "").trim().toUpperCase();
  if (code.length <= 3 && /^[A-Z]{2,3}$/.test(code)) return code;
  return ROLE_LABEL_ES[role];
}

/** Coordenadas % del campo vertical (x: ancho, y: arriba=ataque, abajo=portería). */
const FORMATION_COORDS: Record<FormationId, Record<PositionRole, FieldCoordinate[]>> = {
  "4-3-3": {
    GK: [{ x: 50, y: 84 }],
    DF: [
      { x: 14, y: 70 },
      { x: 38, y: 70 },
      { x: 62, y: 70 },
      { x: 86, y: 70 },
    ],
    MF: [
      { x: 26, y: 46 },
      { x: 50, y: 46 },
      { x: 74, y: 46 },
    ],
    FW: [
      { x: 22, y: 16 },
      { x: 50, y: 16 },
      { x: 78, y: 16 },
    ],
  },
  "4-4-2": {
    GK: [{ x: 50, y: 84 }],
    DF: [
      { x: 14, y: 70 },
      { x: 38, y: 70 },
      { x: 62, y: 70 },
      { x: 86, y: 70 },
    ],
    MF: [
      { x: 12, y: 46 },
      { x: 38, y: 46 },
      { x: 62, y: 46 },
      { x: 88, y: 46 },
    ],
    FW: [
      { x: 36, y: 16 },
      { x: 64, y: 16 },
    ],
  },
};

export function formationRoleCounts(formation: FormationId): Record<PositionRole, number> {
  const coords = FORMATION_COORDS[formation];
  return {
    GK: coords.GK.length,
    DF: coords.DF.length,
    MF: coords.MF.length,
    FW: coords.FW.length,
  };
}

export function pickFormation(playerCounts: Record<PositionRole, number>): FormationId {
  if (playerCounts.FW >= 3 && playerCounts.MF >= 3) return "4-3-3";
  return "4-4-2";
}

export function coordinatesForFormation(formation: FormationId): Record<PositionRole, FieldCoordinate[]> {
  return FORMATION_COORDS[formation];
}
