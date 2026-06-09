import type { FieldCoordinate } from "@/lib/lineup/types";

type LineKey = "GK" | "DF" | "DM" | "MF" | "AM" | "FW";

/** Profundidad táctica (%): arriba = ataque, abajo = portería. */
const LINE_DEPTH: Record<LineKey, number> = {
  GK: 90,
  DF: 74,
  DM: 60,
  MF: 50,
  AM: 34,
  FW: 18,
};

/** Línea táctica por índice de titular (orden BSD: POR → DEF → MED → DEL). */
const FORMATION_LINE_BY_INDEX: Record<string, LineKey[]> = {
  "4-2-3-1": ["GK", "DF", "DF", "DF", "DF", "DM", "DM", "AM", "AM", "AM", "FW"],
  "4-3-3": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"],
  "4-4-2": ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "FW", "FW"],
  "3-5-2": ["GK", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "MF", "FW", "FW"],
  "5-3-2": ["GK", "DF", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW"],
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
  RW: 78,
  GK: 50,
};

type LayoutInput = {
  slotKey: string;
  role: "GK" | "DF" | "MF" | "FW";
};

function tacticalLine({ slotKey, role }: LayoutInput): LineKey {
  const key = slotKey.trim().toUpperCase();
  if (role === "GK") return "GK";
  if (role === "DF") return "DF";
  if (role === "FW") return "FW";
  if (key === "DM") return "DM";
  if (["AM", "LW", "RW", "SS", "CF"].includes(key)) return "AM";
  return "MF";
}

function horizontalOrder(slotKey: string): number {
  return SLOT_HORIZONTAL_ORDER[slotKey.trim().toUpperCase()] ?? 50;
}

function spreadX(index: number, total: number): number {
  if (total <= 1) return 50;
  const spread = Math.max(total - 1, 1);
  return Math.round((12 + (index / spread) * 76) * 10) / 10;
}

function layoutByLineGroups<T extends LayoutInput>(
  starters: T[],
  lineForIndex: (index: number, starter: T) => LineKey
): Array<T & FieldCoordinate> {
  const lineBuckets = new Map<LineKey, Array<{ starter: T; index: number }>>();

  starters.forEach((starter, index) => {
    const line = lineForIndex(index, starter);
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
        x: spreadX(index, sorted.length),
        y: LINE_DEPTH[line],
      });
    });
  }

  return positioned;
}

/**
 * Coloca titulares predichos usando la formación declarada por BSD (p. ej. 4-2-3-1)
 * o, en su defecto, heurística por slot/rol.
 */
export function layoutPredictedStarters<T extends LayoutInput>(
  starters: T[],
  formationLabel?: string
): Array<T & FieldCoordinate> {
  const template = formationLabel ? FORMATION_LINE_BY_INDEX[formationLabel] : undefined;

  if (template && starters.length === 11) {
    return layoutByLineGroups(starters, (index) => template[index] ?? tacticalLine(starters[index]!));
  }

  return layoutByLineGroups(starters, (_index, starter) => tacticalLine(starter));
}
