"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LabShellProps = {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
};

export function LabShell({ children, title = "Laboratorio", actions, className }: LabShellProps) {
  return (
    <div className={cn("tm-lab-root fixed inset-0 z-[200] flex flex-col overflow-hidden", className)}>
      <header className="tm-lab-header flex shrink-0 items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/profile"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-[var(--lab-muted)] transition-colors hover:text-[var(--lab-fg)]"
          aria-label="Volver al perfil"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-[var(--lab-fg)]">{title}</h1>
          <p className="truncate text-xs text-[var(--lab-muted)]">
            Pruebas de formatos · no afecta al quiz real
          </p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
