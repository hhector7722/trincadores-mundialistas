import {
  fallbackSlotKeyForRole,
  normalizeFormationTemplate,
  normalizeSlotKey,
} from "@/lib/lineup/formation-templates";
import { resolveFormationSlotsFromStarters } from "@/lib/lineup/resolve-formation-slots";
import type { LineupSlot, PositionRole, ResolvedLineup } from "@/lib/lineup/types";

const UNAMBIGUOUS_LABEL_TO_SLOT: Record<string, string> = {
  POR: "GK",
  LI: "LB",
  LD: "RB",
  MI: "LM",
  MD: "RM",
  MP: "AM",
  EI: "LW",
  ED: "RW",
  DC: "ST",
};

function inferSlotKeyForRelayout(
  slot: LineupSlot,
  templateId: ReturnType<typeof normalizeFormationTemplate>,
  roleIndex: number
): string {
  if (slot.slotKey?.trim()) return normalizeSlotKey(slot.slotKey);
  const label = slot.positionLabel?.trim().toUpperCase();
  if (label && UNAMBIGUOUS_LABEL_TO_SLOT[label]) {
    return UNAMBIGUOUS_LABEL_TO_SLOT[label]!;
  }
  return fallbackSlotKeyForRole(templateId, slot.role, roleIndex);
}

/** Recalcula x/y desde plantilla fija; corrige caché antigua y coords deformadas. */
export function relayoutLineupSlots(lineup: ResolvedLineup): ResolvedLineup {
  const templateId = normalizeFormationTemplate(lineup.formationLabel);
  const roleCounters: Record<PositionRole, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };

  const inputs = lineup.slots.map((slot) => {
    const roleIndex = roleCounters[slot.role];
    roleCounters[slot.role] += 1;
    const slotKey = inferSlotKeyForRelayout(slot, templateId, roleIndex);
    return {
      key: slot.key,
      name: slot.name,
      shirtNumber: slot.shirtNumber,
      role: slot.role,
      positionLabel: slot.positionLabel,
      isPlaceholder: slot.isPlaceholder,
      slotKey,
    };
  });

  return {
    ...lineup,
    slots: resolveFormationSlotsFromStarters(inputs, templateId),
  };
}
