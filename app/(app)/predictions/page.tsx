import { Card } from "@/components/ui/card";
import { MatchPredictionCard } from "@/components/predictions/MatchPredictionCard";
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
        <h1 className="text-lg font-semibold text-[var(--tm-fg)]">Predicciones</h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Toca un partido para marcar. Cierra 5 min antes del pitido.
        </p>
      </div>
      <Card className="px-4 py-0">
        {matches.length === 0 ? (
          <p className="py-8 text-sm text-[var(--tm-muted)]">No hay partidos cargados.</p>
        ) : (
          matches.map((m) => <MatchPredictionCard key={m.id} match={m} />)
        )}
      </Card>
    </div>
  );
}