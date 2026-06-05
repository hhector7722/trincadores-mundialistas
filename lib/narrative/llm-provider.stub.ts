import type { NarrativeContext, NarrativeItem, NarrativeProvider } from "./types";

/** Stub: sin llamada LLM en Fase 0b. */
export class LlmNarrativeProviderStub implements NarrativeProvider {
  async generateBatch(ctx: NarrativeContext): Promise<NarrativeItem[]> {
    void ctx;
    return [];
  }
}
