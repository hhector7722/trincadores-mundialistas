import { clampToPlayable, PLAYABLE_X_MAX, PLAYABLE_X_MIN } from "@/lib/lineup/field-layout";
import type { FieldCoordinate } from "@/lib/lineup/types";

type LineKey = "GK" | "DF" | "DM" | "MF" | "AM" | "FW";

/** Profundidad táctica dentro de la zona jugable (arriba=ataque, abajo=portería). */
const LINE_DEPTH: Record<LineKey, number> = {
  GK: 78,
  DF: 66,
  DM: 54,
  MF: 44,
  AM: 34,
  FW: 18,
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
  RW: 82,
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
  if (key === "DM") return "DM";

  if (formation === "4-3-3" && ["LW", "RW", "ST", "CF"].includes(key)) return "FW";
  if (formation === "4-3-3" && ["LM", "RM", "CM", "AM"].includes(key)) return "MF";

  if (["AM", "LW", "RW"].includes(key)) return "AM";
  if (role === "FW" || ["ST", "CF", "SS"].includes(key)) return "FW";

  if (formation === "4-2-3-1" && ["CM", "LM", "RM"].includes(key)) {
    return "DM";
  }

  return "MF";
}

function horizontalOrder(slotKey: string): number {
  return SLOT_HORIZONTAL_ORDER[slotKey.trim().toUpperCase()] ?? 50;
}

function spreadPeersX(baseX: number, index: number, total: number, gap = 16): number {
  if (total <= 1) return baseX;
  const offset = (index - (total - 1) / 2) * gap;
  return Math.round(Math.min(PLAYABLE_X_MAX, Math.max(PLAYABLE_X_MIN, baseX + offset)) * 10) / 10;
}

function resolveHorizontalX(
  starter: LayoutInput,
  indexAmongPeers: number,
  peersTotal: number,
  formationLabel?: string
): number {
  const key = starter.slotKey.trim().toUpperCase();
  const formation = (formationLabel ?? "").trim();

  if (key === "GK") return 50;

  if (formation === "4-2-3-1" && key === "DM" && peersTotal === 2) {
    return indexAmongPeers === 0 ? 36 : 64;
  }

  const base = horizontalOrder(key);
  return spreadPeersX(base, indexAmongPeers, peersTotal);
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

    const peerGroups = new Map<number, number>();
    for (const { starter } of sorted) {
      const band = horizontalOrder(starter.slotKey);
      peerGroups.set(band, (peerGroups.get(band) ?? 0) + 1);
    }
    const peerIndexes = new Map<number, number>();

    sorted.forEach(({ starter }) => {
      const band = horizontalOrder(starter.slotKey);
      const peerIndex = peerIndexes.get(band) ?? 0;
      peerIndexes.set(band, peerIndex + 1);
      const peersTotal = peerGroups.get(band) ?? 1;

      positioned.push({
        ...starter,
        ...clampToPlayable({
          x: resolveHorizontalX(starter, peerIndex, peersTotal, formationLabel),
          y: LINE_DEPTH[line],
        }),
      });
    });
  }

  return positioned;
}
