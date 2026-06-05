import Link from "next/link";
import { BarChart3, ChevronRight, Medal, Star } from "lucide-react";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { MemberStanding } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

function ptsLabel(points: number): string {
  const v = formatAggregateStat(points);
  return v === " " ? "0 pts" : `${v} pts`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueSuffix,
  sublabel,
  accentValue,
}: {
  icon: typeof Medal;
  label: string;
  value: string;
  valueSuffix?: string;
  sublabel: string;
  accentValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-[#0a0612]/90 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-950/80 ring-1 ring-purple-500/25">
        <Icon className="h-5 w-5 text-purple-400" strokeWidth={2} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-display text-4xl leading-none",
          accentValue ? "text-[#CCFF00]" : "text-white"
        )}
      >
        {value}
        {valueSuffix && value.trim() !== "" && (
          <span className="ml-0.5 text-xl font-semibold text-[#CCFF00]/80">{valueSuffix}</span>
        )}
      </p>
      <p className="mt-1 text-xs text-white/40">{sublabel}</p>
    </div>
  );
}

export function HomeStandingCard({ standing }: { standing: MemberStanding | null }) {
  if (!standing) {
    return (
      <div className="rounded-2xl border border-purple-500/20 bg-[#0a0612]/90 p-4">
        <p className="text-sm text-white/50">Sin datos de clasificacion todavia.</p>
      </div>
    );
  }

  const pointsDisplay = formatAggregateStat(standing.cumulativePoints);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Medal}
          label="Posicion"
          value={formatAggregateStat(standing.position)}
          valueSuffix="º"
          sublabel={`de ${standing.totalMembers} en la porra`}
        />
        <StatCard
          icon={Star}
          label="Puntos totales"
          value={pointsDisplay === " " ? " " : pointsDisplay}
          valueSuffix="pts"
          sublabel="acumulados"
          accentValue
        />
      </div>

      {(standing.ahead || standing.behind) && (
        <Link
          href="/ranking"
          className="flex min-h-12 items-center gap-3 rounded-2xl border border-purple-500/20 bg-[#0a0612]/90 px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-colors hover:border-purple-500/35"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-950/80 ring-1 ring-purple-500/25">
            <BarChart3 className="h-4 w-4 text-purple-400" strokeWidth={2} />
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
