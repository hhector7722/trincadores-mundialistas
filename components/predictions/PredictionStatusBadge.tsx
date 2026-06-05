import { Badge } from "@/components/ui/badge";
import type { PredictionUiState } from "@/lib/predictions/edit-state";

const LABELS: Record<PredictionUiState, string> = {
  empty: "Sin marcar",
  draft: "Borrador",
  saved: "Guardada",
  locked: "Cerrada",
};

export function PredictionStatusBadge({ state }: { state: PredictionUiState }) {
  const variant = state === "locked" ? "muted" : state === "saved" ? "default" : "muted";
  return <Badge variant={variant}>{LABELS[state]}</Badge>;
}