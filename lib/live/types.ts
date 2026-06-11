export type MatchSubstitution = {
  minute: string;
  teamSide: "home" | "away";
  playerIn: string;
  playerOut: string;
};

export type MatchLiveStats = {
  possessionHome: number | null;
  possessionAway: number | null;
  shotsHome: number | null;
  shotsAway: number | null;
  shotsOnTargetHome: number | null;
  shotsOnTargetAway: number | null;
  xgHome: number | null;
  xgAway: number | null;
  yellowCardsHome: number | null;
  yellowCardsAway: number | null;
  redCardsHome: number | null;
  redCardsAway: number | null;
};

export type MatchLivePayload = {
  period?: string | null;
  currentMinute?: number | null;
  stats?: MatchLiveStats | null;
  substitutions?: MatchSubstitution[];
};

export type MatchLiveSnapshot = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minuteLabel: string;
  finished: boolean;
  stats: MatchLiveStats | null;
  substitutions: MatchSubstitution[];
  syncedAt: string | null;
};

export type SubstitutionMarkers = {
  subbedOutKeys: Set<string>;
  subbedInKeys: Set<string>;
};
