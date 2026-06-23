import { PredictionsCalendar } from "@/components/predictions/PredictionsCalendar";
import { predictionEditOpenHint } from "@/lib/predictions/deadline";
import { canEditPredictionsUntilKickoff } from "@/lib/predictions/late-edit-access";
import { getPoolGroupStageMatchesWithPredictions } from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matches = await getPoolGroupStageMatchesWithPredictions(ctx.activePoolId, user!.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .maybeSingle();
  const editUntilKickoff = canEditPredictionsUntilKickoff(profile?.username);

  return (
    <div className="tm-porra-page flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-20 shrink-0 bg-[var(--tm-bg)] px-4 pb-2 pt-4 shadow-sm">
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Porra
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Fase de grupos (junio). Toca un partido para marcar. {predictionEditOpenHint(editUntilKickoff)}.
        </p>
      </div>

      <div className="tm-porra-calendar-wrap">
        <PredictionsCalendar
          poolId={ctx.activePoolId}
          matches={matches}
          currentProfileId={user!.id}
        />
      </div>
    </div>
  );
}
