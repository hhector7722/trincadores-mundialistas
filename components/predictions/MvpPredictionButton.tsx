"use client";

import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";

type MvpPredictionButtonProps = {
  savedPlayerName?: string | null;
  onClick: () => void;
  className?: string;
};

/** Botón reutilizable para abrir el selector de MVP del partido. */
export function MvpPredictionButton({
  savedPlayerName,
  onClick,
  className,
}: MvpPredictionButtonProps) {
  return (
    <MatchContextActionButton
      caption="MVP +"
      onClick={onClick}
      savedValue={savedPlayerName}
      showEdit
      addIcon
      className={className}
    />
  );
}
