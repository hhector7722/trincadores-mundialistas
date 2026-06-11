import { GeneralPredictionsTable } from "@/components/tournament-predictions/GeneralPredictionsTable";
import { getPoolTournamentGeneralPredictionsBoard } from "@/lib/tournament-predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GeneralPredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = await getPoolTournamentGeneralPredictionsBoard(ctx.activePoolId);

  return (
    <div className="tm-general-predictions-page tm-ranking-page">
      <GeneralPredictionsTable rows={rows} currentProfileId={user!.id} />
    </div>
  );
}
