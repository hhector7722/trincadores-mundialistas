export type CalendarModalOpenOptions = {
  fromDataAccess?: boolean;
  reopenDataAccess?: () => void;
  stackElevated?: boolean;
};

export type CalendarModalOpener = (options?: CalendarModalOpenOptions) => void;

/** Panel: misma altura en menú «Ver datos» y en Clasificaciones / Estadísticas / Plantillas. */
export const CALENDAR_DATA_ACCESS_MODAL_PANEL_CLASS =
  "flex h-[min(72dvh,calc(100dvh-4rem))] max-h-[min(72dvh,calc(100dvh-4rem))] flex-col";

/** Ancho compartido: cabe en viewport con margen y queda centrado por `Modal`. */
export const CALENDAR_DATA_ACCESS_MODAL_WRAPPER_CLASS =
  "w-full max-w-[min(100vw-2rem,28rem)]";
