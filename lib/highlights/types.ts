export type MatchHighlightView = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  youtubeVideoId: string;
  publishedAt: string;
  source: "youtube_fifa" | "youtube_rtve_teledeporte";
};
