"use client";

import { useState, type MouseEvent } from "react";
import { AvatarPreviewModal } from "@/components/profile/AvatarPreviewModal";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { MatchPredictionsBoardOutcomeIcons } from "@/components/predictions/MatchPredictionsBoardOutcomeIcons";
import { MATCH_PREDICTIONS_SUBGRID_ROW } from "@/components/predictions/match-predictions-grid";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import type { MatchPredictionsBoardRow as MatchPredictionsBoardRowType } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

function formatGoalCell(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

function formatMvpCell(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "—";
  return shirtPlayerName(trimmed);
}

function CellValue({ value }: { value: string }) {
  return (
    <span className="flex w-full items-center justify-center whitespace-nowrap text-center text-[10px] text-[var(--tm-fg)]">
      {value}
    </span>
  );
}

export function MatchPredictionsBoardRow({
  row,
  isCurrentUser,
  showOutcomes,
}: {
  row: MatchPredictionsBoardRowType;
  isCurrentUser: boolean;
  showOutcomes: boolean;
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
          MATCH_PREDICTIONS_SUBGRID_ROW,
          "tm-ranking-row border-b border-[var(--tm-border)] px-3 text-left last:border-0"
        )}
      >
        <div className="flex justify-center">
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
              className="size-8 shrink-0"
            />
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-0.5">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-xs font-medium",
              isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
            )}
          >
            {row.label}
          </span>
          {showOutcomes ? (
            <MatchPredictionsBoardOutcomeIcons
              scoreOutcome={row.scoreOutcome}
              mvpCorrect={row.mvpCorrect}
            />
          ) : null}
        </div>
        <CellValue value={formatGoalCell(row.homeGoals)} />
        <CellValue value={formatGoalCell(row.awayGoals)} />
        <CellValue value={formatMvpCell(row.mvpPlayerName)} />
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
