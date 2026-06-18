import type { SupabaseClient } from "@supabase/supabase-js";
import { deriveUsageLabel, isQuizDrillAction, isQuizDrillSearch } from "@/lib/usage/labels";

export type UsageContextMaps = {
  matchLabels: Map<string, string>;
  profileLabels: Map<string, string>;
  quizDays: Map<string, string>;
};

const MATCH_PATH_RE = /^\/predictions\/([^/]+)$/;
const PROFILE_PATH_RE = /^\/profile\/([^/]+)$/;

function collectIdsFromEvents(
  events: Array<{ path: string | null; metadata: Record<string, unknown> | null }>
): { matchIds: Set<string>; profileIds: Set<string>; quizIds: Set<string> } {
  const matchIds = new Set<string>();
  const profileIds = new Set<string>();
  const quizIds = new Set<string>();

  for (const event of events) {
    const metadata = event.metadata ?? {};

    if (typeof metadata.matchId === "string") matchIds.add(metadata.matchId);
    if (typeof metadata.profileId === "string") profileIds.add(metadata.profileId);
    if (typeof metadata.quizId === "string") quizIds.add(metadata.quizId);

    if (!event.path) continue;

    const match = event.path.match(MATCH_PATH_RE);
    if (match?.[1]) matchIds.add(match[1]);

    const profile = event.path.match(PROFILE_PATH_RE);
    if (profile?.[1]) profileIds.add(profile[1]);
  }

  return { matchIds, profileIds, quizIds };
}

export async function buildUsageContextMaps(
  supabase: SupabaseClient,
  events: Array<{ path: string | null; metadata: Record<string, unknown> | null }>
): Promise<UsageContextMaps> {
  const { matchIds, profileIds, quizIds } = collectIdsFromEvents(events);

  const matchLabels = new Map<string, string>();
  const profileLabels = new Map<string, string>();
  const quizDays = new Map<string, string>();

  if (matchIds.size > 0) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id, home_team, away_team")
      .in("id", [...matchIds]);

    for (const match of matches ?? []) {
      matchLabels.set(match.id, `${match.home_team} vs ${match.away_team}`);
    }
  }

  if (profileIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", [...profileIds]);

    for (const profile of profiles ?? []) {
      profileLabels.set(profile.id, profile.display_name ?? profile.username);
    }
  }

  if (quizIds.size > 0) {
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, quiz_day")
      .in("id", [...quizIds]);

    for (const quiz of quizzes ?? []) {
      if (quiz.quiz_day) quizDays.set(quiz.id, quiz.quiz_day);
    }
  }

  return { matchLabels, profileLabels, quizDays };
}

function formatQuizUsageLabel(
  quizDay: string,
  metadata: Record<string, unknown>,
  drill: boolean
): string {
  const prefix = drill ? "Quiz entreno del" : "Quiz del";
  const action = typeof metadata.action === "string" ? metadata.action : null;
  const scoreSuffix =
    (action === "quiz_submitted" || action === "quiz_drill_submitted") &&
    metadata.score != null
      ? ` (${metadata.score} pts)`
      : "";

  return `${prefix} ${quizDay}${scoreSuffix}`;
}

export function resolveUsageEventLabel(
  path: string | null,
  label: string | null,
  metadata: Record<string, unknown> | null,
  maps: UsageContextMaps,
  search?: string | null
): string {
  const meta = metadata ?? {};

  if (typeof meta.matchId === "string") {
    const matchLabel = maps.matchLabels.get(meta.matchId);
    if (matchLabel) {
      if (meta.action === "prediction_saved" && meta.homeGoals != null && meta.awayGoals != null) {
        return `Pronostico: ${matchLabel} (${meta.homeGoals}-${meta.awayGoals})`;
      }
      return matchLabel;
    }
  }

  if (path) {
    const matchId = path.match(MATCH_PATH_RE)?.[1];
    if (matchId) {
      const matchLabel = maps.matchLabels.get(matchId);
      if (matchLabel) return matchLabel;
    }

    const profileId = path.match(PROFILE_PATH_RE)?.[1];
    if (profileId) {
      const profileLabel = maps.profileLabels.get(profileId);
      if (profileLabel) return `Perfil: ${profileLabel}`;
    }
  }

  if (typeof meta.profileId === "string") {
    const profileLabel = maps.profileLabels.get(meta.profileId);
    if (profileLabel) return `Perfil: ${profileLabel}`;
  }

  if (typeof meta.quizId === "string") {
    const quizDay = maps.quizDays.get(meta.quizId) ?? meta.quizDay;
    if (quizDay) {
      const drill =
        isQuizDrillAction(typeof meta.action === "string" ? meta.action : null) ||
        (path === "/quiz/play" && isQuizDrillSearch(search));
      return formatQuizUsageLabel(String(quizDay), meta, drill);
    }
  }

  if (path) {
    const derived = deriveUsageLabel(
      path,
      meta as never,
      typeof meta.action === "string" ? "action" : "page_view",
      search
    );
    if (derived !== path) return derived;
  }

  if (label && !label.startsWith("/")) return label;

  return label ?? path ?? " ";
}
