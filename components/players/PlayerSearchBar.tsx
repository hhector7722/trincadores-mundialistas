"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PlayerSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function PlayerSearchBar({
  value,
  onChange,
  placeholder = "Buscar jugador…",
  className,
  autoFocus = false,
}: PlayerSearchBarProps) {
  return (
    <div
      className={cn(
        "flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-[var(--tm-border)] bg-[rgba(255,255,255,0.96)] px-3 shadow-sm transition-shadow focus-within:border-[var(--tm-accent-muted)] focus-within:shadow-md",
        className
      )}
    >
      <Search
        className="h-5 w-5 shrink-0 text-[var(--tm-subtle)]"
        aria-hidden
        strokeWidth={2.25}
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={placeholder}
        className="min-h-10 w-full flex-1 border-0 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Borrar búsqueda"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
