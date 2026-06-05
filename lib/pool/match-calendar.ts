const CALENDAR_TZ = "Europe/Madrid";

export type CalendarMatchLike = {
  kickoff_at: string;
};

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export type MatchDayGroup<T extends CalendarMatchLike = CalendarMatchLike> = {
  dateKey: string;
  dayLabel: string;
  monthKey: string;
  monthLabel: string;
  matches: T[];
};

export type CalendarCell<T extends CalendarMatchLike = CalendarMatchLike> = {
  dateKey: string | null;
  dayNumber: number | null;
  inMonth: boolean;
  matches: T[];
};

export type CalendarWeek<T extends CalendarMatchLike = CalendarMatchLike> = {
  cells: CalendarCell<T>[];
};

export type MonthYear = {
  year: number;
  month: number;
};

/** Clave YYYY-MM-DD en la zona del calendario (Madrid). */
export function kickoffDateKey(iso: string, timeZone = CALENDAR_TZ): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone });
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: string): MonthYear {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

export function formatCalendarDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const label = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatCalendarMonthLabel(dateKey: string): string {
  const [year, month] = dateKey.split("-").map(Number);
  return formatMonthYearLabel(year, month);
}

export function formatMonthYearLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString("es-ES", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatKickoffTime(iso: string, timeZone = CALENDAR_TZ): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function indexMatchesByDate<T extends CalendarMatchLike>(
  matches: T[]
): Map<string, T[]> {
  const byDay = new Map<string, T[]>();

  for (const match of matches) {
    const key = kickoffDateKey(match.kickoff_at);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.push(match);
    } else {
      byDay.set(key, [match]);
    }
  }

  for (const [key, dayMatches] of byDay) {
    byDay.set(
      key,
      [...dayMatches].sort(
        (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
      )
    );
  }

  return byDay;
}

export function getMonthRangeFromMatches<T extends CalendarMatchLike>(matches: T[]): {
  min: MonthYear;
  max: MonthYear;
} | null {
  if (!matches.length) return null;

  const keys = matches.map((m) => kickoffDateKey(m.kickoff_at)).sort();
  const min = parseMonthKey(keys[0]!.slice(0, 7));
  const max = parseMonthKey(keys[keys.length - 1]!.slice(0, 7));
  return { min, max };
}

export function getInitialMonthYear<T extends CalendarMatchLike>(matches: T[]): MonthYear {
  const range = getMonthRangeFromMatches(matches);
  if (!range) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }

  const todayMonth = parseMonthKey(kickoffDateKey(new Date().toISOString()).slice(0, 7));
  if (compareMonth(todayMonth, range.min) >= 0 && compareMonth(todayMonth, range.max) <= 0) {
    return todayMonth;
  }

  return range.min;
}

export function shiftMonth({ year, month }: MonthYear, delta: number): MonthYear {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function compareMonth(a: MonthYear, b: MonthYear): number {
  return a.year !== b.year ? a.year - b.year : a.month - b.month;
}

export function buildMonthGrid<T extends CalendarMatchLike>(
  year: number,
  month: number,
  matchesByDate: Map<string, T[]>
): CalendarWeek<T>[] {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell<T>[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ dateKey: null, dayNumber: null, inMonth: false, matches: [] as T[] });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      dateKey,
      dayNumber: day,
      inMonth: true,
      matches: matchesByDate.get(dateKey) ?? ([] as T[]),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, dayNumber: null, inMonth: false, matches: [] as T[] });
  }

  const weeks: CalendarWeek<T>[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push({ cells: cells.slice(i, i + 7) });
  }

  return weeks;
}

export function groupMatchesByDay<T extends CalendarMatchLike>(matches: T[]): MatchDayGroup<T>[] {
  const byDay = indexMatchesByDate(matches);

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayMatches]) => ({
      dateKey,
      dayLabel: formatCalendarDayLabel(dateKey),
      monthKey: dateKey.slice(0, 7),
      monthLabel: formatCalendarMonthLabel(dateKey),
      matches: dayMatches,
    }));
}
