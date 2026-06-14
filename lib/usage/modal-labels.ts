import type { EntityModalView } from "@/components/lineup/entity-modal-types";

export function entityModalUsageLabel(view: EntityModalView): string {
  switch (view.kind) {
    case "lineup":
      return `Alineacion ${view.teamName}`;
    case "player":
      return `Jugador ${view.playerName}`;
    case "mvp":
      return `MVP: ${view.homeTeam} vs ${view.awayTeam}`;
    case "possible-lineups":
      return `Posibles alineaciones: ${view.homeTeam} vs ${view.awayTeam}`;
    default:
      return "Modal de partido";
  }
}

export function matchFixtureLabel(homeTeam: string, awayTeam: string): string {
  return `${homeTeam} vs ${awayTeam}`;
}
