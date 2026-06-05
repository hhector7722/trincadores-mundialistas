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
    <div className="tm-porra-page flex h-[calc(100dvh-var(--tm-tabbar-height)-3.25rem)] flex-col gap-2 overflow-hidden p-3 pb-2 sm:gap-4 sm:p-4">
      <div className="hidden shrink-0 sm:block">
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Porra
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Calendario mensual. Toca un partido para marcar. Cierra 5 min antes del pitido.
        </p>
      </div>

      <PredictionsCalendar poolId={ctx.activePoolId} matches={matches} />
    </div>
  );
}
