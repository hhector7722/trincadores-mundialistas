export type NarrativeTone = "neutral" | "hype" | "banter";

export type NarrativeContext = {
  poolName: string;
  matchLabel: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  locale?: string;
};

export type NarrativeItem = {
  id: string;
  title: string;
  body: string;
  tone: NarrativeTone;
  createdAt: string;
};

export interface NarrativeProvider {
  generateBatch(ctx: NarrativeContext): Promise<NarrativeItem[]>;
}