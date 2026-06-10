import {
  getFormationSlotAnchors,
  normalizeFormationTemplate,
} from "@/lib/lineup/formation-templates";
import type { LineupSlot, PositionRole, ResolvedLineup } from "@/lib/lineup/types";

function roleForFormationSlot(slotKey: string): PositionRole {
  if (slotKey === "GK") return "GK";
  if (["LST", "RST", "ST", "LW", "RW"].includes(slotKey)) return "FW";
  if (["LB", "RB", "LCB", "RCB", "CB", "LWB", "RWB"].includes(slotKey)) return "DF";
  return "MF";
}

/**
 * Garantiza 11 titulares con coordenadas de plantilla para la vista táctica MVP.
 * Rellena huecos con placeholders sin ocultar el resto de la alineación.
 */
export function ensureElevenStarterSlots(lineup: ResolvedLineup): LineupSlot[] {
  const formation = normalizeFormationTemplate(lineup.formationLabel);
  const anchors = getFormationSlotAnchors(formation);
  const bySlotKey = new Map<string, LineupSlot>();

  for (const slot of lineup.slots.slice(0, 11)) {
    const key = slot.slotKey?.trim();
    if (key && !bySlotKey.has(key)) {
      bySlotKey.set(key, slot);
    }
  }

  const pool = [...lineup.slots];
  const positioned: LineupSlot[] = [];

  for (const anchor of anchors) {
    const matched =
      bySlotKey.get(anchor.key) ??
      pool.find((slot) => slot.slotKey === anchor.key) ??
      pool.shift();

    if (matched) {
      positioned.push({
        ...matched,
        slotKey: anchor.key,
        x: matched.x ?? anchor.coord.x,
        y: matched.y ?? anchor.coord.y,
      });
      continue;
    }

    positioned.push({
      key: `placeholder-${anchor.key}`,
      name: "Por confirmar",
      shirtNumber: null,
      positionLabel: anchor.key,
      role: roleForFormationSlot(anchor.key),
      isPlaceholder: true,
      slotKey: anchor.key,
      x: anchor.coord.x,
      y: anchor.coord.y,
    });
  }

  return positioned;
}
