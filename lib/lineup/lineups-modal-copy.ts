import type { ResolvedLineup } from "@/lib/lineup/types";

export function areMatchLineupsFullyConfirmed(
  homeLineup: ResolvedLineup | null | undefined,
  awayLineup: ResolvedLineup | null | undefined,
): boolean {
  return homeLineup?.sourceKind === "confirmed" && awayLineup?.sourceKind === "confirmed";
}

export const CONFIRMED_LINEUPS_MODAL_TITLE = "ALINEACIONES CONFIRMADAS";
export const POSSIBLE_LINEUPS_MODAL_TITLE = "POSIBLES ALINEACIONES";
export const CONFIRMED_LINEUPS_ACTION_CAPTION = "Alineaciones confirmadas";
export const POSSIBLE_LINEUPS_ACTION_CAPTION = "Posibles alineaciones";

export function possibleLineupsModalTitle(
  homeLineup: ResolvedLineup | null | undefined,
  awayLineup: ResolvedLineup | null | undefined,
): string {
  return areMatchLineupsFullyConfirmed(homeLineup, awayLineup)
    ? CONFIRMED_LINEUPS_MODAL_TITLE
    : POSSIBLE_LINEUPS_MODAL_TITLE;
}

export function possibleLineupsActionCaption(
  homeLineup: ResolvedLineup | null | undefined,
  awayLineup: ResolvedLineup | null | undefined,
): string {
  return areMatchLineupsFullyConfirmed(homeLineup, awayLineup)
    ? CONFIRMED_LINEUPS_ACTION_CAPTION
    : POSSIBLE_LINEUPS_ACTION_CAPTION;
}

export function possibleLineupsActionCaptionFromConfirmed(bothConfirmed: boolean): string {
  return bothConfirmed ? CONFIRMED_LINEUPS_ACTION_CAPTION : POSSIBLE_LINEUPS_ACTION_CAPTION;
}

export const LIVE_LINEUPS_MODAL_TITLE = "ALINEACIONES";
export const LIVE_LINEUPS_ACTION_CAPTION = "ALINEACIONES";

export function lineupsActionCaption(options: {
  bothConfirmed: boolean;
  isLive: boolean;
}): string {
  if (options.isLive) return LIVE_LINEUPS_ACTION_CAPTION;
  return possibleLineupsActionCaptionFromConfirmed(options.bothConfirmed);
}

export function lineupsModalTitle(options: {
  bothConfirmed: boolean;
  isLive: boolean;
}): string {
  if (options.isLive) return LIVE_LINEUPS_MODAL_TITLE;
  if (options.bothConfirmed) return CONFIRMED_LINEUPS_MODAL_TITLE;
  return POSSIBLE_LINEUPS_MODAL_TITLE;
}
