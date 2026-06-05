import Link from "next/link";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeNextMatch } from "@/components/home/HomeNextMatch";
import { HomeStandingCard } from "@/components/home/HomeStandingCard";
import { HomeTopThree } from "@/components/home/HomeTopThree";
import { countPendingPredictions, getMatchPredictionDetail } from "@/lib/predictions/queries";
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

  const focusMatch = focus
    ? await getMatchPredictionDetail(ctx.activePoolId, user!.id, focus.id)
    : null;

  return (
    <div className="relative min-h-full">
      <HomeAtmosphere />

      <div className="relative z-10 space-y-3 p-4 pb-8">
        <HomeHero pendingCount={pending} />
        {focusMatch && <HomeNextMatch poolId={ctx.activePoolId} match={focusMatch} />}
        <HomeStandingCard standing={standing} />

        <div className="mt-5 space-y-5 md:space-y-6">
          <HomeTopThree rows={leaderboard.rows} />
        </div>

        <section className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
              Calendario
            </h2>
            <Link href="/predictions" className="tm-accent-link text-xs">
              Ver todos
            </Link>
          </div>
          <div className="tm-glass-card divide-y divide-[var(--tm-border)] p-0 px-4">
            {matches.length === 0 ? (
              <p className="py-6 text-sm text-[var(--tm-muted)]">No hay partidos en esta porra.</p>
            ) : (
              matches.slice(0, 4).map((m) => (
                <div key={m.id} className="py-3 text-sm text-[var(--tm-fg)]">
                  <span className="font-medium">{m.home_team}</span>
                  <span className="text-[var(--tm-muted)]"> vs </span>
                  <span className="font-medium">{m.away_team}</span>
                  {m.status === "live" && (
                    <span className="ml-2 text-xs font-semibold text-[var(--tm-live)]">LIVE</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
