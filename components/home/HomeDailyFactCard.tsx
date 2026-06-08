import type { DailyFact } from "@/lib/home/daily-fact";

type HomeDailyFactCardProps = {
  fact: DailyFact | null;
};

export function HomeDailyFactCard({ fact }: HomeDailyFactCardProps) {
  if (!fact) return null;

  return (
    <div
      className="@container flex h-full min-h-0 min-w-0 flex-col justify-start rounded-2xl p-2 tm-stat-card"
      aria-label="Dato shanelador del dia"
    >
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-white/50">
          Dato shanelador del día
        </p>
        <p className="w-full min-w-0 text-[10px] font-medium leading-relaxed text-[#CCFF00]">
          {fact.text}
        </p>
      </div>
    </div>
  );
}
