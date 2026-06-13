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
          "fixed bottom-[calc(var(--tab-bar-height,72px)+16px)] right-4 z-50 flex size-12 items-center justify-center rounded-xl",
          "border border-[var(--tm-border)] bg-[var(--tm-glass)] text-[var(--tm-accent)] shadow-[var(--tm-shadow)] backdrop-blur-md",
          "transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]",
          open && "pointer-events-none opacity-0"
        )}
      >
        <span className="text-xl leading-none" aria-hidden>
          ⚽
        </span>
      </button>

      <div id="predictor-assistant-panel">
        <PredictorPanel open={open} onClose={() => setOpen(false)} />
      </div>
    </>,
    document.body
  );
}
