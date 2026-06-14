import {
  PLAYABLE_X_MAX,
  PLAYABLE_X_MIN,
  PLAYABLE_Y_MAX,
  PLAYABLE_Y_MIN,
  clampToPlayable,
} from "@/lib/lineup/field-layout";
import type { FotMobLayoutCoord, FotMobLineupPlayer } from "@/lib/lineup/sources/fotmob-client";
import type { FieldCoordinate } from "@/lib/lineup/types";

function readCoord(value: FotMobLayoutCoord | undefined, axis: "x" | "y"): number | null {
  const raw = value?.[axis];
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw;
}

/** FotMob: verticalLayout.x = ancho; verticalLayout.y = profundidad (0 portería, 1 ataque). */
export function fotmobPlayerToFieldCoord(player: FotMobLineupPlayer): FieldCoordinate | null {
  const layoutX = readCoord(player.verticalLayout, "x");
  const layoutY = readCoord(player.verticalLayout, "y");
  if (layoutX == null || layoutY == null) return null;

  const x = layoutX * (PLAYABLE_X_MAX - PLAYABLE_X_MIN) + PLAYABLE_X_MIN;
  const y = PLAYABLE_Y_MAX - layoutY * (PLAYABLE_Y_MAX - PLAYABLE_Y_MIN);
  return clampToPlayable({ x, y });
}
