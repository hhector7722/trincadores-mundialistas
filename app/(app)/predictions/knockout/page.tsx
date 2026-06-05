import { KnockoutBracket } from "@/components/predictions/KnockoutBracket";
import { getPoolKnockoutMatchesWithPredictions } from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function KnockoutPredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matches = await getPoolKnockoutMatchesWithPredictions(ctx.activePoolId, user!.id);

  return (
    <div className="tm-porra-page flex h-[calc(100dvh-var(--tm-tabbar-height)-2rem)] flex-col overflow-hidden pb-0 pt-0 sm:h-[calc(100dvh-var(--tm-tabbar-height)-3.25rem)]">
      <KnockoutBracket poolId={ctx.activePoolId} matches={matches} />
    </div>
  );
}
