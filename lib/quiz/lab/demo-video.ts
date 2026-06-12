import { QUIZ_INTRO_VIDEO_SRC } from "@/lib/quiz/intro";

/** Vídeo local (mismo que entradilla quiz): evita 403 de CDNs externos en PWA. */
export const LAB_DEMO_VIDEO_SRC = QUIZ_INTRO_VIDEO_SRC;

export const LAB_DEMO_VIDEO_STOP_AT_SECONDS = 2.5;

export function isExternalLabVideoUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}
