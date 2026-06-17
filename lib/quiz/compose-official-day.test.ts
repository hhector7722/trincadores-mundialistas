import assert from "node:assert/strict";
import test from "node:test";
import { composeOfficialQuizDay } from "./compose-official-day";
import type { GeneratedQuizQuestion } from "./generate-question";
import type { LabQuestion } from "./lab/types";

const classicQuestion: GeneratedQuizQuestion = {
  sort_order: 1,
  prompt: "Pregunta clasica",
  image_url: "/images/quiz/historic/1982/wc1982-tardelli-goal.jpg",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
    { id: "d", label: "D" },
  ],
  correct_option_id: "a",
  fact_id: "fact-1",
  source_url: "https://example.com",
  source_label: "Ejemplo",
  template_id: "winner",
  category: "history",
};

const labQuestions: LabQuestion[] = [
  {
    id: "lab-1",
    format: "image_trivia",
    prompt: "Imagen",
    imageUrl: "/images/quiz/historic/2010/wc2010-sneijder-action.jpg",
    options: [
      { id: "o1", label: "1" },
      { id: "o2", label: "2" },
      { id: "o3", label: "3" },
      { id: "o4", label: "4" },
    ],
    correctOptionId: "o1",
    momentId: "moment-1",
  },
  {
    id: "lab-2",
    format: "guess_player_silhouette",
    prompt: "Silueta",
    imageUrl: "/images/quiz/lab/silhouette.jpg",
    revealImageUrl: "/images/quiz/lab/reveal.jpg",
    options: [
      { id: "o1", label: "1" },
      { id: "o2", label: "2" },
      { id: "o3", label: "3" },
      { id: "o4", label: "4" },
    ],
    correctOptionId: "o1",
    momentId: "moment-2",
  },
];

test("composeOfficialQuizDay mantiene imagen en pregunta 1 antes del corte", () => {
  const result = composeOfficialQuizDay({
    quizDate: "2026-06-17",
    classicQuestion,
    labQuestions,
  });

  assert.equal(result.payload.official.questions[0]?.image_url, classicQuestion.image_url);
});

test("composeOfficialQuizDay quita imagen en pregunta 1 desde el corte", () => {
  const result = composeOfficialQuizDay({
    quizDate: "2026-06-18",
    classicQuestion,
    labQuestions,
  });

  assert.equal(result.payload.official.questions[0]?.image_url, null);
  assert.ok(result.payload.official.questions[1]?.image_url);
});
