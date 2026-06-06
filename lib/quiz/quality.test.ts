import assert from "node:assert/strict";
import test from "node:test";
import type { QuizFact } from "./facts";
import { validateSemanticCoherence, validateGeneratedQuestion } from "./quality";
import type { GeneratedQuizQuestion } from "./generate-question";

const playerFact: QuizFact = {
  id: "wc-oldest-scorer",
  category: "players",
  fact_type: "curiosity",
  subject: "¿Quién es el jugador más veterano en marcar en un Mundial?",
  value: "Roger Milla",
  year: 1994,
  source_url: "https://www.fifa.com/example",
  source_label: "FIFA",
  difficulty: "hard",
  tags: [],
  image_url: null,
};

test("validateSemanticCoherence rejects mixed player and mundial options", () => {
  const question: GeneratedQuizQuestion = {
    sort_order: 1,
    prompt: "¿Quién es el jugador más veterano en marcar en un Mundial?",
    image_url: null,
    options: [
      { id: "a", label: "Mundial 2006" },
      { id: "b", label: "Roger Milla" },
      { id: "c", label: "Mundial 1958" },
      { id: "d", label: "11 segundos (Hakan Şükür, 2002)" },
    ],
    correct_option_id: "b",
    fact_id: "wc-oldest-scorer",
    source_url: "https://www.fifa.com/example",
    source_label: "FIFA",
    template_id: "curiosity",
    category: "players",
  };

  const result = validateSemanticCoherence(question, playerFact);
  assert.equal(result.ok, false);
});

test("validateGeneratedQuestion accepts coherent player options", () => {
  const question: GeneratedQuizQuestion = {
    sort_order: 1,
    prompt: "¿Quién es el jugador más veterano en marcar en un Mundial?",
    image_url: null,
    options: [
      { id: "a", label: "Miroslav Klose" },
      { id: "b", label: "Roger Milla" },
      { id: "c", label: "Lionel Messi" },
      { id: "d", label: "Cafu" },
    ],
    correct_option_id: "b",
    fact_id: "wc-oldest-scorer",
    source_url: "https://www.fifa.com/example",
    source_label: "FIFA",
    template_id: "curiosity",
    category: "players",
  };

  assert.equal(validateGeneratedQuestion(question, playerFact).ok, true);
});
