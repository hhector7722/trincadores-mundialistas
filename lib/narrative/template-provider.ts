import type { NarrativeContext, NarrativeItem, NarrativeProvider } from "./types";

export class TemplateNarrativeProvider implements NarrativeProvider {
  async generateBatch(ctx: NarrativeContext): Promise<NarrativeItem[]> {
    const now = new Date().toISOString();
    return [
      {
        id: `tpl-${now}`,
        title: `${ctx.poolName}: ${ctx.matchLabel}`,
        body: `Partido ${ctx.homeTeam} vs ${ctx.awayTeam}. Kickoff ${ctx.kickoffAt}.`,
        tone: "neutral",
        createdAt: now,
      },
    ];
  }
}