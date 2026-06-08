"use client";

import { useState } from "react";
import {
  buildLineupView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import { TeamsPickerModal } from "@/components/predictions/TeamsPickerModal";

type AllTeamsLineupModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AllTeamsLineupModal({ open, onClose }: AllTeamsLineupModalProps) {
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
        />
      ) : null}
    </>
  );
}
