import { HomeCardHeader } from "@/components/home/HomeCardHeader";
import type { DailyFact } from "@/lib/home/daily-fact";

type HomeDailyFactCardProps = {
  fact: DailyFact | null;
};

export function HomeDailyFactCard({ fact }: HomeDailyFactCardProps) {
  if (!fact) return null;

  return (
    <div
      className="@container flex h-full min-h-12 min-w-0 flex-col overflow-hidden rounded-2xl tm-stat-card"
      aria-label="Dato shanelador del dia"
    >
      <HomeCardHeader title="Dato shanelador del día" />
      <p className="flex-1 p-[clamp(0.5rem,3cqw,0.75rem)] text-[10px] font-medium leading-relaxed text-white/50">
        {fact.text}
      </p>
    </div>
  );
}
