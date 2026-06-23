import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MADRID_TZ = "Europe/Madrid";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type DailyFact = {
  id: string;
  text: string;
};

export const DEFAULT_DAILY_FACTS_PATH = resolve(
  process.cwd(),
  "data/home/worldcup-daily-facts.json"
);

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Fecha civil YYYY-MM-DD en Europe/Madrid (sin parsear ISO date-only nativo). */
export function todayDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function validateDailyFact(raw: unknown, index: number): DailyFact {
  if (!raw || typeof raw !== "object") {
    throw new Error(`daily-facts[${index}]: objeto invalido.`);
  }
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const text = typeof row.text === "string" ? row.text.trim() : "";

  if (!id) throw new Error(`daily-facts[${index}]: id vacio.`);
  if (!text) throw new Error(`daily-facts[${index}]: text vacio.`);

  return { id, text };
}

export function parseDailyFactsFile(raw: unknown): DailyFact[] {
  if (!Array.isArray(raw)) {
    throw new Error("El banco de curiosidades debe ser un array.");
  }
  const facts = raw.map((item, index) => validateDailyFact(item, index));
  const ids = new Set<string>();
  for (const fact of facts) {
    if (ids.has(fact.id)) {
      throw new Error(`daily-fact id duplicado: ${fact.id}`);
    }
    ids.add(fact.id);
  }
  return facts;
}

export function loadDailyFacts(path = DEFAULT_DAILY_FACTS_PATH): DailyFact[] {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseDailyFactsFile(raw);
}

/** Selección determinista: misma fecha → mismo dato para todos los usuarios. */
export function pickDailyFactForDate(dateKey: string, facts: DailyFact[]): DailyFact | null {
  if (!DATE_RE.test(dateKey) || facts.length === 0) return null;
  const index = hashString(`daily-fact:${dateKey}`) % facts.length;
  return facts[index] ?? null;
}

export function getDailyFactForDate(
  dateKey: string,
  path = DEFAULT_DAILY_FACTS_PATH
): DailyFact | null {
  const facts = loadDailyFacts(path);
  return pickDailyFactForDate(dateKey, facts);
}

export function getDailyFactForToday(now = new Date()): DailyFact | null {
  return getDailyFactForDate(todayDateKey(now));
}

export function getDailyFactsHistory(
  now = new Date(),
  startDateKey = "2026-06-11",
  path = DEFAULT_DAILY_FACTS_PATH
): DailyFact[] {
  const facts = loadDailyFacts(path);
  if (facts.length === 0) return [];

  const todayKey = todayDateKey(now);
  const result: DailyFact[] = [];
  
  // Create a date object for the start date at noon Madrid time to avoid timezone edge cases
  const current = new Date(`${startDateKey}T12:00:00+02:00`);
  const today = new Date(`${todayKey}T12:00:00+02:00`);

  // Generate sequence from start date up to today
  while (current <= today) {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(current);

    const fact = pickDailyFactForDate(key, facts);
    if (fact) {
      // Deduplicate consecutive facts or previously seen facts if desired
      // but pickDailyFactForDate already guarantees determinism.
      // We will just add it.
      if (!result.find(f => f.id === fact.id)) {
        result.push(fact);
      }
    }
    current.setDate(current.getDate() + 1);
  }

  // Ensure we don't return empty if today is before start date, return at least today's
  if (result.length === 0) {
    const fallback = getDailyFactForToday(now);
    if (fallback) result.push(fallback);
  }

  return result; // Oldest first, newest last
}
