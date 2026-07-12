import { KnockoutBracket } from "@/components/predictions/KnockoutBracket";
import { getPoolKnockoutMatchesWithPredictions } from "@/lib/predictions/queries";
import { resolveKnockoutTeams } from "@/lib/predictions/resolve-knockout-teams";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";
import { isPoolAdmin } from "@/lib/pool/admin";

export const dynamic = "force-dynamic";

export default async function KnockoutPredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [matches, isAdmin] = await Promise.all([
    getPoolKnockoutMatchesWithPredictions(ctx.activePoolId, user!.id),
    isPoolAdmin(ctx.activePoolId, user!.id)
  ]);

  const resolvedMatches = resolveKnockoutTeams(matches);

  return (
    <div className="tm-porra-page flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-20 shrink-0 bg-[var(--tm-bg)] px-4 pb-2 pt-4 shadow-sm">
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Fase final
        </h1>
      </div>

      <KnockoutBracket
        poolId={ctx.activePoolId}
        matches={resolvedMatches}
        currentProfileId={user!.id}
        isAdminUser={isAdmin}
      />
    </div>
  );
}
