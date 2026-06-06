import type { QuizFact } from "@/lib/quiz/facts";
import { shuffleWithRng } from "@/lib/quiz/rng";

const OPTION_IDS = ["a", "b", "c", "d"] as const;

export type McqOption = { id: string; label: string };

function sameFactTypePool(fact: QuizFact, allFacts: QuizFact[]): QuizFact[] {
  return allFacts.filter(
    (f) => f.id !== fact.id && f.fact_type === fact.fact_type && f.value !== fact.value
  );
}

function sameCategoryPool(fact: QuizFact, allFacts: QuizFact[]): QuizFact[] {
  return allFacts.filter(
    (f) => f.id !== fact.id && f.category === fact.category && f.value !== fact.value
  );
}

function labelFromFact(f: QuizFact): string {
  if (f.fact_type === "titles_count") {
    return `${f.value} títulos`;
  }
  return f.value;
}

export function buildDistractorLabels(
  fact: QuizFact,
  correctLabel: string,
  allFacts: QuizFact[],
  rng: () => number,
  count = 3
): string[] {
  const pools = [
    sameFactTypePool(fact, allFacts),
    sameCategoryPool(fact, allFacts),
    allFacts.filter((f) => f.id !== fact.id),
  ];

  const seen = new Set<string>([correctLabel.toLowerCase()]);
  const distractors: string[] = [];

  for (const pool of pools) {
    const shuffled = shuffleWithRng(pool, rng);
    for (const candidate of shuffled) {
      const label = labelFromFact(candidate);
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      distractors.push(label);
      if (distractors.length >= count) return distractors;
    }
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
