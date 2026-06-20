import type { QuizQuestionPlay } from "@/lib/quiz/types";

/** Debe coincidir con `sizes` de `QuizImage` (móvil ≈ 640px en deviceSizes de Next). */
export const QUIZ_IMAGE_PREFETCH_WIDTH = 640;

const prefetched = new Set<string>();

/** URLs únicas de imágenes usadas en play (pregunta + revelación de silueta). */
export function collectQuizQuestionImageUrls(questions: QuizQuestionPlay[]): string[] {
  const urls = new Set<string>();

  for (const question of questions) {
    const imageUrl = question.image_url?.trim();
    if (imageUrl) urls.add(imageUrl);

    const revealUrl = question.reveal_image_url?.trim();
    if (revealUrl) urls.add(revealUrl);
  }

  return [...urls];
}

function buildNextImagePrefetchUrl(src: string, width: number): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: "75",
  });
  return `/_next/image?${params.toString()}`;
}

/** Precarga imágenes del quiz en segundo plano (p. ej. durante la entradilla). */
export function prefetchQuizQuestionImages(
  questions: QuizQuestionPlay[],
  width = QUIZ_IMAGE_PREFETCH_WIDTH
): void {
  if (typeof window === "undefined") return;

  for (const src of collectQuizQuestionImageUrls(questions)) {
    const prefetchUrl = buildNextImagePrefetchUrl(src, width);
    if (prefetched.has(prefetchUrl)) continue;
    prefetched.add(prefetchUrl);

    const img = new window.Image();
    img.decoding = "async";
    img.src = prefetchUrl;
  }
}

/** Solo para tests: limpia caché en memoria de URLs ya precargadas. */
export function resetQuizQuestionImagePrefetchCacheForTests(): void {
  prefetched.clear();
}
