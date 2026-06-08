import type { DailyFact } from "@/lib/home/daily-fact";

type HomeDailyFactCardProps = {
  fact: DailyFact | null;
};

export function HomeDailyFactCard({ fact }: HomeDailyFactCardProps) {
  if (!fact) return null;

  return (
    <div
      className="@container flex h-full min-h-12 min-w-0 flex-col rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] tm-stat-card"
      aria-label="Dato shanelador del dia"
    >
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
        Dato shanelador del día
      </p>
      <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/50">{fact.text}</p>
    </div>
  );
}
