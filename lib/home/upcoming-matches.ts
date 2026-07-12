import type { MatchWithPrediction } from "@/lib/predictions/queries";

/** Partidos visibles en el carrusel de inicio: próximos + en juego (+ último finalizado). */
export function selectHomeCarouselMatches(
  matches: MatchWithPrediction[]
): MatchWithPrediction[] {
  const upcoming = matches.filter(
    (match) => match.status === "scheduled" || match.status === "live"
  );

  if (upcoming.length > 0) {
    return upcoming;
  }

  const lastFinished = [...matches]
    .filter((match) => match.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime()
    )[0];

  return lastFinished ? [lastFinished] : [];
}
