import { PredictionsCalendar } from "@/components/predictions/PredictionsCalendar";
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

  return (
    <div className="tm-porra-page flex min-h-0 flex-1 flex-col">
      <div className="hidden shrink-0 px-4 pt-4 sm:block">
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Porra
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Fase de grupos (junio). Toca un partido para marcar. Cierra 5 min antes del pitido.
        </p>
      </div>

      <div className="tm-porra-calendar-wrap">
        <PredictionsCalendar poolId={ctx.activePoolId} matches={matches} />
      </div>
    </div>
  );
}
