/** Color del valor guardado en pronósticos globales (p. ej. equipo «Campeón»). */
export const GENERAL_PREDICTION_VALUE_HEX = "#CCFF00";

/** Misma tipografía/color que el valor de `GeneralPredictionRow`. */
export const GOAL_SCORER_TEXT_CLASS =
  "!text-[8px] !font-medium !leading-tight !text-[#CCFF00]";

export const goalScorerTextStyle = {
  color: GENERAL_PREDICTION_VALUE_HEX,
} as const;
