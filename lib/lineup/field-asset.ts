/** Bump al sustituir `public/icons/goya.png` para invalidar caché del navegador/CDN. */
export const GOYA_FIELD_ASSET_VERSION = "20260608";

export const GOYA_FIELD_SRC = `/icons/goya.png?v=${GOYA_FIELD_ASSET_VERSION}`;

/** Ancho fijo del campo táctico en modal (evita colapso de `w-max` durante carga). */
export const LINEUP_MODAL_FIELD_WIDTH_CLASS = "w-[min(98vw,28rem)]";

/** Ancho nominal del campo en modal plantilla. */
export const LINEUP_MODAL_FIELD_WIDTH_PX = 448; // max-w-md is 448px

/** Modal plantilla: mismo ancho que el campo. */
export const LINEUP_MODAL_WRAPPER_CLASS = "w-[min(100vw-1rem,28rem)]";

/** Panel plantilla: altura flexible, ocupa toda la pantalla disponible. */
export const LINEUP_MODAL_PANEL_CLASS = `h-[85vh] min-h-[500px] w-full max-w-md flex flex-col`;

export const LINEUP_MODAL_PANEL_HOST_CLASS = "w-full max-w-md";

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

/** Pie del modal MVP (botón guardar). */
export const MVP_MODAL_FOOTER_HEIGHT_REM = MVP_MODAL_SAVE_FOOTER_REM;

/** Panel elección MVP: altura fija (cuerpo táctico + pie). */
export const MVP_MODAL_PICK_PANEL_CLASS = `h-[min(calc(100dvh-3.5rem),calc(${MVP_MODAL_FIELD_HEIGHT_REM}rem+${MVP_MODAL_SAVE_FOOTER_REM}rem))] min-h-[min(calc(100dvh-3.5rem),calc(${MVP_MODAL_FIELD_HEIGHT_REM}rem+${MVP_MODAL_SAVE_FOOTER_REM}rem))]`;

/** Panel posibles alineaciones: mismo cuerpo táctico que MVP (sin pie). */
export const POSSIBLE_LINEUPS_MODAL_PANEL_CLASS = `h-[min(calc(100dvh-3.5rem),${MVP_MODAL_FIELD_HEIGHT_REM}rem)] min-h-[min(calc(100dvh-3.5rem),${MVP_MODAL_FIELD_HEIGHT_REM}rem)]`;

/** @deprecated Usar POSSIBLE_LINEUPS_MODAL_PANEL_CLASS */
export const MVP_MODAL_PANEL_CLASS = POSSIBLE_LINEUPS_MODAL_PANEL_CLASS;

/** Cuerpo táctico compartido (MVP y posibles alineaciones). */
export const MVP_MODAL_FIELD_BODY_HEIGHT_REM = 25;
