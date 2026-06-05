import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { MemberStanding } from "@/lib/ranking/queries";

function ptsLabel(points: number): string {
  const v = formatAggregateStat(points);
  return v === " " ? "0 pts" : v + " pts";
}

export function HomeStandingCard({ standing }: { standing: MemberStanding | null }) {
  if (!standing) {
    return (
      <Card>
        <p className="text-sm text-[var(--tm-muted)]">Sin datos de clasificacion todavia.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--tm-primary-soft)]">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--tm-muted)]">
        Tu sitio
      </p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-4xl leading-none text-[var(--tm-primary)]">
            {formatAggregateStat(standing.position)}
          </p>
          <p className="mt-1 text-sm text-[var(--tm-muted)]">
            de {standing.totalMembers} en la porra
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl leading-none text-[var(--tm-fg)]">
            {formatAggregateStat(standing.cumulativePoints)}
          </p>
          <p className="mt-1 text-xs text-[var(--tm-muted)]">puntos acumulados</p>
        </div>
      </div>
      {(standing.ahead || standing.behind) && (
        <div className="mt-4 space-y-1 border-t border-[var(--tm-border)] pt-3 text-xs text-[var(--tm-muted)]">
          {standing.ahead && (
            <p>
              Por delante:{" "}
              <Link
                href={`/profile/${standing.ahead.profileId}`}
                className="font-medium text-[var(--tm-fg)]"
              >
                {standing.ahead.label}
              </Link>
              {" · "}
              {ptsLabel(standing.ahead.cumulativePoints)}
            </p>
          )}
          {standing.behind && (
            <p>
              Detras:{" "}
              <Link
                href={`/profile/${standing.behind.profileId}`}
                className="font-medium text-[var(--tm-fg)]"
              >
                {standing.behind.label}
              </Link>
              {" · "}
              {ptsLabel(standing.behind.cumulativePoints)}
            </p>
          )}
        </div>
      )}
      <Link
        href="/ranking"
        className="mt-3 inline-block text-xs font-medium text-[var(--tm-primary)]"
      >
        Ver clasificacion completa
      </Link>
    </Card>
  );
}