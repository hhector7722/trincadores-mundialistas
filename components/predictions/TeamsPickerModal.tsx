"use client";

import { useEffect, useMemo, useState } from "react";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Modal } from "@/components/ui/modal";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export type TeamsPickerMode = "view" | "pickOne" | "pickTwo";

type TeamsPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  mode?: TeamsPickerMode;
  title?: string;
  /** Si false, pickOne no cierra el modal (p. ej. paso intermedio antes de elegir jugador). */
  closeOnPick?: boolean;
  onPickTeam?: (teamName: string) => void;
  onPickTwoTeams?: (teamA: string, teamB: string) => void;
  onViewTeam?: (teamName: string) => void;
  opaque?: boolean;
};

export function TeamsPickerModal({
  open,
  onClose,
  onBack,
  mode = "view",
  title = "Plantillas",
  closeOnPick = true,
  onPickTeam,
  onPickTwoTeams,
  onViewTeam,
  opaque = false,
}: TeamsPickerModalProps) {
  const teams = useMemo(() => getAllWorldCupTeamsAlphabetically(), []);
  const [firstFinalist, setFirstFinalist] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setFirstFinalist(null);
  }, [open]);

  const pickHint =
    mode === "pickTwo"
      ? firstFinalist
        ? "Elige el segundo finalista"
        : "Elige el primer finalista"
      : null;

  function handleTeamClick(team: string) {
    if (mode === "view") {
      onViewTeam?.(team);
      return;
    }

    if (mode === "pickOne") {
      onPickTeam?.(team);
      if (closeOnPick) onClose();
      return;
    }

    if (mode === "pickTwo") {
      if (!firstFinalist) {
        setFirstFinalist(team);
        return;
      }
      if (firstFinalist === team) return;
      onPickTwoTeams?.(firstFinalist, team);
      setFirstFinalist(null);
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      onBack={onBack}
      backButtonPlain={Boolean(onBack)}
      title={title}
      headerTitleAlign="center"
      hideHeaderDivider
      className="max-h-[calc(100dvh-1rem)]"
      wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
      opaque={opaque}
    >
      {pickHint ? (
        <p className="shrink-0 border-b border-[var(--tm-border)] px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--tm-muted)]">
          {pickHint}
        </p>
      ) : null}
      <ul className="grid grid-cols-6 items-stretch gap-2 overflow-y-auto p-2.5 sm:gap-2.5 sm:p-3">
        {teams.map((team) => {
          const selectedAsFirst = mode === "pickTwo" && firstFinalist === team;
          return (
            <li key={team} className="flex min-w-0">
              <button
                type="button"
                onClick={() => handleTeamClick(team)}
                aria-label={
                  mode === "view"
                    ? `Ver plantilla de ${teamNameEs(team)}`
                    : `Elegir ${teamNameEs(team)}`
                }
                className={cn(
                  "flex h-[3.75rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-center transition-colors",
                  selectedAsFirst
                    ? "border-[var(--tm-accent)] bg-[rgba(212,255,0,0.12)]"
                    : "border-[var(--tm-border)] bg-[rgba(111,43,255,0.12)]",
                  "hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
                )}
              >
                <TeamFlagBadge name={team} size="sm" className="shrink-0" />
                <span className="w-full min-w-0 truncate text-center text-[8px] font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:text-[10px]">
                  {teamAbbr(team)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
