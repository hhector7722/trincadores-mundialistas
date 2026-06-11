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

export type CalendarFinishedCardState = {
  variant: CalendarFinishedCardVariant;
  scoreOutcome: ScoreOutcome | null;
  mvpCorrect: boolean;
  hasPrediction: boolean;
  showPredictedInKickoffSlot: boolean;
  showMvpKickoffLabel: boolean;
  showGreenFill: boolean;
  showSignMvpDoubleBorder: boolean;
  showExactScoreStyle: boolean;
  showGroupLetterBadge: boolean;
  groupRowIcon: "tick" | "cross" | null;
  groupRowMvpLabel: boolean;
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

  const isExact = variant === "exact" || variant === "exact-mvp";

  return {
    variant,
    scoreOutcome,
    mvpCorrect,
    hasPrediction,
    showPredictedInKickoffSlot: !isExact && variant !== "mvp-only",
    showMvpKickoffLabel: variant === "mvp-only",
    showGreenFill: isExact,
    showSignMvpDoubleBorder: variant === "sign-mvp",
    showExactScoreStyle: isExact,
    showGroupLetterBadge: isExact,
    groupRowIcon:
      variant === "sign"
        ? "tick"
        : variant === "miss" || variant === "mvp-only"
          ? "cross"
          : null,
    groupRowMvpLabel: variant === "exact-mvp" || variant === "sign-mvp",
  };
}
