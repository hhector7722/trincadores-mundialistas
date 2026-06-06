import { cn } from "@/lib/utils";

type QuizModeBadgeProps = {
  competitive: boolean;
  scoringMode?: "training" | "competitive";
  className?: string;
};

export function QuizModeBadge({
  competitive,
  scoringMode,
  className,
}: QuizModeBadgeProps) {
  const training = scoringMode === "training" || !competitive;

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.12em]",
        training
          ? "bg-white/10 text-white/70 ring-1 ring-white/15"
          : "bg-[var(--tm-accent-soft)] text-[var(--tm-accent)] ring-1 ring-[var(--tm-accent-muted)]",
        className
      )}
    >
      {training ? "Entrenamiento" : "Competitivo"}
    </span>
  );
}
