import { clampToPlayable, PLAYABLE_X_MAX, PLAYABLE_X_MIN } from "@/lib/lineup/field-layout";
import type { FieldCoordinate } from "@/lib/lineup/types";

type LineKey = "GK" | "DF" | "DM" | "MF" | "AM" | "FW";

/** Profundidad táctica dentro de la zona jugable (arriba=ataque, abajo=portería). */
const LINE_DEPTH: Record<LineKey, number> = {
  GK: 78,
  DF: 66,
  DM: 54,
  MF: 44,
  AM: 32,
  FW: 22,
};

const SLOT_HORIZONTAL_ORDER: Record<string, number> = {
  LWB: 5,
  LB: 12,
  LM: 18,
  LW: 22,
  CB: 50,
  DM: 42,
  CM: 50,
  AM: 50,
  SS: 48,
  CF: 50,
  ST: 50,
  RM: 82,
  RB: 88,
  RWB: 92,
  GK: 50,
};

type LayoutInput = {
  slotKey: string;
  role: "GK" | "DF" | "MF" | "FW";
};

function tacticalLine({ slotKey, role }: LayoutInput, formationLabel?: string): LineKey {
  const key = slotKey.trim().toUpperCase();
  const formation = (formationLabel ?? "").trim();

  if (role === "GK" || key === "GK") return "GK";
  if (role === "DF" || ["LB", "RB", "CB", "LWB", "RWB"].includes(key)) return "DF";
  if (role === "FW" || ["ST", "CF", "SS"].includes(key)) return "FW";
  if (key === "DM") return "DM";
  if (["AM", "LW", "RW"].includes(key)) return "AM";

  if (formation === "4-2-3-1" && ["CM", "LM", "RM"].includes(key)) {
    return "DM";
  }

  return "MF";
}

function horizontalOrder(slotKey: string): number {
  return SLOT_HORIZONTAL_ORDER[slotKey.trim().toUpperCase()] ?? 50;
}

function spreadX(index: number, total: number): number {
  if (total <= 1) return 50;
  const spread = Math.max(total - 1, 1);
  const x = PLAYABLE_X_MIN + (index / spread) * (PLAYABLE_X_MAX - PLAYABLE_X_MIN);
  return Math.round(x * 10) / 10;
}

export function layoutPredictedStarters<T extends LayoutInput>(
  starters: T[],
  formationLabel?: string
): Array<T & FieldCoordinate> {
  const lineBuckets = new Map<LineKey, Array<{ starter: T; index: number }>>();

  starters.forEach((starter, index) => {
    const line = tacticalLine(starter, formationLabel);
    const bucket = lineBuckets.get(line) ?? [];
    bucket.push({ starter, index });
    lineBuckets.set(line, bucket);
  });

  const positioned: Array<T & FieldCoordinate> = [];

  for (const [line, bucket] of lineBuckets) {
    const sorted = [...bucket].sort((a, b) => {
      const orderDiff = horizontalOrder(a.starter.slotKey) - horizontalOrder(b.starter.slotKey);
      return orderDiff !== 0 ? orderDiff : a.index - b.index;
    });

    sorted.forEach(({ starter }, index) => {
      positioned.push({
        ...starter,
        ...clampToPlayable({
          x: spreadX(index, sorted.length),
          y: LINE_DEPTH[line],
        }),
      });
    });
  }

  return positioned;
}
