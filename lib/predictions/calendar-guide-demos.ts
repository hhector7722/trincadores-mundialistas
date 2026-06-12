import type { CalendarFinishedCardVariant } from "@/lib/predictions/calendar-finished-card";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";

export type CalendarGuideEntry = {
  variant: CalendarFinishedCardVariant;
  label: string;
  pointsLabel: string;
  match: MatchWithPrediction;
};

const DEMO_KICKOFF = "2026-06-15T18:00:00.000Z";
const DEMO_HOME = "Spain";
const DEMO_AWAY = "France";
const DEMO_GROUP = "A";

function baseDemoMatch(
  overrides: Pick<
    MatchWithPrediction,
    "prediction" | "mvpPrediction" | "officialHome" | "officialAway" | "officialMvpPlayerName" | "officialMvpTeamName"
  >
): MatchWithPrediction {
  return {
    id: "calendar-guide-demo",
    home_team: DEMO_HOME,
    away_team: DEMO_AWAY,
    kickoff_at: DEMO_KICKOFF,
    status: "finished",
    matchday_name: "Grupo A · J1",
    matchday_external_key: "wc2026-md-01",
    external_match_id: null,
    match_number: 1,
    group_code: DEMO_GROUP,
    officialHome: overrides.officialHome,
    officialAway: overrides.officialAway,
    officialMvpPlayerName: overrides.officialMvpPlayerName,
    officialMvpTeamName: overrides.officialMvpTeamName,
    highlightYoutubeId: null,
    highlightPublishedAt: null,
    highlightSource: null,
    prediction: overrides.prediction,
    mvpPrediction: overrides.mvpPrediction,
    serverEditable: false,
  };
}

const OFFICIAL = { officialHome: 2, officialAway: 1, officialMvpPlayerName: "Pedri", officialMvpTeamName: DEMO_HOME };
const MVP_HIT = {
  id: "mvp-hit",
  player_name: "Pedri",
  team_name: DEMO_HOME,
  shirt_number: 8,
  points_awarded: MVP_PREDICTION_POINTS,
  updated_at: DEMO_KICKOFF,
};
const MVP_MISS = {
  id: "mvp-miss",
  player_name: "Mbappé",
  team_name: DEMO_AWAY,
  shirt_number: 10,
  points_awarded: 0,
  updated_at: DEMO_KICKOFF,
};

/** Orden: exacto+MVP → exacto → signo+MVP → signo → solo MVP → fallo. */
export const CALENDAR_GUIDE_ENTRIES: CalendarGuideEntry[] = [
  {
    variant: "exact-mvp",
    label: "Marcador exacto + MVP",
    pointsLabel: `+${MATCH_SCORE_POINTS.exact + MVP_PREDICTION_POINTS} pts`,
    match: baseDemoMatch({
      ...OFFICIAL,
      prediction: { id: "p1", home_goals: 2, away_goals: 1, points_awarded: MATCH_SCORE_POINTS.exact, updated_at: DEMO_KICKOFF },
      mvpPrediction: MVP_HIT,
    }),
  },
  {
    variant: "exact",
    label: "Marcador exacto",
    pointsLabel: `+${MATCH_SCORE_POINTS.exact} pts`,
    match: baseDemoMatch({
      ...OFFICIAL,
      prediction: { id: "p2", home_goals: 2, away_goals: 1, points_awarded: MATCH_SCORE_POINTS.exact, updated_at: DEMO_KICKOFF },
      mvpPrediction: MVP_MISS,
    }),
  },
  {
    variant: "sign-mvp",
    label: "Signo acertado + MVP",
    pointsLabel: `+${MATCH_SCORE_POINTS.sign + MVP_PREDICTION_POINTS} pts`,
    match: baseDemoMatch({
      ...OFFICIAL,
      prediction: { id: "p4", home_goals: 3, away_goals: 0, points_awarded: MATCH_SCORE_POINTS.sign, updated_at: DEMO_KICKOFF },
      mvpPrediction: MVP_HIT,
    }),
  },
  {
    variant: "sign",
    label: "Signo acertado",
    pointsLabel: `+${MATCH_SCORE_POINTS.sign} pts`,
    match: baseDemoMatch({
      ...OFFICIAL,
      prediction: { id: "p3", home_goals: 3, away_goals: 0, points_awarded: MATCH_SCORE_POINTS.sign, updated_at: DEMO_KICKOFF },
      mvpPrediction: MVP_MISS,
    }),
  },
  {
    variant: "mvp-only",
    label: "Solo MVP",
    pointsLabel: `+${MVP_PREDICTION_POINTS} pt`,
    match: baseDemoMatch({
      ...OFFICIAL,
      prediction: { id: "p5", home_goals: 0, away_goals: 2, points_awarded: MATCH_SCORE_POINTS.miss, updated_at: DEMO_KICKOFF },
      mvpPrediction: MVP_HIT,
    }),
  },
  {
    variant: "miss",
    label: "Sin acierto",
    pointsLabel: "0 pts",
    match: baseDemoMatch({
      ...OFFICIAL,
      prediction: { id: "p6", home_goals: 0, away_goals: 2, points_awarded: MATCH_SCORE_POINTS.miss, updated_at: DEMO_KICKOFF },
      mvpPrediction: MVP_MISS,
    }),
  },
];
