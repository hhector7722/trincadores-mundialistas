import { LayoutElementInput, TacticalBand } from "./types";

/**
 * Agrupa a los jugadores en "bandas" (líneas tácticas) basándose en su coordenada Y de referencia y su rol.
 * No asume que hay 4 bandas fijas. Detectará tantas como variaciones significativas de Y haya.
 */
export function detectTacticalBands(inputs: LayoutElementInput[], isAwayHalf: boolean): TacticalBand[] {
  if (inputs.length === 0) return [];

  // Clonar para ordenar sin mutar la entrada
  const sorted = [...inputs].sort((a, b) => {
    // Si estamos en la mitad visitante, atacamos hacia abajo, portería está arriba (Y menor)
    // Si local, atacamos hacia arriba, portería está abajo (Y mayor)
    // Ordenamos siempre desde portería hacia el ataque para la indexación.
    if (isAwayHalf) {
      return a.referenceY - b.referenceY;
    } else {
      return b.referenceY - a.referenceY;
    }
  });

  const bands: TacticalBand[] = [];
  let currentBandElements: LayoutElementInput[] = [sorted[0]];
  let currentBandY = sorted[0].referenceY;

  // Umbral de agrupamiento: si la diferencia en Y es menor a 8 (sobre 100), se consideran la misma banda
  const BAND_TOLERANCE = 8;

  for (let i = 1; i < sorted.length; i++) {
    const player = sorted[i];
    const diff = Math.abs(player.referenceY - currentBandY);

    if (diff <= BAND_TOLERANCE) {
      currentBandElements.push(player);
      // Actualizar el Y promedio de la banda para no derivar demasiado
      currentBandY =
        currentBandElements.reduce((acc, el) => acc + el.referenceY, 0) /
        currentBandElements.length;
    } else {
      // Ordenamos la banda actual horizontalmente de izquierda a derecha (0 a 100)
      currentBandElements.sort((a, b) => a.referenceX - b.referenceX);
      
      bands.push({
        id: `band-${bands.length}`,
        depthOrder: bands.length,
        elements: currentBandElements.map((p) => p.id),
      });

      // Nueva banda
      currentBandElements = [player];
      currentBandY = player.referenceY;
    }
  }

  // Push final
  if (currentBandElements.length > 0) {
    currentBandElements.sort((a, b) => a.referenceX - b.referenceX);
    bands.push({
      id: `band-${bands.length}`,
      depthOrder: bands.length,
      elements: currentBandElements.map((p) => p.id),
    });
  }

  return bands;
}
