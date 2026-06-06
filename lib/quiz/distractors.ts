import type { QuizFact } from "@/lib/quiz/facts";
import { shuffleWithRng } from "@/lib/quiz/rng";

const OPTION_IDS = ["a", "b", "c", "d"] as const;

export type McqOption = { id: string; label: string };

export type OptionSemanticType =
  | "country"
  | "player"
  | "year"
  | "title_count"
  | "record_stat"
  | "goal_stat"
  | "mundial_edition";

export function getOptionSemanticType(fact: QuizFact): OptionSemanticType {
  switch (fact.fact_type) {
    case "first_winner":
    case "host_country":
      return "country";
    case "top_scorer":
      return "player";
    case "titles_count":
      return "title_count";
    case "record_value":
      return "record_stat";
    case "curiosity":
      if (fact.value.toLowerCase().startsWith("mundial ")) return "mundial_edition";
      if (/^(19|20)\d{2}$/.test(fact.value)) return "year";
      if (fact.category === "players") return "player";
      if (fact.category === "hosts" || fact.category === "history") return "country";
      if (fact.category === "teams") return "title_count";
      if (fact.tags.some((t) => /^\d{4}$/.test(t))) return "year";
      if (fact.value.includes("segundos") || fact.subject.toLowerCase().includes("gol")) {
        return "goal_stat";
      }
      return "record_stat";
    default:
      return "record_stat";
  }
}

function labelFromFact(fact: QuizFact, semanticType: OptionSemanticType): string {
  if (semanticType === "title_count") {
    return `${fact.value} títulos`;
  }
  if (semanticType === "year") {
    if (/^(19|20)\d{2}$/.test(fact.value)) return fact.value;
    if (fact.year) return String(fact.year);
  }
  return fact.value;
}

function factMatchesSemanticType(fact: QuizFact, semanticType: OptionSemanticType): boolean {
  return getOptionSemanticType(fact) === semanticType;
}

function sameSemanticPool(
  fact: QuizFact,
  allFacts: QuizFact[],
  semanticType: OptionSemanticType
): QuizFact[] {
  if (semanticType === "year") {
    const correctYear = fact.year ?? Number(fact.value);
    return allFacts.filter(
      (f) =>
        f.id !== fact.id &&
        f.year !== null &&
        f.year !== correctYear &&
        Number.isInteger(f.year)
    );
  }

  return allFacts.filter(
    (f) =>
      f.id !== fact.id &&
      f.value !== fact.value &&
      factMatchesSemanticType(f, semanticType)
  );
}

export function buildDistractorLabels(
  fact: QuizFact,
  correctLabel: string,
  allFacts: QuizFact[],
  rng: () => number,
  count = 3
): string[] {
  const semanticType = getOptionSemanticType(fact);
  const pool = sameSemanticPool(fact, allFacts, semanticType);
  const seen = new Set<string>([correctLabel.toLowerCase()]);
  const distractors: string[] = [];

  const shuffled = shuffleWithRng(pool, rng);
  for (const candidate of shuffled) {
    const label = labelFromFact(candidate, semanticType);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    distractors.push(label);
    if (distractors.length >= count) break;
  }

  return distractors;
}

export function buildMcqOptions(
  correctLabel: string,
  distractorLabels: string[],
  rng: () => number
): { options: McqOption[]; correct_option_id: string } {
  const uniqueDistractors = distractorLabels.filter(
    (d) => d.toLowerCase() !== correctLabel.toLowerCase()
  );

  if (uniqueDistractors.length < 3) {
    throw new Error("No hay suficientes distractores unicos.");
  }

  const labels = shuffleWithRng(
    [correctLabel, ...uniqueDistractors.slice(0, 3)],
    rng
  );

  const options = labels.map((label, index) => ({
    id: OPTION_IDS[index],
    label,
  }));

  const correctIndex = labels.findIndex(
    (l) => l.toLowerCase() === correctLabel.toLowerCase()
  );
  if (correctIndex < 0) {
    throw new Error("La respuesta correcta no esta en las opciones.");
  }

  return {
    options,
    correct_option_id: OPTION_IDS[correctIndex],
  };
}
