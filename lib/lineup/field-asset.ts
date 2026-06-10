/** Bump al sustituir `public/icons/goya.png` para invalidar caché del navegador/CDN. */
export const GOYA_FIELD_ASSET_VERSION = "20260608";

export const GOYA_FIELD_SRC = `/icons/goya.png?v=${GOYA_FIELD_ASSET_VERSION}`;

/** Modal plantilla: ancho al contenido del campo (~18.5rem). */
export const LINEUP_MODAL_WRAPPER_CLASS = "w-max max-w-[min(100vw-1rem,20rem)]";

/** Panel plantilla: altura al contenido, sin estirar al viewport. */
export const LINEUP_MODAL_PANEL_CLASS = "h-auto w-max";

export const LINEUP_MODAL_PANEL_HOST_CLASS = "w-max";

/** Modal MVP: dos equipos en campo horizontal. */
export const MVP_MODAL_WRAPPER_CLASS = "max-w-[min(100vw-1rem,32rem)]";
