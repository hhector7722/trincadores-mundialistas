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
import { getRoleCoordinatesFromTemplate } from "@/lib/lineup/formation-templates";

const FORMATION_COORDS: Record<FormationId, Record<PositionRole, FieldCoordinate[]>> = {
  "4-3-3": getRoleCoordinatesFromTemplate("4-3-3"),
  "4-4-2": getRoleCoordinatesFromTemplate("4-4-2"),
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
