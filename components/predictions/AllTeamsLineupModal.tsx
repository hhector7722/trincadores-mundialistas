"use client";

import { useMemo, useState } from "react";
import {
  buildLineupView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import { TeamsPickerModal } from "@/components/predictions/TeamsPickerModal";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";

type AllTeamsLineupModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AllTeamsLineupModal({ open, onClose }: AllTeamsLineupModalProps) {
  const teams = useMemo(() => getAllWorldCupTeamsAlphabetically(), []);
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
      <TeamsPickerModal
        open={open}
        onClose={handleCloseAll}
        mode="view"
        title="Plantillas"
        onViewTeam={setSelectedTeam}
      />

      {selectedTeam ? (
        <EntityModalController
          open
          onClose={handleCloseLineup}
          initialView={buildLineupView(selectedTeam)}
          carouselTeams={teams}
          onCarouselTeamChange={setSelectedTeam}
        />
      ) : null}
    </>
  );
}
