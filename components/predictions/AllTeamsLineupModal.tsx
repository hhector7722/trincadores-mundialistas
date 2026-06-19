"use client";

import { useMemo, useState } from "react";
import {
  buildLineupView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import { TeamsPickerModal } from "@/components/predictions/TeamsPickerModal";
import {
  CALENDAR_DATA_ACCESS_MODAL_PANEL_CLASS,
  CALENDAR_DATA_ACCESS_MODAL_WRAPPER_CLASS,
} from "@/lib/predictions/calendar-data-access";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";

type AllTeamsLineupModalProps = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  stackElevated?: boolean;
};

export function AllTeamsLineupModal({
  open,
  onClose,
  onBack,
  stackElevated = false,
}: AllTeamsLineupModalProps) {
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
        opaque
        stackElevated={stackElevated}
        onClose={handleCloseAll}
        onBack={onBack}
        mode="view"
        title="Plantillas"
        onViewTeam={setSelectedTeam}
        panelClassName={CALENDAR_DATA_ACCESS_MODAL_PANEL_CLASS}
        wrapperClassName={CALENDAR_DATA_ACCESS_MODAL_WRAPPER_CLASS}
        scrollContent={false}
      />

      {selectedTeam ? (
        <EntityModalController
          open
          opaque
          onClose={handleCloseLineup}
          initialView={buildLineupView(selectedTeam)}
          carouselTeams={teams}
          onCarouselTeamChange={setSelectedTeam}
        />
      ) : null}
    </>
  );
}
