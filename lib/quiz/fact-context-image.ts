import type { QuizFact } from "@/lib/quiz/facts";

/** Imágenes temáticas por año (no delatan la respuesta del test clásico). */
const IMAGES_BY_YEAR: Record<number, readonly string[]> = {
  1970: ["/images/quiz/historic/1970/wc1970-jairzinho-goal.jpg"],
  1974: ["/images/quiz/historic/1974/wc1974-cruyff-penalty.jpg"],
  1978: ["/images/quiz/historic/1978/wc1978-kempes-celebration.jpg"],
  1982: ["/images/quiz/historic/1982/wc1982-tardelli-goal.jpg"],
  1986: ["/images/quiz/historic/1986/wc1986-maradona-cup.jpg"],
  1990: ["/images/quiz/historic/1990/wc1990-maradona-tears.jpg"],
  1994: ["/images/quiz/historic/1994/wc1994-bebeto-celebration.jpg"],
  1998: ["/images/quiz/historic/1998/wc1998-zidane-final.jpg"],
  2002: ["/images/quiz/historic/2002/wc2002-ronaldinho-freekick.jpg"],
  2006: ["/images/quiz/historic/2006/wc2006-grosso-penalty.jpg"],
  2010: ["/images/quiz/historic/2010/wc2010-sneijder-action.jpg"],
  2014: [
    "/images/quiz/historic/2014/wc2014-james-volley.jpg",
    "/images/quiz/historic/2014/wc2014-cahill-volley.jpg",
  ],
  2018: ["/images/quiz/historic/2018/wc2018-pavard-volley.jpg"],
  2022: ["/images/quiz/historic/2022/wc2022-messi-cup.jpg"],
};

function pickIndex(seed: string, size: number): number {
  if (size <= 0) return 0;
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % size;
}

export function resolveFactContextImage(fact: QuizFact): string | null {
  if (fact.image_url?.trim()) return fact.image_url.trim();
  if (fact.year == null) return null;

  const pool = IMAGES_BY_YEAR[fact.year];
  if (!pool?.length) return null;

  return pool[pickIndex(fact.id, pool.length)] ?? null;
}
