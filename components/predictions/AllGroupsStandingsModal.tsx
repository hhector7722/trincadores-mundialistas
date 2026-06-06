"use client";

import { GroupStandingsTable } from "@/components/predictions/group-standings-table";
import { Modal } from "@/components/ui/modal";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";

type AllGroupsStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  groups: GroupStandingDetail[];
  onSelectGroup: (groupCode: string) => void;
};

export function AllGroupsStandingsModal({
  open,
  onClose,
  groups,
  onSelectGroup,
}: AllGroupsStandingsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clasificación de grupos"
      hideHeaderDivider
      className="max-h-[calc(100dvh-1rem)]"
      wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
    >
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-6 gap-2 overflow-y-auto p-2 sm:grid-cols-3 sm:grid-rows-4 sm:gap-3 sm:p-3 lg:grid-cols-6 lg:grid-rows-2">
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
            <div className="shrink-0 border-b border-[var(--tm-border)] px-2 py-1">
              <span className="font-display text-xs font-semibold uppercase text-[var(--tm-accent)]">
                Grupo {group.code}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <GroupStandingsTable group={group} compact />
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
