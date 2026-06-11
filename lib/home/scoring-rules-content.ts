import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import { PREDICTION_LOCK_MINUTES } from "@/lib/predictions/deadline";
import { TOURNAMENT_GENERAL_SCORE_POINTS } from "@/lib/tournament-predictions/scoring";

const { exact, sign } = MATCH_SCORE_POINTS;
const {
  champion,
  finalistSingle,
  finalists,
  topScorer,
  tournamentMvp,
  goldenGlove,
} = TOURNAMENT_GENERAL_SCORE_POINTS;
const maxPerMatch = exact + MVP_PREDICTION_POINTS;

export type ScoringRulesCardLine =
  | { kind: "points"; label: string; points: string }
  | { kind: "note"; text: string };

/** Resumen visible en las cards de inicio (solo partidos). */
export const SCORING_RULES_CARD_LINES: ScoringRulesCardLine[] = [
  { kind: "points", label: "Marcador exacto", points: `+${exact} pts` },
  { kind: "points", label: "Acierto 1 x 2", points: `+${sign} pts` },
  { kind: "points", label: "MVP", points: `+${MVP_PREDICTION_POINTS} pts` },
];

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
      `Finalistas — un equipo acertado: +${finalistSingle} pts.`,
      `Finalistas — los dos equipos acertados: +${finalists} pts.`,
      `Máximo goleador: +${topScorer} pts.`,
      `MVP: +${tournamentMvp} pts.`,
      `Mejor portero: +${goldenGlove} pts.`,
    ],
  },
  {
    id: "matches",
    title: "Puntuación",
    body: [
      `Acierto exacto del marcador: +${exact} pts.`,
      `Acierto del signo 1 x 2: +${sign} pts.`,
      `MVP: +${MVP_PREDICTION_POINTS} pt.`,
      "Acertar marcador exacto y signo no suma",
      `Puntos máximos por partido: +${maxPerMatch} pts (marcador exacto + MVP).`,
    ],
  },
  {
    id: "quiz",
    title: "Quiz",
    body: [
      "Puntuación y clasificación independiente.",
      "Al final del torneo se añadirán estos puntos extras a la competición principal:",
      "1º: +5 pts.",
      "2º: +3 pts.",
      "3º: +2 pts.",
      "4º: +1 pts.",
    ],
  },
  {
    id: "locks",
    title: "Límite para pronosticar",
    body: [
      `Partidos y MVP de partido: ${PREDICTION_LOCK_MINUTES} minutos antes del pitido.`,
      "Pronósticos pre-torneo: al arrancar el primer partido del Mundial.",
      "Partidos en juego, finalizados o ya cerrados no admiten cambios.",
    ],
  },
];
