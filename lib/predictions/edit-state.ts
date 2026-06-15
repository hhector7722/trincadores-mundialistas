import type { MatchStatus } from "@/types/database";

export type PredictionUiState = "empty" | "draft" | "saved" | "locked";

export type PredictionUiInput = {
  savedHome: number | null;
  savedAway: number | null;
  draftHome: number | null;
  draftAway: number | null;
  draftDirty: boolean;
  matchStatus: MatchStatus;
  serverEditable: boolean;
};

export function hasFilledPredictionScore(
  home: number | null,
  away: number | null
): boolean {
  return (
    home !== null &&
    away !== null &&
    Number.isInteger(home) &&
    Number.isInteger(away)
  );
}

export function resolvePredictionUiState(input: PredictionUiInput): PredictionUiState {
  if (!input.serverEditable) {
    return "locked";
  }
  const hasSaved = hasFilledPredictionScore(input.savedHome, input.savedAway);
  const hasDraftScore = hasFilledPredictionScore(input.draftHome, input.draftAway);

  if (input.draftDirty || (!hasSaved && hasDraftScore)) {
    return "draft";
  }
  if (hasSaved) {
    return "saved";
  }
  return "empty";
}

/** Marcador guardado (incluye 0-0). */
export function displayGoals(home: number, away: number): string {
  return `${home} - ${away}`;
}

export const NO_PREDICTION_LABEL = "—";

export function formatListScore(
  savedHome: number | null,
  savedAway: number | null
): string {
  if (
    savedHome === null ||
    savedAway === null ||
    !Number.isInteger(savedHome) ||
    !Number.isInteger(savedAway)
  ) {
    return NO_PREDICTION_LABEL;
  }
  return displayGoals(savedHome, savedAway);
}