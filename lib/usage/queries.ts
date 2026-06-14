import { quizDayClosesAt, quizDayOpensAt, todayQuizDate } from "@/lib/quiz/date";
import { buildUsageContextMaps, resolveUsageEventLabel } from "@/lib/usage/resolve-context";
import type { AppUsageEventType } from "@/lib/usage/types";
import { createClient } from "@/lib/supabase/server";

export type UsageFilterUser = {
  profileId: string;
  username: string;
  displayName: string;
};

export type UsageDashboardFilters = {
  /** YYYY-MM-DD civil Madrid; null = todos los dias. */
  day: string | null;
  profileId: string | null;
};

export type UsageUserSummary = {
  profileId: string;
  username: string;
  displayName: string;
  loginCount: number;
  sessionCount: number;
  pageViewCount: number;
  actionCount: number;
  totalEvents: number;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
};

export type UsageRecentEvent = {
  id: string;
  username: string;
  displayName: string;
  eventType: AppUsageEventType;
  path: string | null;
  search: string | null;
  label: string;
  detail: string;
  durationMs: number | null;
  createdAt: string;
  timeLabel: string;
};

export type UsageHourBucket = {
  hour: number;
  count: number;
};

export type UsageDashboardData = {
  summaries: UsageUserSummary[];
  recentEvents: UsageRecentEvent[];
  hourlyBuckets: UsageHourBucket[];
  filterUsers: UsageFilterUser[];
  filters: UsageDashboardFilters;
  totals: {
    activeUsers: number;
    eventsCount: number;
    sessionsCount: number;
    loginsCount: number;
    actionsCount: number;
  };
};

type UsageEventProfile = {
  username: string;
  display_name: string | null;
};

type UsageEventRow = {
  id: string;
  event_type: AppUsageEventType;
  path: string | null;
  search: string | null;
  label: string | null;
  duration_ms: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profile_id: string;
  profiles: UsageEventProfile | UsageEventProfile[] | null;
};

function resolveUsageEventProfile(
  profiles: UsageEventProfile | UsageEventProfile[] | null | undefined
): UsageEventProfile | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

const MADRID_TZ = "Europe/Madrid";

