"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { GroupStandingsTable } from "@/components/predictions/group-standings-table";
import { Modal } from "@/components/ui/modal";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";

type GroupStandingsView = "official" | "predictions";

function LivePulseIcon() {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--tm-danger)] opacity-80" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--tm-danger)]" />
    </span>
  );
}

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
          "inline-flex min-h-7 items-center gap-1 rounded-full px-2 text-[9px] font-semibold uppercase tracking-wide transition-colors",
          value === "official"
            ? "bg-[var(--tm-accent)] text-[#2a1058]"
            : "text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
        )}
      >
        <LivePulseIcon />
        Live
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
        Pronostico
      </button>
    </div>
  );
}

type AllGroupsStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  officialGroups: GroupStandingDetail[];
  predictedGroups: GroupStandingDetail[];
  onSelectGroup: (groupCode: string) => void;
};

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
      hideHeader
      ariaLabel="Clasificación de grupos"
      className="flex max-h-[calc(100dvh-1rem)] flex-col"
      wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-2.5 pb-2 pt-2.5 sm:px-3 sm:pt-3">
          <span aria-hidden="true" />
          <div className="flex justify-center">
            <GroupStandingsViewToggle value={view} onChange={setView} />
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[var(--tm-surface-elevated)] hover:text-[var(--tm-fg)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 items-stretch gap-2.5 overflow-y-auto px-2.5 pb-2.5 sm:grid-cols-3 sm:gap-3 sm:px-3 sm:pb-3 lg:grid-cols-6">
          {groups.map((group) => (
            <button
              key={group.code}
              type="button"
              onClick={() => onSelectGroup(group.code)}
              className={cn(
                "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--tm-border)]",
                "bg-[rgba(111,43,255,0.12)] text-left transition-colors",
                "hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
              )}
            >
              <div className="flex shrink-0 items-center justify-center border-b border-[var(--tm-border)] px-1 py-1 leading-none">
                <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--tm-accent)] sm:text-[9px]">
                  Grupo {group.code}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-visible">
                <GroupStandingsTable group={group} variant="grid" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
