import Link from "next/link";
import { Card } from "@/components/ui/card";
import { HomeStandingCard } from "@/components/home/HomeStandingCard";
import { HomeTopThree } from "@/components/home/HomeTopThree";
import { countPendingPredictions } from "@/lib/predictions/queries";
import {
  getPoolLeaderboard,
  memberStandingFromLeaderboard,
} from "@/lib/ranking/queries";
import { getPoolMatches } from "@/lib/pool/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [matches, pending, leaderboard] = await Promise.all([
    getPoolMatches(ctx.activePoolId),
    countPendingPredictions(ctx.activePoolId, user!.id),
    getPoolLeaderboard(ctx.activePoolId),
  ]);

  const standing = memberStandingFromLeaderboard(leaderboard.rows, user!.id);

  const live = matches.filter((m) => m.status === "live");
  const scheduled = matches.filter((m) => m.status === "scheduled");
  const focus = live[0] ?? scheduled[0] ?? null;

  const pendingDisplay = pending > 0 ? String(pending) : " ";

  return (
    <div className="space-y-6 p-4 pb-8">
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--tm-muted)]">
          Tu panel
        </p>
        <p className="mt-2 font-display text-5xl leading-none text-[var(--tm-fg)]">
          {pendingDisplay}
        </p>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          {pending > 0
            ? "predicciones pendientes antes del cierre"
            : "Sin predicciones pendientes en plazo abierto"}
        </p>
        {pending > 0 && (
          <Link
            href="/predictions"
            className="mt-3 inline-block text-sm font-medium text-[var(--tm-primary)]"
          >
            Ir a porra
          </Link>
        )}
      </section>

      <HomeStandingCard standing={standing} />

      {focus && (
        <Card>
          <p className="text-xs font-medium text-[var(--tm-muted)]">Siguiente en calendario</p>
          <p className="mt-2 text-base font-semibold text-[var(--tm-fg)]">
            {focus.home_team} — {focus.away_team}
          </p>
          <p className="mt-1 text-sm text-[var(--tm-muted)]">
            {focus.matchday_name} · {focus.status === "live" ? "En juego" : "Programado"}
          </p>
          <Link
            href={`/predictions/${focus.id}`}
            className="mt-3 inline-block text-xs font-medium text-[var(--tm-primary)]"
          >
            Predecir
          </Link>
        </Card>
      )}

      <HomeTopThree rows={leaderboard.rows} />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--tm-fg)]">Calendario</h2>
          <Link href="/predictions" className="text-xs font-medium text-[var(--tm-primary)]">
            Ver todos
          </Link>
        </div>
        <Card className="divide-y divide-[var(--tm-border)] p-0 px-4">
          {matches.length === 0 ? (
            <p className="py-6 text-sm text-[var(--tm-muted)]">No hay partidos en esta porra.</p>
          ) : (
            matches.slice(0, 4).map((m) => (
              <div key={m.id} className="py-3 text-sm text-[var(--tm-fg)]">
                <span className="font-medium">{m.home_team}</span>
                <span className="text-[var(--tm-muted)]"> vs </span>
                <span className="font-medium">{m.away_team}</span>
                {m.status === "live" && (
                  <span className="ml-2 text-xs text-[var(--tm-live)]">LIVE</span>
                )}
              </div>
            ))
          )}
        </Card>
      </section>
    </div>
  );
}