import { isQuizLabPath } from "@/lib/quiz/lab-access";

/** Rutas sin chrome (sin header ni TabBar). */
export function isFullscreenPath(pathname: string): boolean {
  return isQuizLabPath(pathname);
}

/** Cabecera oculta: calendario y quiz play (sin pt de header en main). */
export function isAppHeaderHidden(pathname: string): boolean {
  if (isFullscreenPath(pathname)) return true;
  return pathname.startsWith("/predictions") || pathname.startsWith("/quiz/play");
}

/** Rutas con scroll en contenedor interno: el main no añade padding inferior extra. */
export function isInternalScrollPath(pathname: string): boolean {
  if (isFullscreenPath(pathname)) return true;

  if (pathname === "/predictions" || pathname.startsWith("/predictions/")) {
    return true;
  }

  if (pathname === "/quiz" || pathname === "/quiz/leaderboard") {
    return true;
  }

  if (pathname === "/quiz/play" || pathname.startsWith("/quiz/play/")) {
    return true;
  }

  if (pathname === "/ranking" || pathname.startsWith("/ranking/")) {
    return true;
  }

  if (pathname === "/general-predictions" || pathname.startsWith("/general-predictions/")) {
    return true;
  }

  return false;
}

/** Páginas con barra inferior propia o scroll interno: sin pb en main (patrón Marbella). */
export function isAppShellScrollPage(pathname: string): boolean {
  if (isFullscreenPath(pathname)) return false;
  return isInternalScrollPath(pathname);
}

/** Rutas con scroll de documento y reserva inferior única en main. */
export function isDocumentScrollPath(pathname: string): boolean {
  if (isFullscreenPath(pathname)) return false;
  return !isAppShellScrollPage(pathname);
}
