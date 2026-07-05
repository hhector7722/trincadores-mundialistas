import { LayoutConstraints, LayoutPosition } from "./types";

export type CollisionIssue =
  | { type: "out-of-bounds"; id: string }
  | { type: "overlap"; id1: string; id2: string };

/**
 * Detecta si existe alguna colisión dado un layout y una escala.
 * Responsabilidad estricta: sólo detecta, no resuelve.
 */
export function detectCollisions(
  positions: LayoutPosition[],
  chipScale: number,
  constraints: LayoutConstraints
): CollisionIssue[] {
  const issues: CollisionIssue[] = [];

  // Tamaño absoluto del chip y texto
  const chipW = constraints.chipSize.baseWidth * chipScale;
  const chipH = constraints.chipSize.baseHeight * chipScale;
  const textH = constraints.nameAreaBounds.height * chipScale;
  
  // Altura total del elemento (camiseta + texto)
  // Asumimos que el texto está justo debajo
  const totalH = chipH + textH;

  // Las coordenadas de las posiciones están en 0-100 relativas al fieldBounds o a todo el contenedor?
  // Normalmente X e Y son porcentajes (0-100) sobre el ancho y alto total del layout de ese equipo.
  // Pero necesitamos convertirlas a las mismas unidades que la base.
  // En un layout de React % es % del ancho. Para que funcione genéricamente, necesitamos saber el aspect ratio o pixel size absoluto.
  // Podemos asumir que 0-100 es un porcentaje y chipW/chipH/textH también están expresados en porcentajes del ancho/alto, 
  // o que fieldBounds nos da el espacio total real en píxeles/unidades y podemos hacer cálculos precisos.
  // Para hacerlo puro, vamos a asumir que todos los valores están normalizados a una "unidad global" (ej. viewport).
  // Si chipW=10, significa 10%.
  
  const b = constraints.fieldBounds || { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
  
  // Detectar límites
  for (const pos of positions) {
    const minX = pos.x - (chipW / 2) - constraints.margins.side;
    const maxX = pos.x + (chipW / 2) + constraints.margins.side;
    const minY = pos.y - (chipH / 2) - constraints.margins.vertical; 
    const maxY = pos.y + (chipH / 2) + textH + constraints.margins.vertical;

    // Check bounds
    if (minX < b.xMin || maxX > b.xMax || minY < b.yMin || maxY > b.yMax) {
      issues.push({ type: "out-of-bounds", id: pos.id });
    }
  }

  // Detectar solapamientos (n^2)
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];

      const dx = Math.abs(p1.x - p2.x);
      const dy = Math.abs(p1.y - p2.y);

      // Si la distancia horizontal es menor al ancho y la vertical menor a la altura total, hay solapamiento
      // Le damos un pequeño margen extra con spacing.minHorizontal
      const minHDist = chipW + constraints.spacing.minHorizontal;
      const minVDist = totalH + constraints.spacing.minVertical;

      if (dx < minHDist && dy < minVDist) {
        issues.push({ type: "overlap", id1: p1.id, id2: p2.id });
      }
    }
  }

  return issues;
}
