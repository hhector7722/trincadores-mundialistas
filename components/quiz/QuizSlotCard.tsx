import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  canOpenQuizPlay,
  formatQuizSlotStatusLabel,
  getQuizSlotStatus,
} from "@/lib/quiz/slot-status";
import type { QuizDaySlot } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

const primaryLinkClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--tm-accent)] px-5 text-sm font-semibold text-[var(--tm-primary-fg)] transition-colors hover:brightness-110";

const outlineLinkClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] px-5 text-sm font-semibold text-[var(--tm-fg)] backdrop-blur-sm transition-colors hover:border-[var(--tm-accent-muted)]";

type QuizSlotCardProps = {
  title: string;
  subtitle: string;
  slot: QuizDaySlot | null;
  playHref: string;
  resultHref?: string | null;
  pointsLabel: string;
};

export function QuizSlotCard({
  title,
  subtitle,
  slot,
  playHref,
  resultHref,
  pointsLabel,
}: QuizSlotCardProps) {
  const status = getQuizSlotStatus(slot);
  const playable = canOpenQuizPlay(slot);
  const score = slot?.attempt?.status === "submitted" ? slot.attempt.score : null;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
            {title}
          </p>
          <p className="mt-1 text-xs text-[var(--tm-muted)]">{subtitle}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            status === "completed" && "bg-[var(--tm-accent-soft)] text-[var(--tm-accent)]",
            status === "in_progress" && "bg-white/10 text-white",
            status === "expired" && "bg-red-500/15 text-red-300",
            status === "ready" && "bg-white/10 text-[var(--tm-muted)]",
            status === "unavailable" && "bg-white/5 text-[var(--tm-muted)]"
          )}
        >
          {formatQuizSlotStatusLabel(status)}
        </span>
      </div>

      <p className="text-xs text-[var(--tm-muted)]">{pointsLabel}</p>

      {status === "completed" && score !== null && score > 0 && (
        <p className="font-display text-2xl text-[var(--tm-accent)]">
          {score} pts
        </p>
      )}

      {status === "unavailable" ? (
        <p className="text-sm text-[var(--tm-muted)]">Aun no publicado para hoy.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {playable && (
            <Link href={playHref} className={primaryLinkClass}>
              {status === "in_progress"
                ? "Continuar"
                : status === "expired"
                  ? "Nuevo intento"
                  : "Jugar"}
            </Link>
          )}
          {status === "completed" && resultHref && (
            <Link href={resultHref} className={outlineLinkClass}>
              Ver resultado
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
