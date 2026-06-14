import { createClient } from "@/lib/supabase/server";

export type UsageUserSummary = {
  profileId: string;
  username: string;
  displayName: string;
  loginCount: number;
  sessionCount: number;
  pageViewCount: number;
  totalEvents: number;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
};

export type UsageRecentEvent = {
  id: string;
  username: string;
  displayName: string;
  eventType: "login" | "session" | "page_view";
  path: string | null;
  createdAt: string;
  hourLabel: string;
};

export type UsageHourBucket = {
  hour: number;
  count: number;
};

export type UsageDashboardData = {
  summaries: UsageUserSummary[];
  recentEvents: UsageRecentEvent[];
  hourlyBuckets: UsageHourBucket[];
  totals: {
    activeUsers: number;
    eventsToday: number;
    sessionsToday: number;
    loginsToday: number;
  };
};

type RawEvent = {
  id: string;
  event_type: "login" | "session" | "page_view";
  path: string | null;
  created_at: string;
  profile_id: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
};

const MADRID_TZ = "Europe/Madrid";

function formatHourMadrid(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: MADRID_TZ,
    hour: "2-digit",
    minute: "2-digit",
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

function isTodayMadrid(iso: string): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(iso)) === fmt.format(new Date());
}

export async function getUsageDashboardData(): Promise<UsageDashboardData> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("app_usage_events")
    .select(
      `
      id,
      event_type,
      path,
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

  if (error) {
    throw new Error(error.message);
  }

  const rows = (events ?? []) as RawEvent[];
  const summaryMap = new Map<string, UsageUserSummary>();
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

  let eventsToday = 0;
  let sessionsToday = 0;
  let loginsToday = 0;

  for (const row of rows) {
    const profile = row.profiles;
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
        totalEvents: 1,
        lastSeenAt: row.created_at,
        firstSeenAt: row.created_at,
      });
    } else {
      existing.totalEvents += 1;
      if (row.event_type === "login") existing.loginCount += 1;
      if (row.event_type === "session") existing.sessionCount += 1;
      if (row.event_type === "page_view") existing.pageViewCount += 1;
      if (row.created_at > (existing.lastSeenAt ?? "")) {
        existing.lastSeenAt = row.created_at;
      }
      if (row.created_at < (existing.firstSeenAt ?? "")) {
        existing.firstSeenAt = row.created_at;
      }
    }

    hourly[getMadridHour(row.created_at)].count += 1;

    if (isTodayMadrid(row.created_at)) {
      eventsToday += 1;
      if (row.event_type === "session") sessionsToday += 1;
      if (row.event_type === "login") loginsToday += 1;
    }
  }

  const summaries = [...summaryMap.values()].sort((a, b) => {
    const aTime = a.lastSeenAt ?? "";
    const bTime = b.lastSeenAt ?? "";
    return bTime.localeCompare(aTime);
  });

  const recentEvents: UsageRecentEvent[] = rows.slice(0, 80).map((row) => ({
    id: row.id,
    username: row.profiles?.username ?? "?",
    displayName: row.profiles?.display_name ?? row.profiles?.username ?? "?",
    eventType: row.event_type,
    path: row.path,
    createdAt: row.created_at,
    hourLabel: formatHourMadrid(row.created_at),
  }));

  return {
    summaries,
    recentEvents,
    hourlyBuckets: hourly,
    totals: {
      activeUsers: summaries.length,
      eventsToday,
      sessionsToday,
      loginsToday,
    },
  };
}
