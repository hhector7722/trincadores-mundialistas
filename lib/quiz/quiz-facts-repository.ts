import { isMenQuizFact, mapWorldcupRowToQuizFact } from "@/lib/quiz/worldcup-facts-source";
import type { AdminClient } from "@/lib/scripts/supabase-admin";
import { upsertChunks } from "@/lib/scripts/supabase-admin";
import type { QuizFactWorldcupRow } from "@/lib/worldcup-data/types";

export const QUIZ_FACTS_WORLDCUP_TABLE = "quiz_facts_worldcup";

export type PrepareFactsResult = {
  valid: QuizFactWorldcupRow[];
  skipped: number;
  duplicateIds: number;
  generated: number;
};

export type UpsertFactsResult = PrepareFactsResult & {
  upserted: number;
};

export function shouldPersistFacts(opts: { insert: boolean; dryRun: boolean }): boolean {
  return opts.insert && !opts.dryRun;
}

/** Valida fila mínima + compatibilidad con el generador diario. */
export function validateWorldcupFactRow(row: QuizFactWorldcupRow): string | null {
  if (row.enabled === false) return "disabled";
  if (!isMenQuizFact(row)) return "not_men";
  if (!row.id?.trim()) return "missing_id";
  if (!row.category?.trim()) return "missing_category";
  if (!row.fact_type?.trim()) return "missing_fact_type";
  if (!row.subject?.trim()) return "missing_subject";
  if (!row.value?.trim()) return "missing_value";
  if (!row.source_url?.trim().startsWith("https://")) return "bad_source_url";
  if (!row.source_label?.trim()) return "missing_source_label";
  if (!row.option_semantic_type?.trim()) return "missing_option_semantic_type";
  if (!["easy", "medium", "hard"].includes(row.difficulty)) return "bad_difficulty";
  if (!mapWorldcupRowToQuizFact(row)) return "invalid_for_quiz";
  return null;
}

/** Filtra válidos, excluye femeninos/disabled/rotos y deduplica por id (último gana). */
export function prepareFactsForUpsert(rows: QuizFactWorldcupRow[]): PrepareFactsResult {
  const byId = new Map<string, QuizFactWorldcupRow>();
  let skipped = 0;
  let accepted = 0;

  for (const row of rows) {
    const reason = validateWorldcupFactRow(row);
    if (reason) {
      skipped += 1;
      continue;
    }
    accepted += 1;
    byId.set(row.id, row);
  }

  const valid = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  return {
    valid,
    skipped,
    duplicateIds: Math.max(0, accepted - valid.length),
    generated: rows.length,
  };
}

export function toUpsertPayload(row: QuizFactWorldcupRow): Record<string, unknown> {
  return {
    id: row.id,
    category: row.category,
    fact_type: row.fact_type,
    subject: row.subject,
    value: row.value,
    year: row.year ?? null,
    difficulty: row.difficulty,
    option_semantic_type: row.option_semantic_type,
    distractor_pool: row.distractor_pool ?? [],
    metadata: row.metadata ?? {},
    source_url: row.source_url,
    source_label: row.source_label,
    enabled: true,
  };
}

export type UpsertWorldcupFactsDeps = {
  upsertChunksFn?: (
    admin: AdminClient,
    table: string,
    rows: Record<string, unknown>[],
    onConflict: string,
    chunkSize?: number
  ) => Promise<number>;
  chunkSize?: number;
};

/** Upsert idempotente por `id` en lotes. */
export async function upsertWorldcupFacts(
  admin: AdminClient,
  rows: QuizFactWorldcupRow[],
  deps: UpsertWorldcupFactsDeps = {}
): Promise<UpsertFactsResult> {
  const prepared = prepareFactsForUpsert(rows);
  if (!prepared.valid.length) {
    return { ...prepared, upserted: 0 };
  }

  const payload = prepared.valid.map(toUpsertPayload);
  const upsertFn = deps.upsertChunksFn ?? upsertChunks;
  const upserted = await upsertFn(
    admin,
    QUIZ_FACTS_WORLDCUP_TABLE,
    payload,
    "id",
    deps.chunkSize ?? 100
  );

  return { ...prepared, upserted };
}
