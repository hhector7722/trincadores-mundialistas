/**
 * Escala visual del contenedor del terreno en modales.
 * Solo reduce el SVG del campo; las fichas conservan su tamaño de referencia.
 */
export const MODAL_FIELD_CONTAINER_SCALE = 0.8;

export function scaleModalFieldContainer(
  widthPx: number,
  heightPx: number,
  scale: number = MODAL_FIELD_CONTAINER_SCALE
): {
  widthPx: number;
  heightPx: number;
  referenceWidthPx: number;
  referenceHeightPx: number;
} {
  const scaledHeightPx = Math.round(heightPx * scale * 10) / 10;
  const aspect = widthPx / heightPx;
  const scaledWidthPx = Math.round(scaledHeightPx * aspect * 10) / 10;

  return {
    referenceWidthPx: widthPx,
    referenceHeightPx: heightPx,
    widthPx: scaledWidthPx,
    heightPx: scaledHeightPx,
  };
}
