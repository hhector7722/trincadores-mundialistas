"use client";

import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";

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
  const savedLabel =
    savedPlayerName && compact ? shirtPlayerName(savedPlayerName) : savedPlayerName;

  return (
    <MatchContextActionButton
      caption={compact ? "MVP" : "MVP +"}
      onClick={onClick}
      savedValue={savedLabel}
      showEdit
      addIcon={!compact}
      hideCaption={compact}
      emptyLabel={compact ? "Añadir MVP" : undefined}
      className={className}
    />
  );
}
