import { FinalHomeScreen } from "@/components/home/final/FinalHomeScreen";
import { selectFinalMatch } from "@/lib/home/select-final-match";
import { getPoolMatchesWithPredictions } from "@/lib/predictions/queries";
import { resolveKnockoutTeams } from "@/lib/predictions/resolve-knockout-teams";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matches = resolveKnockoutTeams(
    await getPoolMatchesWithPredictions(ctx.activePoolId, user!.id)
  );
  const finalMatch = selectFinalMatch(matches);

  return (
    <FinalHomeScreen
      poolId={ctx.activePoolId}
      match={finalMatch}
    />
  );
}
