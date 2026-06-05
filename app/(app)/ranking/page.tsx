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

  const { matchday, rows } = await getPoolLeaderboard(ctx.activePoolId);

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="text-lg font-semibold text-[var(--tm-fg)]">Ranking</h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          {ctx.activePoolName} — Clasificacion general
          {matchday ? ` · ${matchday.name}` : ""}
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <RankingTable rows={rows} currentProfileId={user!.id} />
      </Card>
    </div>
  );
}