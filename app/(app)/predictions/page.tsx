import { PredictionsCalendar } from "@/components/predictions/PredictionsCalendar";
import { getPoolGroupStageMatchesWithPredictions } from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { getPoolLeaderboard } from "@/lib/ranking/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [matches, leaderboard] = await Promise.all([
    getPoolGroupStageMatchesWithPredictions(ctx.activePoolId, user!.id),
    getPoolLeaderboard(ctx.activePoolId),
  ]);

  return (
    <div className="tm-porra-page flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="hidden shrink-0 px-4 pt-4 sm:block">
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Porra
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Fase de grupos (junio). Toca un partido para marcar. Cierra 5 min antes del pitido.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <PredictionsCalendar
          poolId={ctx.activePoolId}
          matches={matches}
          leaderboardRows={leaderboard.rows}
          currentProfileId={user!.id}
        />
      </div>
    </div>
  );
}
