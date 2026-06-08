import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import { PREDICTION_LOCK_MINUTES } from "@/lib/predictions/deadline";
import { QUIZ_MODULE_CONTRACT } from "@/lib/quiz/module.contract";
import { TOURNAMENT_GENERAL_SCORE_POINTS } from "@/lib/tournament-predictions/scoring";

const { exact, goalDiff, sign } = MATCH_SCORE_POINTS;
const {
  champion,
  finalists,
  topScorer,
  tournamentMvp,
  goldenGlove,
} = TOURNAMENT_GENERAL_SCORE_POINTS;

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

/** Contenido detallado del modal (normas finales alineadas con el scoring en BD). */
export const SCORING_RULES_MODAL_SECTIONS: ScoringRulesSection[] = [
  {
    id: "matches",
    title: "Cómo puntúan los partidos",
    body: [
      `Marcador exacto: +${exact} pts.`,
      `Diferencia de goles correcta (sin acertar el marcador): +${goalDiff} pts.`,
      `Signo correcto (1X2, sin acertar diferencia ni marcador): +${sign} pts.`,
      `MVP del partido acertado: +${MVP_PREDICTION_POINTS} pts adicionales, independiente del marcador.`,
      "Solo cuenta la mejor categoría del marcador (exacto, diferencia o signo); no se suman varias a la vez.",
      "Cada partido se evalúa cuando el admin publica el resultado oficial en la porra.",
    ],
  },
  {
    id: "general",
    title: "Cómo puntúan los pronósticos generales",
    body: [
      `Campeón: +${champion} pts.`,
      `Finalistas: +${finalists} pts si aciertas los dos equipos de la final (orden indiferente).`,
      `Pichichi (máximo goleador): +${topScorer} pts.`,
      `MVP del torneo: +${tournamentMvp} pts.`,
      `Guante de Oro (mejor portero): +${goldenGlove} pts.`,
      "Son pronósticos únicos: los rellenas una vez antes de que empiece el Mundial.",
      "Cada categoría puntúa de forma independiente cuando se publican los galardones oficiales.",
    ],
  },
  {
    id: "main-ranking",
    title: "Qué entra en la clasificación principal",
    body: [
      `Puntos de partidos (marcador: hasta +${exact}, +${goalDiff} o +${sign} por partido).`,
      `Puntos de MVP por partido (+${MVP_PREDICTION_POINTS} pts cada uno, suman aparte del marcador).`,
      `Puntos de pronósticos generales (hasta +${champion + finalists + topScorer + tournamentMvp + goldenGlove} pts en total).`,
      "La posición en inicio y el ranking usan la suma de partidos + MVP de partido + generales.",
    ],
  },
  {
    id: "outside-ranking",
    title: "Qué queda fuera de la clasificación principal",
    body: [
      "El quiz diario: competición paralela con su propia tabla de líderes.",
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
      "Los puntos del quiz se muestran aparte en ranking y no modifican tu posición en la porra principal.",
    ],
  },
  {
    id: "locks",
    title: "Cuándo se bloquean las ediciones",
    body: [
      `Partidos y MVP de partido: ${PREDICTION_LOCK_MINUTES} minutos antes del pitido inicial.`,
      "Pronósticos generales: al arrancar el primer partido del Mundial.",
      "A partir de ahí no podrás cambiar campeón, finalistas ni premios individuales.",
      "Partidos en juego, finalizados o ya cerrados tampoco admiten cambios.",
    ],
  },
  {
    id: "no-score",
    title: "Qué no puntúa",
    body: [
      "Fallar marcador, signo o MVP de partido: 0 pts en ese criterio.",
      "Fallar un pronóstico general o dejarlo vacío antes del bloqueo.",
      "Quiz en modo entrenamiento o intentos no competitivos.",
      "Estadísticas de grupo, calendario o exploración de plantillas.",
    ],
  },
  {
    id: "nuances",
    title: "Exacto, signo y MVP: matices",
    body: [
      `El marcador es exclusivo: si aciertas el exacto (+${exact}), no se suman además +${goalDiff} ni +${sign}.`,
      `Si fallas el marcador pero aciertas la diferencia de goles, sumas +${goalDiff} (no +${sign} de signo).`,
      `El signo (+${sign}) solo aplica cuando aciertas 1X2 sin acertar ni marcador ni diferencia.`,
      `El MVP del partido (+${MVP_PREDICTION_POINTS}) es independiente: puede sumarse aunque el marcador dé 0 pts.`,
    ],
  },
];
