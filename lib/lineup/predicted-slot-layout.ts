import { assignFormationTemplateCoordinates } from "@/lib/lineup/formation-templates";
import type { FieldCoordinate, PositionRole } from "@/lib/lineup/types";

type LayoutInput = {
  slotKey: string;
  role: PositionRole;
};

export function layoutPredictedStarters<T extends LayoutInput>(
  starters: T[],
  formationLabel?: string
): Array<T & FieldCoordinate> {
  return assignFormationTemplateCoordinates(starters, formationLabel);
}
