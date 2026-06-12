import { Badge } from "@/components/ui/badge";
import type { PredictionUiState } from "@/lib/predictions/edit-state";
import type { ScoreOutcome } from "@/lib/predictions/prediction-outcome";
import { cn } from "@/lib/utils";

const EDIT_LABELS: Record<PredictionUiState, string> = {
  empty: "Sin marcar",
  draft: "Borrador",
  saved: "Guardada",
  locked: "Cerrada",
};

const OUTCOME_BORDER_CLASS: Record<ScoreOutcome, string> = {
  exact: "bg-[var(--tm-cal-outcome-exact)]",
  sign: "bg-[var(--tm-cal-outcome-sign)]",
  miss: "bg-[var(--tm-cal-outcome-miss)]",
};

/** Clases del contenedor interior de cards del calendario (marcador/hora). */
export const calendarMatchCardBodyClass =
  "tm-cal-match-card-body relative overflow-hidden rounded-[2px] bg-white/10";

/** Badge textual para formularios y listas de predicción (estado de edición). */
export function PredictionEditStateBadge({ state }: { state: PredictionUiState }) {
  const variant = state === "locked" ? "muted" : state === "saved" ? "default" : "muted";
  return <Badge variant={variant}>{EDIT_LABELS[state]}</Badge>;
}

/**
 * Capa primaria de resultado en cards del calendario: barra izquierda de 4px.
 * Debe renderizarse dentro de `calendarMatchCardBodyClass`, nunca en el wrapper exterior.
 */
export function PredictionStatusBadge({
  outcome,
  className,
}: {
  outcome: ScoreOutcome | null;
  className?: string;
}) {
  if (!outcome) return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 z-[5] w-[4px]",
        OUTCOME_BORDER_CLASS[outcome],
        className,
      )}
      aria-hidden
    />
  );
}
