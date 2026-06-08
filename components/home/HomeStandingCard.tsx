import Link from "next/link";
import { BarChart3, ChevronRight, Medal } from "lucide-react";
import { HomeGeneralPredictionsCard } from "@/components/home/HomeGeneralPredictionsCard";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { MemberStanding } from "@/lib/ranking/queries";
import type { TournamentGeneralPredictions } from "@/lib/tournament-predictions/types";

function ptsLabel(points: number): string {
  const v = formatAggregateStat(points);
  return v === " " ? "0 pts" : `${v} pts`;
}

function PositionStatCard({ standing }: { standing: MemberStanding }) {
  return (
    <div className="@container min-w-0 rounded-2xl p-[clamp(0.75rem,4cqw,1rem)] tm-stat-card">
      <div className="mb-3 flex h-[clamp(2rem,10cqw,2.5rem)] w-[clamp(2rem,10cqw,2.5rem)] shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Medal className="h-[clamp(1rem,5cqw,1.25rem)] w-[clamp(1rem,5cqw,1.25rem)] text-purple-200" strokeWidth={2} />
      </div>
      <p className="truncate text-[clamp(8px,2.2cqw,10px)] font-semibold uppercase tracking-[0.12em] text-white/50">
        Posicion
      </p>
      <p className="mt-1.5 font-display text-[clamp(1.5rem,14cqw,2.25rem)] leading-none text-white">
        {formatAggregateStat(standing.position)}
        <span className="ml-0.5 text-[clamp(0.875rem,7cqw,1.25rem)] font-semibold text-[#CCFF00]/80">
          º
        </span>
      </p>
      <p className="mt-1 truncate text-[clamp(10px,2.8cqw,12px)] text-white/40">
        de {standing.totalMembers} en la porra
      </p>
    </div>
  );
}

type HomeStandingCardProps = {
  standing: MemberStanding | null;
  poolId: string;
  generalPredictions: TournamentGeneralPredictions;
  generalPredictionsEditable: boolean;
};

export function HomeStandingCard({
  standing,
  poolId,
  generalPredictions,
  generalPredictionsEditable,
}: HomeStandingCardProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {standing ? (
          <PositionStatCard standing={standing} />
        ) : (
          <div className="@container min-w-0 rounded-2xl p-[clamp(0.75rem,4cqw,1rem)] tm-stat-card">
            <p className="text-sm text-white/50">Sin datos de clasificacion todavia.</p>
          </div>
        )}
        <HomeGeneralPredictionsCard
          poolId={poolId}
          predictions={generalPredictions}
          editable={generalPredictionsEditable}
        />
      </div>

      {standing && (standing.ahead || standing.behind) && (
        <Link
          href="/ranking"
          className="tm-stat-card flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:border-white/30"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <BarChart3 className="h-4 w-4 text-purple-200" strokeWidth={2} />
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-4">
            {standing.ahead && (
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Por delante
                </p>
                <p className="mt-0.5 truncate text-sm">
                  <span className="font-medium text-white">{standing.ahead.label}</span>
                  <span className="text-white/40"> · </span>
                  <span className="font-semibold text-[#CCFF00]">
                    {ptsLabel(standing.ahead.cumulativePoints)}
                  </span>
                </p>
              </div>
            )}

            {standing.ahead && standing.behind && (
              <div className="h-8 w-px shrink-0 bg-white/10" aria-hidden="true" />
            )}

            {standing.behind && (
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Por detras
                </p>
                <p className="mt-0.5 truncate text-sm">
                  <span className="font-medium text-white">{standing.behind.label}</span>
                  <span className="text-white/40"> · </span>
                  <span className="font-semibold text-[#CCFF00]">
                    {ptsLabel(standing.behind.cumulativePoints)}
                  </span>
                </p>
              </div>
            )}
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-white/40" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