function formatDateTimeMadrid(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function getMadridHour(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = parts.find((p) => p.type === "hour")?.value;
  return hour ? Number(hour) : 0;
}

function buildEventDetail(
  path: string | null,
  search: string | null,
  metadata: Record<string, unknown> | null
): string {
  const parts: string[] = [];
  if (path) parts.push(path);
  if (search) parts.push(search);
  if (metadata?.action === "tab_switch" && typeof metadata.tabLabel === "string") {
    parts.push(`tab:${metadata.tabLabel}`);
  }
  return parts.join(" ") || " ";
}

type PoolMemberProfile = {
  username: string;
  display_name: string | null;
};

type PoolMemberRow = {
  profile_id: string;
  profiles: PoolMemberProfile | PoolMemberProfile[] | null;
};

function resolvePoolMemberProfile(
  profiles: PoolMemberProfile | PoolMemberProfile[] | null | undefined
): PoolMemberProfile | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

export function parseUsageDashboardFilters(searchParams: {
  dia?: string;
  usuario?: string;
}): UsageDashboardFilters {
  const dayParam = searchParams.dia?.trim();
  const day =
    !dayParam || dayParam === "todos"
      ? null
      : /^\d{4}-\d{2}-\d{2}$/.test(dayParam)
        ? dayParam
        : todayQuizDate();

  const profileId = searchParams.usuario?.trim() || null;

  return { day, profileId };
}

async function getPoolFilterUsers(poolId: string): Promise<UsageFilterUser[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("pool_members")
    .select(
      `
      profile_id,
      profiles (
        username,
        display_name
      )
    `
    )
    .eq("pool_id", poolId);

  if (error) {
    throw new Error(error.message);
  }

  return ((members ?? []) as PoolMemberRow[])
    .map((member) => {
      const profile = resolvePoolMemberProfile(member.profiles);
      const username = profile?.username ?? "?";
      return {
        profileId: member.profile_id,
        username,
        displayName: profile?.display_name ?? username,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
}

export async function getUsageDashboardData(
  poolId: string,
  filters: UsageDashboardFilters
): Promise<UsageDashboardData> {
  const supabase = await createClient();

  let eventsQuery = supabase
    .from("app_usage_events")
    .select(
      `
      id,
      event_type,
      path,
      search,
      label,
      duration_ms,
      metadata,
      created_at,
      profile_id,
      profiles (
        username,
        display_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (filters.profileId) {
    eventsQuery = eventsQuery.eq("profile_id", filters.profileId);
  }

  if (filters.day) {
    eventsQuery = eventsQuery
      .gte("created_at", quizDayOpensAt(filters.day))
      .lte("created_at", quizDayClosesAt(filters.day));
  }

  const [{ data: events, error }, filterUsers] = await Promise.all([
    eventsQuery,
    getPoolFilterUsers(poolId),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (events ?? []) as UsageEventRow[];
  const contextMaps = await buildUsageContextMaps(supabase, rows);
  const summaryMap = new Map<string, UsageUserSummary>();
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

  let eventsCount = 0;
  let sessionsCount = 0;
  let loginsCount = 0;
  let actionsCount = 0;

  for (const row of rows) {
    const profile = resolveUsageEventProfile(row.profiles);
    const username = profile?.username ?? "?";
    const displayName = profile?.display_name ?? username;
    const existing = summaryMap.get(row.profile_id);

    if (!existing) {
      summaryMap.set(row.profile_id, {
        profileId: row.profile_id,
        username,
        displayName,
        loginCount: row.event_type === "login" ? 1 : 0,
        sessionCount: row.event_type === "session" ? 1 : 0,
        pageViewCount: row.event_type === "page_view" ? 1 : 0,
        actionCount: row.event_type === "action" ? 1 : 0,
        totalEvents: 1,
        lastSeenAt: row.created_at,
        firstSeenAt: row.created_at,
      });
    } else {
      existing.totalEvents += 1;
      if (row.event_type === "login") existing.loginCount += 1;
      if (row.event_type === "session") existing.sessionCount += 1;
      if (row.event_type === "page_view") existing.pageViewCount += 1;
      if (row.event_type === "action") existing.actionCount += 1;
      if (row.created_at > (existing.lastSeenAt ?? "")) {
        existing.lastSeenAt = row.created_at;
      }
      if (row.created_at < (existing.firstSeenAt ?? "")) {
        existing.firstSeenAt = row.created_at;
      }
    }

    hourly[getMadridHour(row.created_at)].count += 1;
    eventsCount += 1;
    if (row.event_type === "session") sessionsCount += 1;
    if (row.event_type === "login") loginsCount += 1;
    if (row.event_type === "action") actionsCount += 1;
  }

  const summaries = [...summaryMap.values()].sort((a, b) => {
    const aTime = a.lastSeenAt ?? "";
    const bTime = b.lastSeenAt ?? "";
    return bTime.localeCompare(aTime);
  });

  const recentEvents: UsageRecentEvent[] = rows.slice(0, 120).map((row) => {
    const profile = resolveUsageEventProfile(row.profiles);
    const metadata = row.metadata ?? null;
    const label = resolveUsageEventLabel(row.path, row.label, metadata, contextMaps);

    return {
      id: row.id,
      username: profile?.username ?? "?",
      displayName: profile?.display_name ?? profile?.username ?? "?",
      eventType: row.event_type,
      path: row.path,
      search: row.search,
      label,
      detail: buildEventDetail(row.path, row.search, metadata),
      durationMs: row.duration_ms,
      createdAt: row.created_at,
      timeLabel: formatDateTimeMadrid(row.created_at),
    };
  });

  return {
    summaries,
    recentEvents,
    hourlyBuckets: hourly,
    filterUsers,
    filters,
    totals: {
      activeUsers: summaries.length,
      eventsCount,
      sessionsCount,
      loginsCount,
      actionsCount,
    },
  };
}
