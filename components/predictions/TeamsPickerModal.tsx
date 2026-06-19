"use client";

import { useEffect, useMemo, useState } from "react";
import { TeamPickerGridItem, TEAM_PICKER_GRID_CLASS } from "@/components/predictions/TeamPickerGridItem";
import { Modal } from "@/components/ui/modal";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";
import { teamNameEs } from "@/lib/teams/display";
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
  stackElevated?: boolean;
  panelClassName?: string;
  wrapperClassName?: string;
  scrollContent?: boolean;
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
  stackElevated = false,
  panelClassName,
  wrapperClassName,
  scrollContent = true,
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
      stackElevated={stackElevated}
      backButtonPlain={Boolean(onBack)}
      title={title}
      headerTitleAlign="center"
      hideHeaderDivider
      className={panelClassName ?? "max-h-[calc(100dvh-1rem)]"}
      wrapperClassName={wrapperClassName ?? "max-w-[min(100vw-1rem,56rem)]"}
      scrollContent={scrollContent}
      opaque={opaque}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {pickHint ? (
          <p className="shrink-0 border-b border-[var(--tm-border)] px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--tm-muted)]">
            {pickHint}
          </p>
        ) : null}
        <ul className={cn(TEAM_PICKER_GRID_CLASS, "min-h-0 flex-1")}>
        {teams.map((team) => {
          const selectedAsFirst = mode === "pickTwo" && firstFinalist === team;
          return (
            <TeamPickerGridItem
              key={team}
              team={team}
              selected={selectedAsFirst}
              onClick={() => handleTeamClick(team)}
              ariaLabel={
                mode === "view"
                  ? `Ver plantilla de ${teamNameEs(team)}`
                  : `Elegir ${teamNameEs(team)}`
              }
            />
          );
        })}
        </ul>
      </div>
    </Modal>
  );
}
