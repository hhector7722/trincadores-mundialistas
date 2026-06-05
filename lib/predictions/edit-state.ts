import type { MatchStatus } from "@/types/database";

export type PredictionUiState = "empty" | "draft" | "saved" | "locked";

export type PredictionUiInput = {
  savedHome: number | null;
  savedAway: number | null;
  draftHome: number;
  draftAway: number;
  draftDirty: boolean;
  matchStatus: MatchStatus;
  serverEditable: boolean;
};

export function resolvePredictionUiState(input: PredictionUiInput): PredictionUiState {
  if (!input.serverEditable) {
    return "locked";
  }
  const hasSaved =
    input.savedHome !== null &&
    input.savedAway !== null &&
    Number.isInteger(input.savedHome) &&
    Number.isInteger(input.savedAway);

  if (input.draftDirty || (!hasSaved && (input.draftHome > 0 || input.draftAway > 0))) {
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