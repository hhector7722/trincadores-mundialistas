import type { ResolvedLineup } from "@/lib/lineup/types";

export function areMatchLineupsFullyConfirmed(
  homeLineup: ResolvedLineup | null | undefined,
  awayLineup: ResolvedLineup | null | undefined,
): boolean {
  return homeLineup?.sourceKind === "confirmed" && awayLineup?.sourceKind === "confirmed";
}

export function possibleLineupsModalTitle(
  homeLineup: ResolvedLineup | null | undefined,
  awayLineup: ResolvedLineup | null | undefined,
): string {
  return areMatchLineupsFullyConfirmed(homeLineup, awayLineup)
    ? "ALINEACIONES OFICIALES"
    : "POSIBLES ALINEACIONES";
}

export function possibleLineupsActionCaption(
  homeLineup: ResolvedLineup | null | undefined,
  awayLineup: ResolvedLineup | null | undefined,
): string {
  return areMatchLineupsFullyConfirmed(homeLineup, awayLineup)
    ? "Alineaciones oficiales"
    : "Posibles alineaciones";
}
