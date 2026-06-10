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

/** Altura fija del panel de posibles alineaciones (sin pie de guardado). */
export const MVP_MODAL_PANEL_CLASS = "h-[min(calc(100dvh-4rem),27rem)]";

/** Panel MVP con botón guardar: más alto para no recortar campo ni suplentes. */
export const MVP_MODAL_PICK_PANEL_CLASS = "h-[min(calc(100dvh-3.5rem),29rem)]";
