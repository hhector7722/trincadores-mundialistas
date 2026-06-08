import { Sparkles } from "lucide-react";
import type { DailyFact } from "@/lib/home/daily-fact";

type HomeDailyFactCardProps = {
  fact: DailyFact | null;
};

export function HomeDailyFactCard({ fact }: HomeDailyFactCardProps) {
  if (!fact) return null;

  return (
    <section className="tm-glass-card px-4 py-3" aria-label="El dato del dia">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <Sparkles className="h-4 w-4 text-[var(--tm-accent)]" strokeWidth={2} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
              El dato
            </p>
            <span className="rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.12)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-muted)]">
              Curiosidad del dia
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--tm-fg)]">{fact.text}</p>
        </div>
      </div>
    </section>
  );
}
