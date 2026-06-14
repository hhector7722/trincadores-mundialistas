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
        "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 px-6 py-8 text-center",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-[var(--lab-accent)]" aria-hidden />
      ) : null}
      <p className="text-xs font-medium text-[var(--lab-muted)]">
        {loading ? "Generando contenido…" : "Sin contenido"}
      </p>
      <p className="text-sm text-[var(--lab-fg)]">{label}</p>
    </div>
  );
}
