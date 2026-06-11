import { cn } from "@/lib/utils";

type LiveScoreDisplayProps = {
  score: number;
  className?: string;
};

/** Marcador real en vivo (tipografía compartida home/modal). */
export function LiveScoreDisplay({ score, className }: LiveScoreDisplayProps) {
  return (
    <span
      className={cn(
        "font-display text-[2.5rem] font-semibold leading-none text-white/95 tabular-nums sm:text-[2.75rem]",
        className,
      )}
    >
      {score}
    </span>
  );
}

type LiveMatchScoreOverlayProps = {
  homeScore: number;
  awayScore: number;
  /** `modal` = 34/66 como partido finalizado; `card` = 32.5/67.5 como card inicio. */
  variant?: "modal" | "card";
  className?: string;
};

function formatLiveGoal(value: number): string {
  return String(value);
}

/** Marcador en vivo posicionado entre bandera y centro (misma lógica que FinishedMatchScoreRow). */
export function LiveMatchScoreOverlay({
  homeScore,
  awayScore,
  variant = "modal",
  className,
}: LiveMatchScoreOverlayProps) {
  const homeLeft = variant === "modal" ? "34%" : "32.5%";
  const awayLeft = variant === "modal" ? "66%" : "67.5%";
  const topClass = variant === "modal" ? "top-[1.15rem]" : "top-[2.125rem]";
  const rowHeight = variant === "modal" ? "h-10 sm:h-11" : "";

  const scoreClass =
    variant === "modal"
      ? "font-display text-2xl font-semibold tabular-nums leading-none text-white/95"
      : "font-display text-[2.5rem] font-semibold tabular-nums leading-none text-white/95 sm:text-[2.75rem]";

  return (
    <div className={cn("pointer-events-none absolute inset-x-0", topClass, rowHeight, className)}>
      <div
        className={cn("absolute -translate-x-1/2 text-center", scoreClass)}
        style={{ left: homeLeft }}
      >
        {formatLiveGoal(homeScore)}
      </div>
      <div
        className={cn("absolute -translate-x-1/2 text-center", scoreClass)}
        style={{ left: awayLeft }}
      >
        {formatLiveGoal(awayScore)}
      </div>
    </div>
  );
}
