"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { formatPredictionInsightUpdatedAgo } from "@/lib/ai-predictions/format-updated-ago";
import { predictionInsightSourceLabel } from "@/lib/ai-predictions/source-config";
import type { PredictionInsight } from "@/lib/ai-predictions/types";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type AiPredictionModalProps = {
  open: boolean;
  onClose: () => void;
  homeTeam: string;
  awayTeam: string;
  insight: PredictionInsight | null;
  loading: boolean;
  error: string | null;
};

function InsightField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-3 first:pt-0", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tm-muted)]">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed text-[var(--tm-fg)]">{children}</div>
    </div>
  );
}

function formatProb(value: number): string {
  if (!Number.isFinite(value)) return " ";
  const rounded = Math.round(value);
  return rounded === 0 ? " " : `${rounded}%`;
}

export function AiPredictionModal({
  open,
  onClose,
  homeTeam,
  awayTeam,
  insight,
  loading,
  error,
}: AiPredictionModalProps) {
  const homeLabel = teamNameEs(homeTeam);
  const awayLabel = teamNameEs(awayTeam);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Predicción IA"
      usageId="ai-prediction-insight"
      usageLabel="Predicción IA"
      className="max-h-[min(78dvh,36rem)]"
      loading={loading}
      headerTitleAlign="left"
      stackElevated
    >
      <div className="divide-y divide-[var(--tm-border)] px-4 pb-4">
        {error ? (
          <p className="py-6 text-center text-sm text-[var(--tm-danger)]" role="alert">
            {error}
          </p>
        ) : insight ? (
          <>
            <InsightField label="Pronóstico principal">
              <p className="font-display text-base font-semibold normal-case tracking-normal text-[var(--tm-accent)]">
                {insight.mainPrediction}
              </p>
            </InsightField>

            <InsightField label="Confianza">{insight.confidence}</InsightField>

            <InsightField label="MVP probable">{insight.mvpPlayerName}</InsightField>

            <InsightField label="Probabilidades">
              <ul className="space-y-1">
                <li>
                  {homeLabel} {formatProb(insight.homeWinProb)}
                </li>
                <li>Empate {formatProb(insight.drawProb)}</li>
                <li>
                  {awayLabel} {formatProb(insight.awayWinProb)}
                </li>
              </ul>
            </InsightField>

            <InsightField label="Análisis">
              <p className="whitespace-pre-line">{insight.analysis}</p>
            </InsightField>

            {insight.alternatives.length > 0 ? (
              <InsightField label="Alternativas">
                <p>{insight.alternatives.join(" · ")}</p>
              </InsightField>
            ) : null}

            <InsightField label="Última actualización" className="pb-0">
              <p className="text-[var(--tm-muted)]">
                {formatPredictionInsightUpdatedAgo(insight.updatedAt)}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--tm-muted)]">
                Fuente: {predictionInsightSourceLabel(insight.sourceCode)}
              </p>
            </InsightField>
          </>
        ) : (
          <div className="py-8" aria-hidden="true" />
        )}
      </div>
    </Modal>
  );
}
