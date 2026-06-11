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
