import { NOTIFICATION_KIND_MATCH_HIGHLIGHT } from "@/lib/notifications/kinds";
import { highlightThumbNotificationUrl, matchHighlightNotificationUrl } from "@/lib/push/urls";
import { sendPushToProfile } from "@/lib/push/send";
import { isVapidConfigured } from "@/lib/push/vapid";
import type { AdminClient } from "@/lib/scripts/supabase-admin";
import { teamFlagEmoji } from "@/lib/teams/flags";
import { teamAbbr } from "@/lib/teams/display";

type MatchRef = {
  id: string;
  home_team: string;
  away_team: string;
};

export type NotifyMatchHighlightResult = {
  notified: boolean;
  recipients: number;
  skippedDuplicate: number;
  pushSent: number;
  pushSkipped: number;
  pushFailed: number;
  reason?: string;
};

function poolIdFromMatchRow(
  matchdays: { pool_id: string } | { pool_id: string }[] | null,
): string | null {
  if (!matchdays) return null;
  if (Array.isArray(matchdays)) return matchdays[0]?.pool_id ?? null;
  return matchdays.pool_id;
}

export function buildMatchHighlightNotificationCopy(
  homeTeam: string,
  awayTeam: string,
  homeGoals: number | null,
  awayGoals: number | null,
): { title: string; body: string } {
  const homeFlag = teamFlagEmoji(homeTeam);
  const awayFlag = teamFlagEmoji(awayTeam);
  const homeCode = teamAbbr(homeTeam);
  const awayCode = teamAbbr(awayTeam);

  const score =
    homeGoals != null && awayGoals != null
      ? `${homeGoals} - ${awayGoals}`
      : null;

  const fixture = score
    ? `${homeFlag} ${homeCode} ${score} ${awayCode} ${awayFlag}`
    : `${homeFlag} ${homeCode} - ${awayCode} ${awayFlag}`;

  return {
    title: `Resumen ${fixture}`,
    body: "",
  };
}

export async function maybeNotifyMatchHighlight(
  admin: AdminClient,
  match: MatchRef,
  siteOrigin?: string,
): Promise<NotifyMatchHighlightResult> {
  const { data: matchRow, error: matchError } = await admin
    .from("matches")
    .select("id, highlight_youtube_id, matchdays!inner(pool_id)")
    .eq("id", match.id)
    .maybeSingle();

  if (matchError) {
    throw new Error(`matches: ${matchError.message}`);
  }

  if (!matchRow?.highlight_youtube_id) {
    return {
      notified: false,
      recipients: 0,
      skippedDuplicate: 0,
      pushSent: 0,
      pushSkipped: 0,
      pushFailed: 0,
      reason: "no_highlight",
    };
  }

  const poolId = poolIdFromMatchRow(
    (matchRow as { matchdays: { pool_id: string } | { pool_id: string }[] | null }).matchdays,
  );

  if (!poolId) {
    return {
      notified: false,
      recipients: 0,
      skippedDuplicate: 0,
      pushSent: 0,
      pushSkipped: 0,
      pushFailed: 0,
      reason: "no_pool",
    };
  }

  const { data: resultRow, error: resultError } = await admin
    .from("match_results")
    .select("home_goals, away_goals")
    .eq("match_id", match.id)
    .maybeSingle();

  if (resultError) {
    throw new Error(`match_results: ${resultError.message}`);
  }

  const { data: members, error: membersError } = await admin
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId);

  if (membersError) {
    throw new Error(`pool_members: ${membersError.message}`);
  }

  const profileIds = [...new Set((members ?? []).map((m) => m.profile_id as string))];
  if (!profileIds.length) {
    return {
      notified: false,
      recipients: 0,
      skippedDuplicate: 0,
      pushSent: 0,
      pushSkipped: 0,
      pushFailed: 0,
      reason: "no_members",
    };
  }

  const copy = buildMatchHighlightNotificationCopy(
    match.home_team,
    match.away_team,
    resultRow?.home_goals ?? null,
    resultRow?.away_goals ?? null,
  );
  const pushUrl = matchHighlightNotificationUrl(match.id, siteOrigin);
  const pushImage = highlightThumbNotificationUrl(matchRow.highlight_youtube_id, siteOrigin);
  const pushEnabled = isVapidConfigured();
  let recipients = 0;
  let skippedDuplicate = 0;
  let pushSent = 0;
  let pushSkipped = 0;
  let pushFailed = 0;

  for (const profileId of profileIds) {
    const { error: insertError } = await admin.from("notifications").insert({
      profile_id: profileId,
      pool_id: poolId,
      kind: NOTIFICATION_KIND_MATCH_HIGHLIGHT,
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

    if (!pushEnabled) {
      pushSkipped += 1;
      continue;
    }

    const pushResult = await sendPushToProfile(admin, profileId, {
      title: copy.title,
      body: copy.body,
      url: pushUrl,
      image: pushImage,
      tag: `${NOTIFICATION_KIND_MATCH_HIGHLIGHT}:${match.id}`,
    });

    pushSent += pushResult.sent;
    pushSkipped += pushResult.skipped;
    pushFailed += pushResult.failed;
  }

  return {
    notified: recipients > 0,
    recipients,
    skippedDuplicate,
    pushSent,
    pushSkipped,
    pushFailed,
  };
}
