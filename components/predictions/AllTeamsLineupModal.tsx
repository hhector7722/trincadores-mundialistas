"use client";

import { useMemo, useState } from "react";
import {
  buildLineupView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Modal } from "@/components/ui/modal";
import { WC2026_GROUP_CODES, WC2026_GROUP_SEEDS } from "@/lib/openfootball/wc2026-groups";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

function getAllTeamsAlphabetically(): string[] {
  const teams = new Set<string>();
  for (const code of WC2026_GROUP_CODES) {
    for (const team of WC2026_GROUP_SEEDS[code] ?? []) {
      teams.add(team);
    }
  }
  return [...teams].sort((a, b) =>
    teamNameEs(a).localeCompare(teamNameEs(b), "es", { sensitivity: "base" })
  );
}

type AllTeamsLineupModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AllTeamsLineupModal({ open, onClose }: AllTeamsLineupModalProps) {
  const teams = useMemo(() => getAllTeamsAlphabetically(), []);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  function handleCloseLineup() {
    setSelectedTeam(null);
  }

  function handleCloseAll() {
    setSelectedTeam(null);
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleCloseAll}
        title="Plantillas"
        hideHeaderDivider
        className="max-h-[calc(100dvh-1rem)]"
        wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
        backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      >
        <ul className="grid grid-cols-6 items-stretch gap-2 overflow-y-auto p-2.5 sm:gap-2.5 sm:p-3">
          {teams.map((team) => (
            <li key={team} className="flex min-w-0">
              <button
                type="button"
                onClick={() => setSelectedTeam(team)}
                aria-label={`Ver plantilla de ${teamNameEs(team)}`}
                className={cn(
                  "flex h-[3.75rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--tm-border)]",
                  "bg-[rgba(111,43,255,0.12)] px-1 text-center transition-colors",
                  "hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
                )}
              >
                <TeamFlagBadge name={team} size="sm" className="shrink-0" />
                <span className="w-full min-w-0 truncate text-center text-[8px] font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:text-[10px]">
                  {teamAbbr(team)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      {selectedTeam ? (
        <EntityModalController
          open
          onClose={handleCloseLineup}
          initialView={buildLineupView(selectedTeam)}
        />
      ) : null}
    </>
  );
}
