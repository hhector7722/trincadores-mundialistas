import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type QuizFactCategory =
  | "history"
  | "records"
  | "hosts"
  | "teams"
  | "players"
  | "curiosities";

export type QuizFactType =
  | "first_winner"
  | "host_country"
  | "top_scorer"
  | "titles_count"
  | "record_value"
  | "curiosity";

export type QuizFactDifficulty = "easy" | "medium" | "hard";

export type QuizFact = {
  id: string;
  category: QuizFactCategory;
  fact_type: QuizFactType;
  subject: string;
  value: string;
  year: number | null;
  source_url: string;
  source_label: string;
  difficulty: QuizFactDifficulty;
  tags: string[];
  /** Imagen tematica (no debe delatar la respuesta). Ruta publica o URL https. */
  image_url: string | null;
  /** Pool opcional desde DB cuando el banco semántico es pequeño. */
  distractor_pool?: string[];
};

const FACT_TYPES = new Set<QuizFactType>([
  "first_winner",
  "host_country",
  "top_scorer",
  "titles_count",
  "record_value",
  "curiosity",
]);

const CATEGORIES = new Set<QuizFactCategory>([
  "history",
  "records",
  "hosts",
  "teams",
  "players",
  "curiosities",
]);

export const DEFAULT_FACTS_PATH = resolve(
  process.cwd(),
  "data/quiz/facts/world-cup-facts.json"
);

export function validateQuizFact(raw: unknown, index: number): QuizFact {
  if (!raw || typeof raw !== "object") {
    throw new Error(`facts[${index}]: objeto invalido.`);
  }
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const category = row.category;
  const factType = row.fact_type;
  const subject = typeof row.subject === "string" ? row.subject.trim() : "";
  const value = typeof row.value === "string" ? row.value.trim() : "";
  const sourceUrl = typeof row.source_url === "string" ? row.source_url.trim() : "";
  const sourceLabel = typeof row.source_label === "string" ? row.source_label.trim() : "";
  const difficulty = row.difficulty;

  if (!id) throw new Error(`facts[${index}]: id vacio.`);
  if (!CATEGORIES.has(category as QuizFactCategory)) {
    throw new Error(`facts[${index}]: category invalida.`);
  }
  if (!FACT_TYPES.has(factType as QuizFactType)) {
    throw new Error(`facts[${index}]: fact_type invalido.`);
  }
  if (!subject) throw new Error(`facts[${index}]: subject vacio.`);
  if (!value) throw new Error(`facts[${index}]: value vacio.`);
  if (!sourceUrl.startsWith("https://")) {
    throw new Error(`facts[${index}]: source_url debe ser https.`);
  }
  if (!sourceLabel) throw new Error(`facts[${index}]: source_label vacio.`);

  const year =
    row.year === null || row.year === undefined
      ? null
      : typeof row.year === "number" && Number.isInteger(row.year)
        ? row.year
        : null;

  const tags = Array.isArray(row.tags)
    ? row.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  const imageUrlRaw = row.image_url;
  const imageUrl =
    typeof imageUrlRaw === "string" && imageUrlRaw.trim().length > 0
      ? imageUrlRaw.trim()
      : null;

  return {
    id,
    category: category as QuizFactCategory,
    fact_type: factType as QuizFactType,
    subject,
    value,
    year,
    source_url: sourceUrl,
    source_label: sourceLabel,
    difficulty: difficulty === "medium" || difficulty === "hard" ? difficulty : "easy",
    tags,
    image_url: imageUrl,
  };
}

export function parseFactsFile(raw: unknown): QuizFact[] {
  if (!Array.isArray(raw)) {
    throw new Error("El banco de hechos debe ser un array.");
  }
  const facts = raw.map((item, index) => validateQuizFact(item, index));
  const ids = new Set<string>();
  for (const fact of facts) {
    if (ids.has(fact.id)) {
      throw new Error(`fact id duplicado: ${fact.id}`);
    }
    ids.add(fact.id);
  }
  return facts;
}

export function loadFacts(path = DEFAULT_FACTS_PATH): QuizFact[] {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return parseFactsFile(raw);
}
