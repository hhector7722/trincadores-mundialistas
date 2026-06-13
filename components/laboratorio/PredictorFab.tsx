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
          "fixed bottom-[calc(var(--tab-bar-height,72px)+10px)] -right-6 z-50",
          "flex size-16 items-center justify-center rounded-full",
          "border-2 border-[var(--tm-accent)]/70 bg-[#2a1058] shadow-[0_0_24px_rgba(217,255,0,0.35)]",
          "transition-transform duration-200 hover:scale-[1.04] active:scale-[0.96]",
          open && "pointer-events-none opacity-0"
        )}
      >
        <span
          className="font-display text-[15px] font-bold tracking-[0.28em] text-[var(--tm-accent)] drop-shadow-[0_0_8px_rgba(217,255,0,0.65)]"
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
