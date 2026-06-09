import type { FieldCoordinate } from "@/lib/lineup/types";

/** Convierte grid API-Football ("fila:columna") a coordenadas % del campo. */
export function apiFootballGridToCoordinate(grid: string | null | undefined): FieldCoordinate {
  if (!grid || !grid.includes(":")) {
    return { x: 50, y: 50 };
  }

  const [rowRaw, colRaw] = grid.split(":");
  const row = Number(rowRaw);
  const col = Number(colRaw);
  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 1 || col < 1) {
    return { x: 50, y: 50 };
  }

  const maxRow = 5;
  const maxCol = 5;
  const x = 8 + ((col - 1) / Math.max(maxCol - 1, 1)) * 84;
  const y = 90 - ((row - 1) / Math.max(maxRow - 1, 1)) * 74;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}
