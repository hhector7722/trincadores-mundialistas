import momentsCatalogRaw from "@/data/quiz/images/world-cup-moments.json";
import {
  parseWorldCupMomentsCatalog,
  type WorldCupMomentsCatalog,
} from "@/lib/quiz/world-cup-moments";

let cachedCatalog: WorldCupMomentsCatalog | null = null;

/** Catálogo embebido en bundle (seguro para cliente / laboratorio). */
export function getWorldCupMomentsCatalog(): WorldCupMomentsCatalog {
  if (!cachedCatalog) {
    cachedCatalog = parseWorldCupMomentsCatalog(momentsCatalogRaw);
  }
  return cachedCatalog;
}
