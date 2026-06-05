import Link from "next/link";
import { notFound } from "next/navigation";
import { PredictionForm } from "@/components/predictions/PredictionForm";
import { PeerPredictionsList } from "@/components/predictions/PeerPredictionsList";
import {
  getMatchPredictionDetail,
  getPeerPredictionsForMatch,
} from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PredictionMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const match = await getMatchPredictionDetail(ctx.activePoolId, user!.id, matchId);
  if (!match) {
    notFound();
  }

  const peers = await getPeerPredictionsForMatch(
    ctx.activePoolId,
    matchId,
    user!.id
  );

  const formKey = [
    match.id,
    match.prediction?.updated_at ?? "none",
    match.serverEditable ? "open" : "closed",
  ].join(":");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-[var(--tm-border)] px-4 py-2">
        <Link href="/predictions" className="text-sm font-medium text-[var(--tm-primary)]">
          Volver al calendario
        </Link>
      </div>
      <PredictionForm key={formKey} poolId={ctx.activePoolId} match={match} />
      <PeerPredictionsList
        peers={peers}
        matchStatus={match.status}
        kickoffAt={match.kickoff_at}
      />
    </div>
  );
}