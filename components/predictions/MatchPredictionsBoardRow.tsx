"use client";

import { useState, type MouseEvent } from "react";
import { AvatarPreviewModal } from "@/components/profile/AvatarPreviewModal";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { MatchPredictionsBoardMvpLabel } from "@/components/predictions/MatchPredictionsBoardMvpLabel";
import {
  MatchPredictionsBoardOutcomeIconTicks,
  MatchPredictionsBoardPointsLabel,
} from "@/components/predictions/MatchPredictionsBoardOutcomeIcons";
import { matchPredictionsSubgridRow } from "@/components/predictions/match-predictions-grid";
import type { MatchPlayerIncident } from "@/lib/live/types";
import type { MatchPredictionsBoardRow as MatchPredictionsBoardRowType } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

function formatGoalCell(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

function CellValue({ value }: { value: string }) {
  return (
    <span className="flex h-full w-full items-center justify-center whitespace-nowrap text-center text-[10px] leading-none text-[var(--tm-fg)]">
      {value}
    </span>
  );
}

export function MatchPredictionsBoardRow({
  row,
  isCurrentUser,
  showOutcomes,
  playerIncidents,
}: {
  row: MatchPredictionsBoardRowType;
  isCurrentUser: boolean;
  showOutcomes: boolean;
  playerIncidents: MatchPlayerIncident[];
}) {
  const [avatarOpen, setAvatarOpen] = useState(false);
  const canPreview = Boolean(row.avatarUrl);

  function onAvatarActivate(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!canPreview) return;
    setAvatarOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          matchPredictionsSubgridRow(showOutcomes),
          "tm-ranking-row border-b border-[var(--tm-border)] px-3 text-left last:border-0"
        )}
      >
        <div className="flex h-full items-center justify-center">
          <button
            type="button"
            disabled={!canPreview}
            aria-label={canPreview ? `Ver avatar de ${row.label}` : undefined}
            onClick={onAvatarActivate}
            className={cn(
              "shrink-0 rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--tm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tm-purple-deep)] disabled:cursor-default disabled:active:scale-100",
              canPreview && "cursor-pointer"
            )}
          >
            <ProfileAvatar
              avatarUrl={row.avatarUrl}
              label={row.label}
              variant="badge"
              className="size-5 shrink-0"
            />
          </button>
        </div>
        <span
          className={cn(
            "flex h-full min-w-0 items-center truncate text-xs font-medium leading-none",
            isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
          )}
        >
          {row.label}
        </span>
        {showOutcomes ? (
          <>
            <div className="flex h-full items-center justify-center">
              <MatchPredictionsBoardPointsLabel
                scoreOutcome={row.scoreOutcome}
                mvpCorrect={row.mvpCorrect}
              />
            </div>
            <div className="flex h-full items-center justify-start">
              <MatchPredictionsBoardOutcomeIconTicks
                scoreOutcome={row.scoreOutcome}
                mvpCorrect={row.mvpCorrect}
              />
            </div>
          </>
        ) : null}
        <CellValue value={formatGoalCell(row.homeGoals)} />
        <CellValue value={formatGoalCell(row.awayGoals)} />
        <MatchPredictionsBoardMvpLabel
          playerName={row.mvpPlayerName}
          playerIncidents={playerIncidents}
        />
      </div>
      {canPreview ? (
        <AvatarPreviewModal
          open={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          avatarUrl={row.avatarUrl!}
          label={row.label}
        />
      ) : null}
    </>
  );
}
