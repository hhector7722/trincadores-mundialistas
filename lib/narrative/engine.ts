import type { NarrativeContext, NarrativeItem, NarrativeProvider } from "./types";
import { TemplateNarrativeProvider } from "./template-provider";
import { LlmNarrativeProviderStub } from "./llm-provider.stub";

export type NarrativeEngineOptions = {
  useLlm?: boolean;
  templateProvider?: NarrativeProvider;
  llmProvider?: NarrativeProvider;
};

export class NarrativeEngine {
  private template: NarrativeProvider;
  private llm: NarrativeProvider;

  constructor(opts: NarrativeEngineOptions = {}) {
    this.template = opts.templateProvider ?? new TemplateNarrativeProvider();
    this.llm = opts.llmProvider ?? new LlmNarrativeProviderStub();
  }

  async generate(ctx: NarrativeContext): Promise<NarrativeItem[]> {
    const fromTemplate = await this.template.generateBatch(ctx);
    const fromLlm = await this.llm.generateBatch(ctx);
    return [...fromTemplate, ...fromLlm];
  }
}