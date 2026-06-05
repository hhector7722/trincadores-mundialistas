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
    <div className="tm-porra-page space-y-2 p-3 pb-8 sm:space-y-4 sm:p-4">
      <div>
        <h1 className="font-display text-base uppercase tracking-wide text-[var(--tm-fg)] sm:text-lg">
          Porra
        </h1>
        <p className="mt-0.5 hidden text-sm text-[var(--tm-muted)] sm:mt-1 sm:block">
          Calendario mensual. Toca un partido para marcar. Cierra 5 min antes del pitido.
        </p>
      </div>

      <PredictionsCalendar poolId={ctx.activePoolId} matches={matches} />
    </div>
  );
}
