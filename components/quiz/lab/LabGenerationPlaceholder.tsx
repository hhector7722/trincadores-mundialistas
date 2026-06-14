"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LabGenerationPlaceholderProps = {
  label: string;
  loading?: boolean;
  className?: string;
};

export function LabGenerationPlaceholder({
  label,
  loading = false,
  className,
}: LabGenerationPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--lab-border)] bg-[#0a0a0a] px-6 text-center",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-[var(--lab-accent)]" aria-hidden />
      ) : null}
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--lab-muted)]">
        {loading ? "Generando…" : "Sin contenido"}
      </p>
      <p className="text-sm text-[var(--lab-fg)]">{label}</p>
    </div>
  );
}
