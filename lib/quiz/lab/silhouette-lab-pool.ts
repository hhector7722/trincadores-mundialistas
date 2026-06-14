/** Momentos fáciles para silueta en el laboratorio (sin Martínez: demasiado obvio). */
export const SILHOUETTE_LAB_MOMENT_IDS = [
  "wc1997-roberto-carlos-freekick",
  "wc2014-van-persie-flying-header",
  "wc2010-spain-xi-silhouette",
  "wc2014-james-volley",
  "wc2022-dimaria-cup-kiss",
  "wc1994-stoichkov-greece",
  "wc2006-zidane-trophy-walk",
  "wc1994-baggio-penalty",
  "wc1990-schillaci-celebration",
  "wc1994-bebeto-celebration",
  "wc1978-kempes-celebration",
  "wc1982-tardelli-goal",
] as const;

export type SilhouetteLabMomentId = (typeof SILHOUETTE_LAB_MOMENT_IDS)[number];

export const SILHOUETTE_LAB_MOMENT_ID_SET = new Set<string>(SILHOUETTE_LAB_MOMENT_IDS);

/**
 * Momentos con silueta JPG commiteada en public/images/quiz/lab/generated/.
 * Actualizar al importar nuevas siluetas ChatGPT.
 */
export const SILHOUETTE_LAB_READY_IDS = [
  "wc1997-roberto-carlos-freekick",
  "wc2014-van-persie-flying-header",
  "wc2010-spain-xi-silhouette",
  "wc2014-james-volley",
  "wc2022-dimaria-cup-kiss",
  "wc1994-stoichkov-greece",
  "wc2006-zidane-trophy-walk",
] as const;

export const SILHOUETTE_LAB_READY_ID_SET = new Set<string>(SILHOUETTE_LAB_READY_IDS);

export function isSilhouetteLabReadyMoment(momentId: string): boolean {
  return SILHOUETTE_LAB_READY_ID_SET.has(momentId);
}
