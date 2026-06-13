"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PredictorPanel } from "@/components/laboratorio/PredictorPanel";
import { cn } from "@/lib/utils";

type PredictorFabProps = {
  enabled: boolean;
};

export function PredictorFab({ enabled }: PredictorFabProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!enabled || !mounted) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar asistente de predicciones" : "Abrir asistente de predicciones"}
        aria-expanded={open}
        aria-controls="predictor-assistant-panel"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "tm-predictor-fab fixed right-0 z-50 shrink-0",
          "bottom-[calc(var(--tm-tabbar-shell)+12px)]",
          "flex h-14 min-h-12 w-[3.5rem] items-center justify-center",
          "rounded-l-full rounded-r-none",
          "bg-[#2a1058]",
          "border-y border-l border-[var(--tm-accent)]/45",
          "hover:w-[3.75rem] hover:-translate-x-1",
          "active:scale-[0.97] active:translate-x-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a1058]",
          open && "tm-predictor-fab--open"
        )}
      >
        <span
          className="pointer-events-none block w-full pr-[0.2em] text-center font-display text-[13px] font-bold tracking-[0.2em] text-[var(--tm-accent)]"
          aria-hidden
        >
          AI
        </span>
      </button>

      <div id="predictor-assistant-panel">
        <PredictorPanel open={open} onClose={() => setOpen(false)} />
      </div>
    </>,
    document.body
  );
}
