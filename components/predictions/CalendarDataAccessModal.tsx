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
    <Modal open={open} onClose={onClose} title="Datos del torneo" ariaLabel="Datos del torneo">
      <div className="flex flex-col gap-2 p-4">
        {ACCESS_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.id)}
            className={cn(
              "flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold uppercase tracking-wide",
              "bg-[var(--tm-accent)] text-[var(--tm-primary-fg)] transition-colors hover:brightness-110"
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
