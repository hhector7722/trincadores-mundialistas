import Link from "next/link";
import { Card } from "@/components/ui/card";
import { displayGoals } from "@/lib/predictions/edit-state";
import {
  arePeerPredictionsLikelyVisible,
  type PeerPredictionRow,
} from "@/lib/predictions/queries";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { MatchStatus } from "@/types/database";

export function PeerPredictionsList({
  peers,
  matchStatus,
  kickoffAt,
}: {
  peers: PeerPredictionRow[];
  matchStatus: MatchStatus;
  kickoffAt: string;
}) {
  const likelyVisible = arePeerPredictionsLikelyVisible(matchStatus, kickoffAt);

  return (
    <Card className="mx-4 mb-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--tm-muted)]">
        Rivales
      </p>
      {!likelyVisible && (
        <p className="mt-2 text-sm text-[var(--tm-muted)]">
          Rivales ocultos hasta el inicio.
        </p>
      )}
      {likelyVisible && peers.length === 0 && (
        <p className="mt-2 text-sm text-[var(--tm-muted)]">Nadie ha marcado aun.</p>
      )}
      {likelyVisible && peers.length > 0 && (
        <ul className="mt-3 divide-y divide-[var(--tm-border)]">
          {peers.map((peer) => (
            <li key={peer.profileId} className="flex min-h-12 items-center justify-between gap-3 py-3">
              <Link
                href={`/profile/${peer.profileId}`}
                className="truncate text-sm font-medium text-[var(--tm-fg)]"
              >
                {peer.label}
              </Link>
              <div className="shrink-0 text-right">
                <p className="font-display text-sm text-[var(--tm-fg)]">
                  {displayGoals(peer.homeGoals, peer.awayGoals)}
                </p>
                {peer.pointsAwarded !== null && peer.pointsAwarded !== undefined && (
                  <p className="text-xs text-[var(--tm-muted)]">
                    {formatAggregateStat(peer.pointsAwarded) === " "
                      ? " "
                      : "+" + String(peer.pointsAwarded) + " pts"}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}