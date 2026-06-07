export type EntityModalView =
  | { kind: "lineup"; teamName: string }
  | { kind: "player"; teamName: string; playerName: string }
  | {
      kind: "mvp";
      poolId: string;
      matchId: string;
      homeTeam: string;
      awayTeam: string;
      kickoffAt: string;
      serverEditable: boolean;
      savedPlayerName?: string | null;
      savedTeamName?: string | null;
    };

export function entityModalTitle(view: EntityModalView): string {
  switch (view.kind) {
    case "lineup":
      return "Once probable";
    case "player":
      return view.playerName;
    case "mvp":
      return "MVP del partido";
    default:
      return "Detalle";
  }
}
