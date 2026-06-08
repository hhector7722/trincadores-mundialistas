import type { DailyFact } from "@/lib/home/daily-fact";

type HomeDailyFactCardProps = {
  fact: DailyFact | null;
};

export function HomeDailyFactCard({ fact }: HomeDailyFactCardProps) {
  if (!fact) return null;

  return (
    <div
      className="@container col-start-2 min-w-0 rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] tm-stat-card"
      aria-label="El dato shanelador del dia"
    >
      <div className="grid grid-cols-[5rem_1fr] items-start gap-1.5 py-px">
        <span className="flex min-w-0 items-center text-[9px] font-semibold uppercase leading-snug tracking-wide text-white/50">
          el dato shanelador del día
        </span>
        <p className="text-[10px] font-medium leading-relaxed text-[#CCFF00]">{fact.text}</p>
      </div>
    </div>
  );
}
