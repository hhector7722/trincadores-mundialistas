import assert from "node:assert/strict";
import test from "node:test";
import {
  collectQuizQuestionImageUrls,
  resetQuizQuestionImagePrefetchCacheForTests,
} from "@/lib/quiz/prefetch-question-images";
import type { QuizQuestionPlay } from "@/lib/quiz/types";

function question(
  partial: Pick<QuizQuestionPlay, "image_url"> &
    Partial<Pick<QuizQuestionPlay, "reveal_image_url">>
): QuizQuestionPlay {
  return {
    id: "q1",
    sort_order: 1,
    prompt: "Pregunta",
    options: [{ id: "a", label: "A" }],
    points: 1,
    correct_option_id: "a",
    ...partial,
  };
}

test("collectQuizQuestionImageUrls incluye imagen y revelación sin duplicados", () => {
  const urls = collectQuizQuestionImageUrls([
    question({ image_url: "/images/quiz/a.jpg" }),
    question({
      image_url: "/images/quiz/silhouette.jpg",
      reveal_image_url: "/images/quiz/reveal.jpg",
    }),
    question({ image_url: "/images/quiz/a.jpg" }),
  ]);

  assert.deepEqual(urls.sort(), [
    "/images/quiz/a.jpg",
    "/images/quiz/reveal.jpg",
    "/images/quiz/silhouette.jpg",
  ]);
});

test("collectQuizQuestionImageUrls ignora URLs vacías", () => {
  const urls = collectQuizQuestionImageUrls([
    question({ image_url: null }),
    question({ image_url: "  ", reveal_image_url: "  " }),
  ]);

  assert.equal(urls.length, 0);
});

test.after(() => {
  resetQuizQuestionImagePrefetchCacheForTests();
});
