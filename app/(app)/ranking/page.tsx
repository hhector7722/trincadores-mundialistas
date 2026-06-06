import { Card } from "@/components/ui/card";
import { RankingTable } from "@/components/ranking/RankingTable";
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
    <div className="tm-ranking-page flex flex-col p-3 pb-2">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <RankingTable rows={rows} currentProfileId={user!.id} />
      </Card>
    </div>
  );
}
