"use client";

import { useEffect, useState } from "react";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PoolRankingMember } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

type RankingEvolutionFilterModalProps = {
  open: boolean;
  onClose: () => void;
  members: PoolRankingMember[];
  appliedIds: Set<string>;
  onApply: (selectedIds: Set<string>) => void;
};

export function RankingEvolutionFilterModal({
  open,
  onClose,
  members,
  appliedIds,
  onApply,
}: RankingEvolutionFilterModalProps) {
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftIds(new Set(appliedIds));
    setError(null);
  }, [open, appliedIds]);

  function toggleMember(profileId: string) {
    setDraftIds((current) => {
      const next = new Set(current);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
    setError(null);
  }

  function selectAll() {
    setDraftIds(new Set(members.map((member) => member.profileId)));
    setError(null);
  }

  function clearAll() {
    setDraftIds(new Set());
    setError(null);
  }

  function handleApply() {
    if (draftIds.size === 0) {
      setError("Selecciona al menos un trincador.");
      return;
    }
    onApply(new Set(draftIds));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filtrar por trincador"
      stackElevated
      className="flex max-h-[min(72dvh,28rem)] flex-col"
      scrollContent
    >
      <div className="flex shrink-0 gap-2 border-b border-[var(--tm-border)] px-3 py-2">
        <button
          type="button"
          onClick={selectAll}
          className="min-h-10 flex-1 rounded-lg border border-[var(--tm-border)] px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--tm-fg)] transition-colors hover:border-[var(--tm-accent-muted)]"
        >
          Seleccionar todos
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-10 flex-1 rounded-lg border border-[var(--tm-border)] px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--tm-fg)] transition-colors hover:border-[var(--tm-accent-muted)]"
        >
          Quitar todos
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {members.map((member) => {
          const checked = draftIds.has(member.profileId);
          return (
            <li key={member.profileId}>
              <label
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors",
                  checked ? "bg-[rgba(111,43,255,0.12)]" : "hover:bg-[rgba(111,43,255,0.06)]"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMember(member.profileId)}
                  className="size-5 shrink-0 accent-[var(--tm-accent)]"
                />
                <AvatarDisplay avatarUrl={member.avatarUrl} label={member.label} size="mini" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
                  {member.label}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="shrink-0 px-3 pb-1 text-center text-xs font-medium text-red-400">{error}</p>
      ) : null}

      <div className="flex shrink-0 gap-2 border-t border-[var(--tm-border)] px-3 py-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" className="flex-1" onClick={handleApply}>
          Aplicar
        </Button>
      </div>
    </Modal>
  );
}
