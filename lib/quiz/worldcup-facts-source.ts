import { isMenTournament } from "@/lib/fjelstul-worldcup/normalize";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import type { QuizFactWorldcupRow } from "@/lib/worldcup-data/types";
import { loadFacts, validateQuizFact, type QuizFact } from "@/lib/quiz/facts";

/** Mínimo de hechos para armar un día (3 preguntas). */
export const MIN_FACTS_FOR_DAY = 3;

/** Mínimo de pool para distractores semánticos viables. */
export const MIN_FACTS_POOL = 6;

export type QuizFactsSourceKind =
  | "quiz_facts_worldcup"
  | "world-cup-facts.json"
  | "hybrid";

export type QuizFactsLoadResult = {
  facts: QuizFact[];
  source: QuizFactsSourceKind;
};

const WOMENS_WC_YEARS = new Set([1991, 1995, 1999, 2003, 2007, 2011, 2015, 2019]);

type WorldcupFactLike = {
  metadata?: Record<string, unknown> | null;
  year?: number | null;
  subject?: string | null;
  enabled?: boolean;
};

/** Solo facts de torneos masculinos — filtro intencional del pipeline. */
export function isMenQuizFact(row: WorldcupFactLike): boolean {
  const metadata = row.metadata ?? {};
  const tournamentId = metadata.tournament_id;
  if (typeof tournamentId === "string" && tournamentId.trim()) {
    const tournamentName =
      typeof metadata.tournament_name === "string"
        ? metadata.tournament_name
        : row.subject ?? undefined;
    return isMenTournament(tournamentId.trim(), { name: tournamentName });
  }

  if (row.year != null && WOMENS_WC_YEARS.has(row.year)) return false;

  const subject = (row.subject ?? "").toLowerCase();
  if (subject.includes("women") || subject.includes("femenin")) return false;

  return true;
}

export function mapWorldcupRowToQuizFact(row: QuizFactWorldcupRow): QuizFact | null {
  if (row.enabled === false) return null;
  if (!isMenQuizFact(row)) return null;

  const metadata = row.metadata ?? {};
  const tagsFromMeta = Array.isArray(metadata.tags)
    ? metadata.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];
  const tags =
    tagsFromMeta.length > 0
      ? tagsFromMeta
      : row.year != null
        ? [String(row.year)]
        : [];

  const imageUrl =
    typeof metadata.image_url === "string" && metadata.image_url.trim()
      ? metadata.image_url.trim()
      : null;

  try {
    const fact = validateQuizFact(
      {
        id: row.id,
        category: row.category,
        fact_type: row.fact_type,
        subject: row.subject,
        value: row.value,
        year: row.year ?? null,
        source_url: row.source_url,
        source_label: row.source_label,
        difficulty: row.difficulty,
        tags,
        image_url: imageUrl,
      },
      0
    );
    const pool = Array.isArray(row.distractor_pool)
      ? row.distractor_pool.filter((d) => typeof d === "string" && d.trim())
      : [];
    return pool.length ? { ...fact, distractor_pool: pool } : fact;
  } catch {
    return null;
  }
}

/** Convierte filas DB en hechos válidos; omite filas rotas sin lanzar. */
export function parseWorldcupFactsRows(rows: QuizFactWorldcupRow[]): QuizFact[] {
  const facts: QuizFact[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.enabled === false) continue;
    const fact = mapWorldcupRowToQuizFact(row);
    if (!fact || seen.has(fact.id)) continue;
    seen.add(fact.id);
    facts.push(fact);
  }
  return facts.sort((a, b) => a.id.localeCompare(b.id));
}

export function mergeFactPools(primary: QuizFact[], fallback: QuizFact[]): QuizFact[] {
  const byId = new Map<string, QuizFact>();
  for (const fact of fallback) byId.set(fact.id, fact);
  for (const fact of primary) byId.set(fact.id, fact);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export async function fetchWorldcupFactsFromDb(
  client = createAdminClient()
): Promise<QuizFact[]> {
  const { data, error } = await client
    .from("quiz_facts_worldcup")
    .select(
      "id, category, fact_type, subject, value, year, difficulty, option_semantic_type, distractor_pool, metadata, source_url, source_label, enabled"
    )
    .eq("enabled", true)
    .order("id", { ascending: true });

  if (error) throw error;
  return parseWorldcupFactsRows((data ?? []) as QuizFactWorldcupRow[]);
}

export type LoadQuizFactsDeps = {
  fetchDb?: () => Promise<QuizFact[]>;
  loadJson?: () => QuizFact[];
  minPool?: number;
  minDay?: number;
  log?: (message: string) => void;
};

/** DB primero; JSON estático como fallback o mezcla si el pool es pequeño. */
export async function loadQuizFactsWithFallback(
  deps: LoadQuizFactsDeps = {}
): Promise<QuizFactsLoadResult> {
  const minPool = deps.minPool ?? MIN_FACTS_POOL;
  const minDay = deps.minDay ?? MIN_FACTS_FOR_DAY;
  const log = deps.log ?? ((msg: string) => console.warn(msg));
  const loadJson = deps.loadJson ?? loadFacts;

  let dbFacts: QuizFact[] = [];
  try {
    dbFacts = await (deps.fetchDb ?? fetchWorldcupFactsFromDb)();
  } catch (err) {
    log(
      `[quiz-facts] quiz_facts_worldcup no disponible: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const jsonFacts = loadJson();

  if (dbFacts.length >= minPool) {
    return { facts: dbFacts, source: "quiz_facts_worldcup" };
  }

  if (dbFacts.length >= minDay) {
    const merged = mergeFactPools(dbFacts, jsonFacts);
    if (merged.length >= minDay) {
      log(
        `[quiz-facts] pool DB pequeño (${dbFacts.length}); mezclando con JSON (${merged.length} hechos).`
      );
      return { facts: merged, source: "hybrid" };
    }
  }

  if (dbFacts.length > 0) {
    log(
      `[quiz-facts] pool DB insuficiente (${dbFacts.length}); usando JSON estático (${jsonFacts.length} hechos).`
    );
  } else {
    log(
      `[quiz-facts] sin hechos en DB; usando JSON estático (${jsonFacts.length} hechos).`
    );
  }

  return { facts: jsonFacts, source: "world-cup-facts.json" };
}
