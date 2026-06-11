import { shouldFetchConfirmedLineup } from "@/lib/lineup/confirmed-lineup-window";
import { loadCachedTeamLineup } from "@/lib/lineup/lineup-queries";
import { areMatchLineupsFullyConfirmed } from "@/lib/lineup/lineups-modal-copy";
import { NOTIFICATION_KIND_CONFIRMED_LINEUP } from "@/lib/notifications/kinds";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

type MatchRef = {
  id: string;
  home_team: string;
  away_team: string;
};

export type NotifyConfirmedLineupResult = {
  notified: boolean;
  recipients: number;
  skippedDuplicate: number;
  reason?: string;
};

function poolIdFromMatchRow(
  matchdays: { pool_id: string } | { pool_id: string }[] | null,
): string | null {
  if (!matchdays) return null;
  if (Array.isArray(matchdays)) return matchdays[0]?.pool_id ?? null;
  return matchdays.pool_id;
}

export function buildConfirmedLineupNotificationCopy(
  homeTeam: string,
  awayTeam: string,
): { title: string; body: string } {
  return {
    title: "Alineaciones oficiales",
    body: `${homeTeam} vs ${awayTeam}: ya están publicadas las alineaciones confirmadas.`,
  };
}

export async function areBothLineupsConfirmedInCache(
  admin: AdminClient,
  match: MatchRef,
): Promise<boolean> {
  const [home, away] = await Promise.all([
    loadCachedTeamLineup(admin, match.id, match.home_team),
    loadCachedTeamLineup(admin, match.id, match.away_team),
  ]);
  return areMatchLineupsFullyConfirmed(home, away);
}

export async function maybeNotifyConfirmedLineup(
  admin: AdminClient,
  match: MatchRef,
): Promise<NotifyConfirmedLineupResult> {
  const bothConfirmed = await areBothLineupsConfirmedInCache(admin, match);
  if (!bothConfirmed) {
    return { notified: false, recipients: 0, skippedDuplicate: 0, reason: "not_fully_confirmed" };
  }

  const { data: matchRow, error: matchError } = await admin
    .from("matches")
    .select("id, matchdays!inner(pool_id)")
    .eq("id", match.id)
    .maybeSingle();

  if (matchError) {
    throw new Error(`matches: ${matchError.message}`);
  }

  const poolId = poolIdFromMatchRow(
    (matchRow as { matchdays: { pool_id: string } | { pool_id: string }[] | null } | null)
      ?.matchdays ?? null,
  );

  if (!poolId) {
    return { notified: false, recipients: 0, skippedDuplicate: 0, reason: "no_pool" };
  }

  const { data: members, error: membersError } = await admin
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId);

  if (membersError) {
    throw new Error(`pool_members: ${membersError.message}`);
  }

  const profileIds = (members ?? []).map((m) => m.profile_id as string);
  if (!profileIds.length) {
    return { notified: false, recipients: 0, skippedDuplicate: 0, reason: "no_members" };
  }

  const copy = buildConfirmedLineupNotificationCopy(match.home_team, match.away_team);
  let recipients = 0;
  let skippedDuplicate = 0;

  for (const profileId of profileIds) {
    const { error: insertError } = await admin.from("notifications").insert({
      profile_id: profileId,
      pool_id: poolId,
      kind: NOTIFICATION_KIND_CONFIRMED_LINEUP,
      match_id: match.id,
      title: copy.title,
      body: copy.body,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        skippedDuplicate += 1;
        continue;
      }
      throw new Error(`notifications: ${insertError.message}`);
    }

    recipients += 1;
  }

  return {
    notified: recipients > 0,
    recipients,
    skippedDuplicate,
  };
}

export type SyncConfirmedLineupNotificationsResult = {
  matchesChecked: number;
  matchesNotified: number;
  recipients: number;
  skippedDuplicate: number;
};

/** Repasa partidos en ventana confirmada y notifica si ambos XI ya están en caché. */
export async function syncConfirmedLineupNotifications(
  admin: AdminClient,
  now = new Date(),
): Promise<SyncConfirmedLineupNotificationsResult> {
  const nowMs = now.getTime();
  const fromIso = new Date(nowMs).toISOString();
  const toIso = new Date(nowMs + 90 * 60 * 1000).toISOString();

  const { data: matches, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .in("status", ["scheduled", "live"])
    .gte("kickoff_at", fromIso)
    .lte("kickoff_at", toIso);

  if (error) {
    throw new Error(`matches: ${error.message}`);
  }

  const result: SyncConfirmedLineupNotificationsResult = {
    matchesChecked: 0,
    matchesNotified: 0,
    recipients: 0,
    skippedDuplicate: 0,
  };

  for (const match of matches ?? []) {
    if (!shouldFetchConfirmedLineup(match.kickoff_at, match.status, nowMs)) continue;
    result.matchesChecked += 1;

    const notifyResult = await maybeNotifyConfirmedLineup(admin, {
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
    });

    result.skippedDuplicate += notifyResult.skippedDuplicate;
    if (notifyResult.notified) {
      result.matchesNotified += 1;
      result.recipients += notifyResult.recipients;
    }
  }

  return result;
}
