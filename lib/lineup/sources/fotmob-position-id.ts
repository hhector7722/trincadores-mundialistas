import { normalizeSlotKey } from "@/lib/lineup/formation-templates";
import { normalizeTacticalSlot } from "@/lib/lineup/tactical-profile";
import type { PositionRole } from "@/lib/lineup/types";

/** Mapeo estable positionId FotMob → slot táctico (observado en WC2026). */
const FOTMOB_POSITION_ID_TO_SLOT: Record<number, string> = {
  11: "GK",
  32: "RB",
  33: "LCB",
  34: "RCB",
  35: "CB",
  36: "LCB",
  37: "RCB",
  38: "LB",
  51: "LWB",
  59: "RWB",
  64: "RDM",
  66: "LDM",
  72: "LM",
  74: "LCM",
  76: "RCM",
  78: "RM",
  83: "LW",
  85: "AM",
  87: "RW",
  115: "ST",
};

export function slotKeyFromFotmobPositionId(positionId: number | null | undefined): string | null {
  if (positionId == null || !Number.isFinite(positionId)) return null;
  const mapped = FOTMOB_POSITION_ID_TO_SLOT[positionId];
  return mapped ? normalizeSlotKey(mapped) : null;
}

export function roleFromSlotKey(slotKey: string): PositionRole {
  const tactical = normalizeTacticalSlot(slotKey);
  if (!tactical) return "MF";
  if (tactical === "GK") return "GK";
  if (["LB", "RB", "LWB", "RWB", "CB", "LCB", "RCB"].includes(tactical)) return "DF";
  if (["ST", "CF", "SS", "LW", "RW"].includes(tactical)) return "FW";
  return "MF";
}
