"use client";

import { useState } from "react";
import { GroupStandingsTable } from "@/components/predictions/group-standings-table";
import { Modal } from "@/components/ui/modal";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";

type GroupStandingsView = "official" | "predictions";

type AllGroupsStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  officialGroups: GroupStandingDetail[];
  predictedGroups: GroupStandingDetail[];
  onSelectGroup: (groupCode: string) => void;
};

function GroupStandingsViewToggle({
  value,
  onChange,
}: {
  value: GroupStandingsView;
  onChange: (value: GroupStandingsView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] p-0.5"
      role="tablist"
      aria-label="Fuente de clasificación"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "official"}
        onClick={() => onChange("official")}
        className={cn(
          "min-h-7 rounded-full px-2.5 text-[9px] font-semibold uppercase tracking-wide transition-colors",
          value === "official"
            ? "bg-[var(--tm-accent)] text-[#2a1058]"
            : "text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
        )}
      >
        Real
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "predictions"}
        onClick={() => onChange("predictions")}
        className={cn(
          "min-h-7 rounded-full px-2.5 text-[9px] font-semibold uppercase tracking-wide transition-colors",
          value === "predictions"
            ? "bg-[var(--tm-accent)] text-[#2a1058]"
            : "text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
        )}
      >
        Mi porra
      </button>
    </div>
  );
}

export function AllGroupsStandingsModal({
  open,
  onClose,
  officialGroups,
  predictedGroups,
  onSelectGroup,
}: AllGroupsStandingsModalProps) {
  const [view, setView] = useState<GroupStandingsView>("official");
  const groups = view === "official" ? officialGroups : predictedGroups;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clasificación de grupos"
      hideTitle
      hideHeaderDivider
      ariaLabel="Clasificación de grupos"
      className="max-h-[calc(100dvh-1rem)]"
      wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
    >
      <div className="flex shrink-0 justify-center border-b border-[var(--tm-border)] px-2 py-1.5">
        <GroupStandingsViewToggle value={view} onChange={setView} />
      </div>
      <div className="grid auto-rows-min grid-cols-2 items-start gap-2 overflow-y-auto p-2 sm:grid-cols-3 sm:gap-3 sm:p-3 lg:grid-cols-6">
        {groups.map((group) => (
          <button
            key={group.code}
            type="button"
            onClick={() => onSelectGroup(group.code)}
            className={cn(
              "flex min-w-0 flex-col overflow-visible rounded-lg border border-[var(--tm-border)]",
              "bg-[rgba(111,43,255,0.12)] text-left transition-colors",
              "hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
            )}
          >
            <div className="flex shrink-0 items-center justify-center border-b border-[var(--tm-border)] px-0.5 py-0 leading-none">
              <span className="text-[7px] font-semibold uppercase tracking-wide text-[var(--tm-accent)]">
                Grupo {group.code}
              </span>
            </div>
            <div className="overflow-visible">
              <GroupStandingsTable group={group} variant="grid" />
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
