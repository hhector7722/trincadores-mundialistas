"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitMatchResult } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminResultForm({
  poolId,
  matchId,
  label,
}: {
  poolId: string;
  matchId: string;
  label: string;
}) {
  const router = useRouter();
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitMatchResult(
        poolId,
        matchId,
        Number(home),
        Number(away)
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 border-b border-[var(--tm-border)] py-3">
      <p className="text-sm font-medium text-[var(--tm-fg)]">{label}</p>
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-20"
          aria-label="Goles local"
        />
        <span className="self-center text-[var(--tm-muted)]">-</span>
        <Input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-20"
          aria-label="Goles visitante"
        />
        <Button type="submit" disabled={pending} className={cn(pending && "opacity-60")}>
          {pending ? "..." : "Cerrar"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}