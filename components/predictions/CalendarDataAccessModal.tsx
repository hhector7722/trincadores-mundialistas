"use client";

import { Modal } from "@/components/ui/modal";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { cn } from "@/lib/utils";

type CalendarDataAccessModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenAllGroups: () => void;
  onOpenStats: () => void;
  onOpenSquads: () => void;
};

const ACCESS_ACTIONS = [
  { id: "knockout", label: "CUADRO FASE FINAL" },
  { id: "groups", label: "CLASIFICACIONES" },
  { id: "stats", label: "ESTADÍSTICAS" },
  { id: "squads", label: "PLANTILLAS" },
] as const;

export function CalendarDataAccessModal({
  open,
  onClose,
  onOpenAllGroups,
  onOpenStats,
  onOpenSquads,
}: CalendarDataAccessModalProps) {
  const { navigate } = useAppNavigation();

  function handleAction(actionId: (typeof ACCESS_ACTIONS)[number]["id"]) {
    switch (actionId) {
      case "knockout":
        onClose();
        navigate("/predictions/knockout");
        break;
      case "groups":
        onOpenAllGroups();
        break;
      case "stats":
        onOpenStats();
        break;
      case "squads":
        onOpenSquads();
        break;
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Datos del torneo"
      ariaLabel="Datos del torneo"
      opaque
      className="max-w-xs"
      panelHostClassName="max-w-xs"
    >
      <div className="flex flex-col gap-4 px-3 py-4">
        {ACCESS_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.id)}
            className={cn(
              "flex h-10 w-full items-center justify-center rounded-lg border border-[var(--tm-accent)] px-2.5",
              "bg-[var(--tm-bg-elevated)] text-[11px] font-semibold uppercase leading-none tracking-wide text-[var(--tm-accent)]",
              "transition-colors hover:bg-[var(--tm-accent-soft)]"
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
