import { NOTIFICATION_KIND_PREDICTION_REMINDER } from "@/lib/notifications/kinds";
import type { AdminClient } from "@/lib/scripts/supabase-admin";

export const PREDICTION_REMINDER_KIND = NOTIFICATION_KIND_PREDICTION_REMINDER;
export const PREDICTION_REMINDER_MINUTES = 30;
/** Debe coincidir con el intervalo del cron en vercel.json (cada 5 min). */
export const PREDICTION_REMINDER_CRON_INTERVAL_MS = 5 * 60 * 1000;

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  matchdays: { pool_id: string } | { pool_id: string }[] | null;
};

export type PredictionReminderMissing = {
  score: boolean;
  mvp: boolean;
};

export type SendPredictionRemindersResult = {
  matchesChecked: number;
  remindersSent: number;
  skippedDuplicate: number;
  skippedComplete: number;
};

/** Dispara una vez por ventana de cron, ~30 min antes del pitido. */
export function isPredictionReminderDue(
  kickoffAtIso: string,
  nowMs: number,
  cronIntervalMs = PREDICTION_REMINDER_CRON_INTERVAL_MS,
): boolean {
  const kickoffMs = new Date(kickoffAtIso).getTime();
  if (Number.isNaN(kickoffMs)) return false;
  const reminderAtMs = kickoffMs - PREDICTION_REMINDER_MINUTES * 60 * 1000;
  return nowMs >= reminderAtMs && nowMs < reminderAtMs + cronIntervalMs;
}

export function buildPredictionReminderCopy(
  homeTeam: string,
  awayTeam: string,
): { title: string; body: string } {
  const fixture = `${homeTeam} vs ${awayTeam}`;

  return {
    title: "Pronóstico pendiente",
    body: `Faltan ${PREDICTION_REMINDER_MINUTES} minutos para ${fixture}. Completa tu predicción hasta 5 minutos antes de que empiece.`,
  };
}

function poolIdFromMatchRow(row: MatchRow): string | null {
  const md = row.matchdays;
  if (!md) return null;
  if (Array.isArray(md)) return md[0]?.pool_id ?? null;
  return md.pool_id;
}

export async function sendPredictionReminders(
  admin: AdminClient,
  now = new Date(),
  cronIntervalMs = PREDICTION_REMINDER_CRON_INTERVAL_MS,
): Promise<SendPredictionRemindersResult> {
  const nowMs = now.getTime();
  const result: SendPredictionRemindersResult = {
    matchesChecked: 0,
    remindersSent: 0,
    skippedDuplicate: 0,
    skippedComplete: 0,
  };

  const horizonMin = new Date(nowMs + (PREDICTION_REMINDER_MINUTES - 2) * 60 * 1000).toISOString();
  const horizonMax = new Date(
    nowMs + (PREDICTION_REMINDER_MINUTES + cronIntervalMs / 60_000 + 2) * 60 * 1000,
  ).toISOString();

  const { data: matches, error: matchesError } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, matchdays!inner(pool_id)")
    .eq("status", "scheduled")
    .gte("kickoff_at", horizonMin)
    .lte("kickoff_at", horizonMax);

  if (matchesError) {
    throw new Error(`matches: ${matchesError.message}`);
  }

  const dueMatches = ((matches ?? []) as MatchRow[]).filter((m) =>
    isPredictionReminderDue(m.kickoff_at, nowMs, cronIntervalMs),
  );

  result.matchesChecked = dueMatches.length;
  if (!dueMatches.length) return result;

  for (const match of dueMatches) {
    const poolId = poolIdFromMatchRow(match);
    if (!poolId) continue;

    const { data: members, error: membersError } = await admin
      .from("pool_members")
      .select("profile_id")
      .eq("pool_id", poolId);

    if (membersError) {
      throw new Error(`pool_members: ${membersError.message}`);
    }

    const profileIds = (members ?? []).map((m) => m.profile_id as string);
    if (!profileIds.length) continue;

    const [{ data: predictions }, { data: mvps }] = await Promise.all([
      admin
        .from("predictions")
        .select("profile_id")
        .eq("pool_id", poolId)
        .eq("match_id", match.id)
        .in("profile_id", profileIds),
      admin
        .from("match_mvp_predictions")
        .select("profile_id")
        .eq("pool_id", poolId)
        .eq("match_id", match.id)
        .in("profile_id", profileIds),
    ]);

    const withScore = new Set((predictions ?? []).map((p) => p.profile_id as string));
    const withMvp = new Set((mvps ?? []).map((p) => p.profile_id as string));

    for (const profileId of profileIds) {
      const missing: PredictionReminderMissing = {
        score: !withScore.has(profileId),
        mvp: !withMvp.has(profileId),
      };

      if (!missing.score && !missing.mvp) {
        result.skippedComplete += 1;
        continue;
      }

      const copy = buildPredictionReminderCopy(match.home_team, match.away_team);
      const { error: insertError } = await admin.from("notifications").insert({
        profile_id: profileId,
        pool_id: poolId,
        kind: PREDICTION_REMINDER_KIND,
        match_id: match.id,
        title: copy.title,
        body: copy.body,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          result.skippedDuplicate += 1;
          continue;
        }
        throw new Error(`notifications: ${insertError.message}`);
      }

      result.remindersSent += 1;
    }
  }

  return result;
}
