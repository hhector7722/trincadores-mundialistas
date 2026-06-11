import { cn } from "@/lib/utils";

type LiveMatchScorePairProps = {
  homeScore: number;
  awayScore: number;
  homeAnchor?: string;
  awayAnchor?: string;
  className?: string;
};

/** Marcador real en blanco, alineado entre banderas y pronóstico. */
export function LiveMatchScorePair({
  homeScore,
  awayScore,
  homeAnchor = "15%",
  awayAnchor = "85%",
  className,
}: LiveMatchScorePairProps) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute -translate-x-1/2 font-display text-[2.5rem] font-semibold leading-none text-white/95 sm:text-[2.75rem]",
          className,
        )}
        style={{ left: homeAnchor, top: "2.125rem" }}
      >
        {homeScore}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute -translate-x-1/2 font-display text-[2.5rem] font-semibold leading-none text-white/95 sm:text-[2.75rem]",
          className,
        )}
        style={{ left: awayAnchor, top: "2.125rem" }}
      >
        {awayScore}
      </div>
    </>
  );
}
