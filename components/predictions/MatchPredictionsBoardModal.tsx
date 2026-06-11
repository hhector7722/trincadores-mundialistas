"use client";

import { MatchPredictionsBoardTable } from "@/components/predictions/MatchPredictionsBoardTable";
import { Modal } from "@/components/ui/modal";
import type { MatchPredictionsBoard } from "@/lib/predictions/queries";
import { teamNameEs } from "@/lib/teams/display";

type MatchPredictionsBoardModalProps = {
  open: boolean;
  onClose: () => void;
  board: MatchPredictionsBoard;
  currentProfileId: string;
};

export function MatchPredictionsBoardModal({
  open,
  onClose,
  board,
  currentProfileId,
}: MatchPredictionsBoardModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${teamNameEs(board.homeTeam)} vs ${teamNameEs(board.awayTeam)}`}
      className="max-w-lg"
      scrollContent
    >
      <MatchPredictionsBoardTable
        rows={board.rows}
        currentProfileId={currentProfileId}
        homeTeam={board.homeTeam}
        awayTeam={board.awayTeam}
      />
    </Modal>
  );
}
