"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { Lightbulb } from "lucide-react";
import { fetchPredictionInsightAction } from "@/actions/ai-predictions";
import { AiPredictionModal } from "@/components/predictions/AiPredictionModal";
import { canAccessAiPrediction } from "@/lib/ai-predictions/access";
import type { PredictionInsight } from "@/lib/ai-predictions/types";
import { useCurrentUsername } from "@/lib/auth/current-username-context";
import { cn } from "@/lib/utils";

type AiPredictionTriggerProps = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  className?: string;
  iconClassName?: string;
};

export function AiPredictionTrigger({
  matchId,
  homeTeam,
  awayTeam,
  className,
  iconClassName,
}: AiPredictionTriggerProps) {
  const username = useCurrentUsername();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<PredictionInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = canAccessAiPrediction(username);

  const handleOpen = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      setOpen(true);
      setLoading(true);
      setError(null);
      setInsight(null);

      void fetchPredictionInsightAction(matchId).then((result) => {
        setLoading(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setInsight(result.insight);
      });
    },
    [matchId],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  if (!allowed) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Predicción IA"
        onClick={handleOpen}
        className={cn(
          "inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center",
          "text-[var(--tm-muted)] transition-colors hover:text-[var(--tm-accent)]",
          className,
        )}
      >
        <Lightbulb
          className={cn("h-3.5 w-3.5", iconClassName)}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>

      <AiPredictionModal
        open={open}
        onClose={handleClose}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        insight={insight}
        loading={loading}
        error={error}
      />
    </>
  );
}
