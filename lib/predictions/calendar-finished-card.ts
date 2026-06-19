import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  isMvpPredictionCorrect,
  resolveScoreOutcome,
  type ScoreOutcome,
} from "@/lib/predictions/prediction-outcome";

export type CalendarFinishedCardVariant =
  | "exact"
  | "exact-mvp"
  | "sign"
  | "sign-mvp"
  | "mvp-only"
  | "miss";

/** Partido pasado: desatura banderas, grupo y marcador oficial (iconos de acierto a color pleno). */
export const CAL_FINISHED_OUTER_MUTED_CLASS =
  "[&_.tm-cal-flags_.tm-cal-flag]:opacity-60 [&_.tm-cal-flags_.tm-cal-flag]:saturate-50 [&_.tm-cal-match-group-badge]:opacity-60 [&_.tm-cal-match-group-badge]:saturate-50 [&_.tm-cal-match-subtitle]:opacity-60 [&_.tm-cal-match-subtitle]:saturate-50 [&_.tm-cal-flags_.tm-cal-prediction]:opacity-60 [&_.tm-cal-flags_.tm-cal-prediction]:saturate-50";

export type CalendarFinishedCardState = {
  variant: CalendarFinishedCardVariant;
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
  hasPrediction: boolean;
};

function hasOfficialScore(match: MatchWithPrediction): boolean {
  return (
    match.officialHome != null &&
    match.officialAway != null &&
    Number.isInteger(match.officialHome) &&
    Number.isInteger(match.officialAway)
  );
}

function hasSavedPrediction(match: MatchWithPrediction): boolean {
  const home = match.prediction?.home_goals ?? null;
  const away = match.prediction?.away_goals ?? null;
  return home !== null && away !== null && Number.isInteger(home) && Number.isInteger(away);
}

export function resolveCalendarFinishedCard(
  match: MatchWithPrediction,
): CalendarFinishedCardState | null {
  if (match.status !== "finished" || !hasOfficialScore(match)) return null;

  const hasPrediction = hasSavedPrediction(match);
  const scoreOutcome = hasPrediction
    ? resolveScoreOutcome({
        predictedHome: match.prediction!.home_goals,
        predictedAway: match.prediction!.away_goals,
        resultHome: match.officialHome!,
        resultAway: match.officialAway!,
      })
    : null;

  const mvpCorrect =
    !!match.mvpPrediction?.player_name &&
    isMvpPredictionCorrect(
      match.mvpPrediction.player_name,
      match.mvpPrediction.team_name,
      match.officialMvpPlayerName,
      match.officialMvpTeamName,
    );

  let variant: CalendarFinishedCardVariant;
  if (scoreOutcome === "exact" && mvpCorrect) variant = "exact-mvp";
  else if (scoreOutcome === "exact") variant = "exact";
  else if (scoreOutcome === "sign" && mvpCorrect) variant = "sign-mvp";
  else if (scoreOutcome === "sign") variant = "sign";
  else if (mvpCorrect) variant = "mvp-only";
  else variant = "miss";

  return {
    variant,
    scoreOutcome,
    mvpCorrect,
    hasPrediction,
  };
}
