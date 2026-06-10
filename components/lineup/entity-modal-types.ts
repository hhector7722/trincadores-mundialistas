export type EntityModalView =
  | { kind: "lineup"; teamName: string; matchId?: string }
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
    }
  | {
      kind: "possible-lineups";
      matchId: string;
      homeTeam: string;
      awayTeam: string;
    };

export function entityModalTitle(view: EntityModalView): string {
  switch (view.kind) {
    case "lineup":
      return view.teamName;
    case "player":
      return view.playerName;
    case "mvp":
      return "MVP del partido";
    case "possible-lineups":
      return "POSIBLES ALINEACIONES";
    default:
      return "Detalle";
  }
}
