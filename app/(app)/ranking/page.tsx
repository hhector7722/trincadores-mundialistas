import { RankingTableShell } from "@/components/ranking/RankingTableShell";
import { getPoolLeaderboard } from "@/lib/ranking/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { rows } = await getPoolLeaderboard(ctx.activePoolId);

  return (
    <div className="tm-ranking-page">
      <RankingTableShell
        rows={rows}
        currentProfileId={user!.id}
        poolId={ctx.activePoolId}
      />
    </div>
  );
}

// force redeploy cache clear
