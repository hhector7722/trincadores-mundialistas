import catalogRaw from "@/data/quiz/videos/world-cup-video-moments.json";
import {
  parseWorldCupVideoMomentsCatalog,
  type WorldCupVideoMomentsCatalog,
} from "@/lib/quiz/world-cup-video-moments";

let cachedCatalog: WorldCupVideoMomentsCatalog | null = null;

export function getWorldCupVideoMomentsCatalog(): WorldCupVideoMomentsCatalog {
  if (!cachedCatalog) {
    cachedCatalog = parseWorldCupVideoMomentsCatalog(catalogRaw);
  }
  return cachedCatalog;
}
