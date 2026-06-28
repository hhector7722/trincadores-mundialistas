import type { HighlightSourceCode } from "@/lib/youtube/highlight-priority";

export type AlternativeSource = {
  videoId: string;
  source: HighlightSourceCode;
  publishedAt: string;
};

export type MatchHighlightView = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  penaltyHome: number | null;
  penaltyAway: number | null;
  youtubeVideoId: string;
  publishedAt: string;
  source: HighlightSourceCode;
  headline: string | null;
  alternativeSources: AlternativeSource[];
};
