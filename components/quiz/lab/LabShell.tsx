"use client";

import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LabShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
};

export function LabShell({ children, title = "LABORATORIO", subtitle, className }: LabShellProps) {
  return (
    <div className={cn("tm-lab-root fixed inset-0 z-[200] flex flex-col overflow-hidden", className)}>
      <div className="tm-lab-scanlines pointer-events-none absolute inset-0" aria-hidden />
      <header className="tm-lab-header relative z-10 flex shrink-0 items-center gap-3 border-b px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/profile"
          className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--lab-border)] text-[var(--lab-fg)] transition-colors active:bg-[var(--lab-surface)]"
          aria-label="Volver al perfil"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0 text-[var(--lab-fg)]" />
            <h1 className="truncate font-display text-sm uppercase tracking-[0.2em] text-[var(--lab-fg)]">
              {title}
            </h1>
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
              {subtitle}
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
              Sandbox de formatos · no afecta al quiz real
            </p>
          )}
        </div>
      </header>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
