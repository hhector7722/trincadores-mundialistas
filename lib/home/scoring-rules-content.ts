import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import { PREDICTION_LOCK_MINUTES } from "@/lib/predictions/deadline";
import { QUIZ_MODULE_CONTRACT } from "@/lib/quiz/module.contract";

/** Resumen visible en la card de inicio (máx. 6 líneas). */
export const SCORING_RULES_CARD_SUMMARY = [
  "Pronósticos generales.",
  "Campeón, finalistas, Pichichi, MVP y Guante de oro.",
  "Partidos: exacto, signo y MVP.",
  "El exacto no suma el signo aparte.",
  "El quiz va aparte.",
  "Todo queda bloqueado al empezar el Mundial.",
] as const;

export type ScoringRulesSection = {
  id: string;
  title: string;
  body: string[];
};

/** Contenido detallado del modal. */
export const SCORING_RULES_MODAL_SECTIONS: ScoringRulesSection[] = [
  {
    id: "matches",
    title: "Cómo puntúan los partidos",
    body: [
      `Marcador exacto: +${MATCH_SCORE_POINTS.exact} pts.`,
      `Diferencia de goles correcta (sin acertar el marcador): +${MATCH_SCORE_POINTS.goalDiff} pts.`,
      `Signo correcto (1X2, sin acertar diferencia ni marcador): +${MATCH_SCORE_POINTS.sign} pts.`,
      `MVP del partido acertado: +${MVP_PREDICTION_POINTS} pts adicionales, independiente del marcador.`,
      "Cada partido se evalúa cuando hay resultado oficial en la porra.",
    ],
  },
  {
    id: "general",
    title: "Cómo puntúan los pronósticos generales",
    body: [
      "Campeón del Mundial, los dos finalistas, Pichichi (máximo goleador), MVP del torneo y Guante de Oro (mejor portero).",
      "Son pronósticos únicos para todo el torneo: los rellenas una vez en inicio.",
      "Se resuelven al cierre del Mundial con los galardones y datos oficiales FIFA.",
      "Cuando se publiquen los ganadores reales, se aplicarán los puntos correspondientes a la clasificación principal.",
    ],
  },
  {
    id: "main-ranking",
    title: "Qué entra en la clasificación principal",
    body: [
      "Puntos de todos los partidos (marcador).",
      `Puntos de MVP por partido (+${MVP_PREDICTION_POINTS} pts cada uno).`,
      "Pronósticos generales del torneo, una vez resueltos.",
      "La tabla de ranking y tu posición en inicio usan esta suma acumulada.",
    ],
  },
  {
    id: "outside-ranking",
    title: "Qué queda fuera de la clasificación principal",
    body: [
      "El quiz diario: tiene su propio marcador y tabla de líderes.",
      "Los intentos de entrenamiento del quiz: sirven para practicar, no suman en ningún ranking.",
      "Actividad, logros o estadísticas del torneo: informativos, no alteran la porra.",
    ],
  },
  {
    id: "quiz",
    title: "Cómo funciona el quiz (competición paralela)",
    body: [
      `Cada día hay un quiz oficial con hasta ${QUIZ_MODULE_CONTRACT.maxPointsPerAttempt} pts por intento competitivo.`,
      "El modo competitivo cuenta para el ranking del quiz; un intento enviado bloquea repetir ese día.",
      "El modo entrenamiento permite rejugar sin puntuar.",
      "Los puntos del quiz se muestran aparte en ranking: no modifican tu posición en la porra principal.",
    ],
  },
  {
    id: "locks",
    title: "Cuándo se bloquean las ediciones",
    body: [
      `Partidos y MVP de partido: ${PREDICTION_LOCK_MINUTES} minutos antes del pitido inicial.`,
      "Pronósticos generales: al arrancar el primer partido del Mundial (cuando empieza la competición).",
      "A partir de ahí no podrás cambiar campeón, finalistas ni premios individuales.",
      "Predicciones ya cerradas o partidos en juego o finalizados tampoco admiten cambios.",
    ],
  },
  {
    id: "no-score",
    title: "Qué no puntúa",
    body: [
      "Fallar marcador, signo o MVP: 0 pts en ese criterio.",
      "Dejar un partido o pronóstico general sin rellenar antes del bloqueo.",
      "Quiz en modo entrenamiento o intentos no competitivos.",
      "Estadísticas de grupo, calendario o exploración de plantillas: no generan puntos de porra.",
    ],
  },
  {
    id: "nuances",
    title: "Exacto, signo y MVP: matices",
    body: [
      "El marcador es exclusivo: si aciertas el exacto (+8), no se suman además los +5 de diferencia ni los +3 de signo.",
      "Si fallas el marcador pero aciertas la diferencia de goles, sumas +5 (no +3 de signo).",
      "El signo (+3) solo aplica cuando aciertas 1X2 sin acertar ni marcador ni diferencia.",
      `El MVP del partido (+${MVP_PREDICTION_POINTS}) es independiente: puede sumarse a cualquier resultado del marcador, incluso con 0 pts en goles.`,
    ],
  },
];
