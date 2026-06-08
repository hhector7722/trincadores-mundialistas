import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import { PREDICTION_LOCK_MINUTES } from "@/lib/predictions/deadline";
import { QUIZ_MODULE_CONTRACT } from "@/lib/quiz/module.contract";
import { TOURNAMENT_GENERAL_SCORE_POINTS } from "@/lib/tournament-predictions/scoring";

const { exact, sign } = MATCH_SCORE_POINTS;
const {
  champion,
  finalists,
  topScorer,
  tournamentMvp,
  goldenGlove,
} = TOURNAMENT_GENERAL_SCORE_POINTS;
const maxPreTournament =
  champion + finalists + topScorer + tournamentMvp + goldenGlove;
const maxPerMatch = exact + MVP_PREDICTION_POINTS;

/** Resumen visible en la card de inicio (solo partidos). */
export const SCORING_RULES_CARD_SUMMARY = [
  `Marcador exacto +${exact} pts`,
  `Acierto del signo (1x2) +${sign} pts`,
  `MVP del partido +${MVP_PREDICTION_POINTS} pts`,
  "Exacto ya incluye signo",
] as const;

export type ScoringRulesSection = {
  id: string;
  title: string;
  body: string[];
};

/** Secciones del modal (una por pantalla, navegación por deslizamiento). */
export const SCORING_RULES_MODAL_SECTIONS: ScoringRulesSection[] = [
  {
    id: "pre-tournament",
    title: "Pronósticos pre-torneo",
    body: [
      `Campeón: +${champion} pts.`,
      `Finalistas: +${finalists} pts si aciertas los dos equipos de la final (orden indiferente).`,
      `Máximo goleador (Pichichi): +${topScorer} pts.`,
      `MVP del torneo: +${tournamentMvp} pts.`,
      `Mejor portero (Guante de Oro): +${goldenGlove} pts.`,
      "Los rellenas una vez antes de que empiece el Mundial.",
      "Cada categoría puntúa de forma independiente al publicarse el galardón oficial.",
    ],
  },
  {
    id: "matches",
    title: "Pronósticos de partido",
    body: [
      `Acierto exacto del marcador: +${exact} pts.`,
      `Acierto del signo (1X2), sin marcador exacto: +${sign} pts.`,
      `MVP del partido acertado: +${MVP_PREDICTION_POINTS} pt, independiente del marcador.`,
      "El exacto ya incluye el signo: si aciertas el marcador, no se suma el signo aparte.",
      "Cada partido se evalúa cuando el admin publica el resultado oficial.",
    ],
  },
  {
    id: "main-ranking",
    title: "Clasificación principal",
    body: [
      `Pronósticos pre-torneo (hasta +${maxPreTournament} pts).`,
      `Pronósticos de partido (hasta +${exact} o +${sign} por partido).`,
      `MVP de partido (+${MVP_PREDICTION_POINTS} pt por acierto, suma aparte).`,
      "Tu posición en inicio y el ranking usan solo esta suma.",
    ],
  },
  {
    id: "outside-ranking",
    title: "Fuera de la clasificación principal",
    body: [
      "El quiz diario: competición paralela con su propia tabla.",
      "Entrenamiento del quiz: practica sin puntuar.",
      "Actividad, logros y estadísticas del torneo: informativos.",
    ],
  },
  {
    id: "quiz",
    title: "Quiz (competición paralela)",
    body: [
      `Hasta ${QUIZ_MODULE_CONTRACT.maxPointsPerAttempt} pts por intento competitivo del día.`,
      "Un intento enviado bloquea repetir ese día en modo competitivo.",
      "El entrenamiento permite rejugar sin sumar.",
      "Los puntos del quiz no modifican tu posición en la porra principal.",
    ],
  },
  {
    id: "locks",
    title: "Cuándo se bloquean las ediciones",
    body: [
      `Partidos y MVP de partido: ${PREDICTION_LOCK_MINUTES} minutos antes del pitido.`,
      "Pronósticos pre-torneo: al arrancar el primer partido del Mundial.",
      "Partidos en juego, finalizados o ya cerrados no admiten cambios.",
    ],
  },
  {
    id: "no-score",
    title: "Qué no puntúa",
    body: [
      "Fallar marcador, signo o MVP de partido.",
      "Dejar vacío un pronóstico antes del bloqueo.",
      "Quiz en entrenamiento o intentos no competitivos.",
      "Explorar calendario, grupos o plantillas.",
    ],
  },
  {
    id: "nuances",
    title: "Exacto, signo y MVP",
    body: [
      `Exacto (+${exact}) y signo (+${sign}) son excluyentes: nunca se suman los dos en el mismo partido.`,
      `El MVP (+${MVP_PREDICTION_POINTS} pt) sí suma aparte, incluso si el marcador da 0 pts.`,
      `Máximo teórico por partido: +${maxPerMatch} pts (exacto + MVP).`,
    ],
  },
];
