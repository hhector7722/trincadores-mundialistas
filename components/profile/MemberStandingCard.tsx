import { Card } from "@/components/ui/card";
import { MATCH_SCORE_POINTS } from "@/lib/predictions/scoring";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { MemberStanding } from "@/lib/ranking/queries";

export function MemberStandingCard({
  standing,
  isSelf,
}: {
  standing: MemberStanding;
  isSelf: boolean;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs text-[var(--tm-muted)]">Nombre</p>
        <p className="text-base font-medium text-[var(--tm-fg)]">{standing.label}</p>
        <p className="text-sm text-[var(--tm-muted)]">@{standing.username}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[var(--tm-muted)]">Posicion</p>
          <p className="font-display text-3xl text-[var(--tm-accent)]">
            {formatAggregateStat(standing.position)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--tm-muted)]">Puntos</p>
          <p className="font-display text-3xl text-[var(--tm-fg)]">
            {formatAggregateStat(standing.cumulativePoints)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--tm-muted)]">Exactos ({MATCH_SCORE_POINTS.exact} pts)</p>
          <p className="text-lg font-medium text-[var(--tm-fg)]">
            {formatAggregateStat(standing.exactHits)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--tm-muted)]">Signo ({MATCH_SCORE_POINTS.sign} pts)</p>
          <p className="text-lg font-medium text-[var(--tm-fg)]">
            {formatAggregateStat(standing.signHits)}
          </p>
        </div>
      </div>
      {isSelf ? (
        <p className="text-sm text-[var(--tm-muted)]">Este es tu perfil en la porra.</p>
      ) : (
        <p className="text-sm text-[var(--tm-muted)]">
          {standing.exactHits > 0 || standing.cumulativePoints > 0
            ? "Rival activo en la clasificacion."
            : "Aun sin puntos en la jornada de referencia."}
        </p>
      )}
    </Card>
  );
}