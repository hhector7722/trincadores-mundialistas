/** Bump al sustituir `public/icons/goya.png` para invalidar caché del navegador/CDN. */
export const GOYA_FIELD_ASSET_VERSION = "20260608";

export const GOYA_FIELD_SRC = `/icons/goya.png?v=${GOYA_FIELD_ASSET_VERSION}`;

/** Ancho fijo del campo táctico en modal (evita colapso de `w-max` durante carga). */
export const LINEUP_MODAL_FIELD_WIDTH_CLASS = "w-[min(98vw,18.5rem)]";

/** Modal plantilla: mismo ancho que el campo (~18.5rem). */
export const LINEUP_MODAL_WRAPPER_CLASS = LINEUP_MODAL_FIELD_WIDTH_CLASS;

/** Panel plantilla: altura al contenido, ancho fijo al campo. */
export const LINEUP_MODAL_PANEL_CLASS = `h-auto ${LINEUP_MODAL_FIELD_WIDTH_CLASS}`;

export const LINEUP_MODAL_PANEL_HOST_CLASS = LINEUP_MODAL_FIELD_WIDTH_CLASS;

/** Modal detalle jugador: mismo ancho que plantilla para layout homogéneo. */
export const PLAYER_MODAL_WRAPPER_CLASS = LINEUP_MODAL_WRAPPER_CLASS;

export const PLAYER_MODAL_PANEL_CLASS = LINEUP_MODAL_PANEL_CLASS;

export const PLAYER_MODAL_PANEL_HOST_CLASS = LINEUP_MODAL_PANEL_HOST_CLASS;

/** Modal MVP: dos equipos en campo horizontal. */
export const MVP_MODAL_WRAPPER_CLASS = "max-w-[min(100vw-1rem,32rem)]";

/** Altura del viewport táctico (preview / posibles alineaciones). */
export const MVP_MODAL_FIELD_HEIGHT_REM = 27;

/** Pie fijo del modal MVP (botón guardar); se suma sin reducir el campo. */
export const MVP_MODAL_SAVE_FOOTER_REM = 2.25;

/** Panel elección MVP: viewport táctico + pie de guardado. */
export const MVP_MODAL_PICK_PANEL_CLASS = `h-[min(calc(100dvh-3.5rem),calc(${MVP_MODAL_FIELD_HEIGHT_REM}rem+${MVP_MODAL_SAVE_FOOTER_REM}rem))]`;

/** Panel posibles alineaciones: mismo tamaño exterior que MVP (sin pie de guardar). */
export const POSSIBLE_LINEUPS_MODAL_PANEL_CLASS = MVP_MODAL_PICK_PANEL_CLASS;

/** @deprecated Usar POSSIBLE_LINEUPS_MODAL_PANEL_CLASS */
export const MVP_MODAL_PANEL_CLASS = POSSIBLE_LINEUPS_MODAL_PANEL_CLASS;

/** Cuerpo táctico MVP (panel menos cabecera y pie). */
export const MVP_MODAL_FIELD_BODY_HEIGHT_REM = 25;
export const MVP_MODAL_FIELD_BODY_CLASS = `h-[min(calc(100dvh-6.5rem),${MVP_MODAL_FIELD_BODY_HEIGHT_REM}rem)] w-full shrink-0`;

/** Cuerpo posibles alineaciones: ocupa el hueco del campo + pie del modal MVP. */
export const POSSIBLE_LINEUPS_FIELD_BODY_CLASS =
  "min-h-0 flex-1 w-full";
