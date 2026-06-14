import assert from "node:assert/strict";
import test from "node:test";
import { resolveFactContextImage } from "./fact-context-image";
import type { QuizFact } from "./facts";

const BASE_FACT: QuizFact = {
  id: "fj-wc2014-winner",
  category: "history",
  fact_type: "first_winner",
  subject: "Mundial 2014",
  value: "Alemania",
  year: 2014,
  source_url: "https://example.com",
  source_label: "test",
  difficulty: "easy",
  tags: ["2014"],
  image_url: null,
};

test("resolveFactContextImage usa imagen tematica por ano", () => {
  const image = resolveFactContextImage(BASE_FACT);
  assert.ok(image?.startsWith("/images/quiz/historic/2014/"));
});

test("resolveFactContextImage respeta image_url del hecho", () => {
  const image = resolveFactContextImage({
    ...BASE_FACT,
    image_url: "/images/quiz/custom.jpg",
  });
  assert.equal(image, "/images/quiz/custom.jpg");
});
