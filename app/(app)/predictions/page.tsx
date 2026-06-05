import { PredictionsCalendar } from "@/components/predictions/PredictionsCalendar";
import { getPoolMatchesWithPredictions } from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matches = await getPoolMatchesWithPredictions(ctx.activePoolId, user!.id);

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Porra
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Calendario de partidos. Toca uno para marcar. Cierra 5 min antes del pitido.
        </p>
      </div>

      <PredictionsCalendar poolId={ctx.activePoolId} matches={matches} />
    </div>
  );
}
