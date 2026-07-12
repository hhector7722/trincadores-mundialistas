import { PredictionsCalendar } from "@/components/predictions/PredictionsCalendar";
import { predictionEditOpenHint } from "@/lib/predictions/deadline";
import { canEditPredictionsUntilKickoff } from "@/lib/predictions/late-edit-access";
import { getPoolMatchesWithPredictions } from "@/lib/predictions/queries";
import { resolveKnockoutTeams } from "@/lib/predictions/resolve-knockout-teams";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";
import { isPoolAdmin } from "@/lib/pool/admin";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [matches, isAdmin] = await Promise.all([
    getPoolMatchesWithPredictions(ctx.activePoolId, user!.id),
    isPoolAdmin(ctx.activePoolId, user!.id)
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .maybeSingle();
  const editUntilKickoff = canEditPredictionsUntilKickoff(profile?.username);
  const resolvedMatches = resolveKnockoutTeams(matches);

  return (
    <div className="tm-porra-page flex min-h-0 flex-1 flex-col">
      <div className="tm-porra-calendar-wrap">
        <PredictionsCalendar
          poolId={ctx.activePoolId}
          matches={resolvedMatches}
          currentProfileId={user!.id}
          currentProfileAlias={profile?.username || ""}
          isAdminUser={isAdmin}
        />
      </div>
    </div>
  );
}
