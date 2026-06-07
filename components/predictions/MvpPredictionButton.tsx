"use client";

import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";

type MvpPredictionButtonProps = {
  savedPlayerName?: string | null;
  onClick: () => void;
  variant?: "default" | "compact";
  className?: string;
};

/** Botón reutilizable para abrir el selector de MVP del partido. */
export function MvpPredictionButton({
  savedPlayerName,
  onClick,
  variant = "default",
  className,
}: MvpPredictionButtonProps) {
  const compact = variant === "compact";

  return (
    <MatchContextActionButton
      caption={compact ? "MVP" : "MVP +"}
      onClick={onClick}
      savedValue={savedPlayerName}
      showEdit
      addIcon={!compact}
      hideCaption={compact}
      emptyLabel={compact ? "Añadir" : undefined}
      className={className}
    />
  );
}
