"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActivePool } from "@/actions/auth";
import type { UserPool } from "@/lib/pool/active-pool";
import { cn } from "@/lib/utils";

export function PoolSwitcher({
  pools,
  activePoolId,
}: {
  pools: UserPool[];
  activePoolId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (pools.length <= 1) return null;

  return (
    <select
      disabled={pending}
      value={activePoolId}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          const result = await setActivePool(next);
          if (result.ok) {
            router.refresh();
          }
        });
      }}
      className={cn(
        "max-w-[10rem] truncate rounded-lg border border-[var(--tm-border)] bg-[var(--tm-surface)] px-2 py-1 text-xs font-medium text-[var(--tm-fg)]",
        pending && "opacity-60"
      )}
      aria-label="Seleccionar porra"
    >
      {pools.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
