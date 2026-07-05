"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoadingCenter } from "@/components/ui/spinner";

type TacticalLineupsPanelShellProps = {
  loading: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Shell compartido: altura flexible en carga y con contenido; pie opcional bajo las reservas. */
export function TacticalLineupsPanelShell({
  loading,
  footer,
  children,
  className,
}: TacticalLineupsPanelShellProps) {
  return (
    <div className={cn("flex w-full flex-col flex-1 min-h-0", className)}>
      <div
        className="relative min-h-[350px] w-full flex-1 px-1 pt-0.5"
      >
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--tm-shell-bg-hex)]">
            <LoadingCenter label="Cargando alineaciones…" minHeightClassName="min-h-0" />
          </div>
        ) : null}
        <div className={cn(loading && "invisible pointer-events-none")}>{children}</div>
      </div>
      {footer}
    </div>
  );
}
