import type { FieldCoordinate } from "@/lib/lineup/types";

const BASE_SLOT_COORDS: Record<string, FieldCoordinate> = {
  GK: { x: 50, y: 90 },
  LB: { x: 14, y: 72 },
  LWB: { x: 10, y: 66 },
  CB: { x: 50, y: 75 },
  RB: { x: 86, y: 72 },
  RWB: { x: 90, y: 66 },
  DM: { x: 50, y: 58 },
  CM: { x: 50, y: 50 },
  LM: { x: 14, y: 52 },
  RM: { x: 86, y: 52 },
  AM: { x: 50, y: 36 },
  LW: { x: 22, y: 22 },
  RW: { x: 78, y: 22 },
  ST: { x: 50, y: 16 },
  CF: { x: 50, y: 18 },
  SS: { x: 50, y: 24 },
};

const CB_OFFSETS = [-24, -8, 8, 24];
const CM_OFFSETS = [-22, 0, 22];
const ST_OFFSETS = [-16, 16];

export function coordinateForPredictedSlot(
  slot: string | null | undefined,
  slotIndexAmongSame: number
): FieldCoordinate {
  const key = (slot ?? "").trim().toUpperCase();
  const base = BASE_SLOT_COORDS[key] ?? { x: 50, y: 50 };

  if (key === "CB") {
    const offset = CB_OFFSETS[slotIndexAmongSame] ?? 0;
    return { x: base.x + offset, y: base.y };
  }
  if (key === "CM" || key === "DM") {
    const offset = CM_OFFSETS[slotIndexAmongSame] ?? 0;
    return { x: base.x + offset, y: base.y };
  }
  if (key === "ST" || key === "CF") {
    const offset = ST_OFFSETS[slotIndexAmongSame] ?? 0;
    return { x: base.x + offset, y: base.y };
  }

  return base;
}

export function coordinateForConfirmedIndex(
  role: "GK" | "DF" | "MF" | "FW",
  index: number,
  totalInRole: number
): FieldCoordinate {
  const spread = Math.max(totalInRole - 1, 1);
  const x = 12 + (index / spread) * 76;
  const yByRole: Record<typeof role, number> = {
    GK: 90,
    DF: 74,
    MF: 50,
    FW: 20,
  };
  return { x: Math.round(x * 10) / 10, y: yByRole[role] };
}
