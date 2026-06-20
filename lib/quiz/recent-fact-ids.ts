import type { QuizAdminClient } from "@/lib/quiz/seed-db";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParts(quizDate: string): { y: number; m: number; d: number } {
  const [y, m, d] = quizDate.split("-").map(Number);
  return { y, m, d };
}

function addDays(quizDate: string, delta: number): string {
  const { y, m, d } = parseDateParts(quizDate);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function momentIdsFromSettings(settings: unknown): string[] {
  if (!settings || typeof settings !== "object") return [];
  const pack = (settings as Record<string, unknown>).lab_daily_pack;
  if (!pack || typeof pack !== "object") return [];
  const ids = (pack as { moment_ids?: unknown }).moment_ids;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

export function factIdsFromSettings(settings: unknown): string[] {
  if (!settings || typeof settings !== "object") return [];
  const meta = (settings as Record<string, unknown>).questions_meta;
  if (!Array.isArray(meta)) return [];
  const ids: string[] = [];
  for (const row of meta) {
    if (row && typeof row === "object" && typeof (row as { fact_id?: unknown }).fact_id === "string") {
      ids.push((row as { fact_id: string }).fact_id);
    }
  }
  return ids;
}

/** Hechos usados en quizzes publicados recientes (para evitar repetición sin depender del filesystem). */
export async function loadRecentFactIdsFromDb(
  admin: QuizAdminClient,
  poolId: string,
  quizDate: string,
  historyDays = 14
): Promise<Set<string>> {
  if (!DATE_RE.test(quizDate)) {
    throw new Error("quiz_date invalido. Usa YYYY-MM-DD.");
  }

  const fromDate = addDays(quizDate, -historyDays);
  const used = new Set<string>();

  const { data, error } = await admin
    .from("quizzes")
    .select("quiz_date, settings_json")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .gte("quiz_date", fromDate)
    .lt("quiz_date", quizDate)
    .order("quiz_date", { ascending: false });

  if (error) throw error;

  for (const row of data ?? []) {
    for (const id of factIdsFromSettings(row.settings_json)) {
      used.add(id);
    }
  }

  return used;
}

/** Momentos de imagen/silueta usados en quizzes recientes (evita repetir la misma foto). */
export async function loadRecentMomentIdsFromDb(
  admin: QuizAdminClient,
  poolId: string,
  quizDate: string,
  historyDays = 14
): Promise<Set<string>> {
  if (!DATE_RE.test(quizDate)) {
    throw new Error("quiz_date invalido. Usa YYYY-MM-DD.");
  }

  const fromDate = addDays(quizDate, -historyDays);
  const used = new Set<string>();

  const { data, error } = await admin
    .from("quizzes")
    .select("quiz_date, settings_json")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .gte("quiz_date", fromDate)
    .lt("quiz_date", quizDate)
    .order("quiz_date", { ascending: false });

  if (error) throw error;

  for (const row of data ?? []) {
    for (const id of momentIdsFromSettings(row.settings_json)) {
      used.add(id);
    }
  }

  return used;
}
