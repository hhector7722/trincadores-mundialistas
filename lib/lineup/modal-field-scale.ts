/**
 * Escala visual del contenedor táctico completo (SVG + fichas).
 * Aplicar solo al wrapper relativo que define el sistema de coordenadas %.
 */
export const MODAL_FIELD_WRAPPER_SCALE = 0.88;

/** @deprecated Usar MODAL_FIELD_WRAPPER_SCALE en el wrapper, no en el SVG aislado. */
export const MODAL_PITCH_DECOR_SCALE = MODAL_FIELD_WRAPPER_SCALE;

/**
 * Colapsa el hueco inferior que deja `scale()` con `transform-origin: top`
 * en un contenedor con aspect ratio 68:105 (el % es relativo al ancho del padre).
 */
export function modalFieldScaleBottomTrim(scale = MODAL_FIELD_WRAPPER_SCALE): string {
  return `calc((1 - ${scale}) * 105 / 68 * -100%)`;
}
