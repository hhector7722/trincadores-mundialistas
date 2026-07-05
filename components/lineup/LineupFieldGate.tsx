"use client";

import type { ReactNode } from "react";
import { LoadingCenter } from "@/components/ui/spinner";
import { useGoyaFieldReady } from "@/lib/lineup/use-goya-field-ready";
import { cn } from "@/lib/utils";

type LineupFieldGateProps = {
  children: (markFieldReady: () => void) => ReactNode;
  label?: string;
  className?: string;
};

/** Mantiene el spinner hasta que el campo y el contenido hijo estén listos para mostrarse juntos. */
export function LineupFieldGate({
  children,
  label = "Cargando plantilla…",
  className,
}: LineupFieldGateProps) {
  const { fieldReady, markFieldReady } = useGoyaFieldReady();

  return (
    <div className={cn("relative", className)}>
      {!fieldReady ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--tm-shell-bg-hex)]">
          <LoadingCenter label={label} minHeightClassName="min-h-0" />
        </div>
      ) : null}
      <div className={cn("flex flex-col flex-1", !fieldReady && "invisible pointer-events-none")}>
        {children(markFieldReady)}
      </div>
    </div>
  );
}
