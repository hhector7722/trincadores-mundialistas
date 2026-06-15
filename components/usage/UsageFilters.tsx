"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";
import type { UsageDashboardFilters, UsageFilterUser } from "@/lib/usage/queries";
import {
  getDefaultUsageSelectedProfileIds,
  usageProfileIdSetsMatch,
} from "@/lib/usage/default-filters";
import { cn } from "@/lib/utils";

function resyncViewportChrome() {
  applyVisualViewportChrome();
  window.dispatchEvent(new Event(VIEWPORT_CHROME_SYNC_EVENT));
}

function resyncViewportChromeAfterFormControl() {
  resyncViewportChrome();
  requestAnimationFrame(resyncViewportChrome);
  window.setTimeout(resyncViewportChrome, 120);
  window.setTimeout(resyncViewportChrome, 320);
}

function selectedIdsFromFilters(
  filters: UsageDashboardFilters,
  users: UsageFilterUser[]
): Set<string> {
  if (filters.profileIds === null) {
    return new Set(getDefaultUsageSelectedProfileIds(users));
  }
  return new Set(filters.profileIds);
}

function serializeUsersParam(users: UsageFilterUser[], selected: Set<string>): string | undefined {
  const selectedIds = [...selected];
  const defaultIds = getDefaultUsageSelectedProfileIds(users);
  if (usageProfileIdSetsMatch(selectedIds, defaultIds)) return undefined;
  if (selected.size === 0) return "ninguno";
  return selectedIds.join(",");
}

function usersFilterLabel(selectedCount: number, totalCount: number): string {
  if (totalCount === 0) return "Usuarios";
  if (selectedCount === 0) return "Ninguno";
  if (selectedCount === totalCount) return "Todos";
  return `${selectedCount} de ${totalCount}`;
}

type UsageFiltersProps = {
  filters: UsageDashboardFilters;
  users: UsageFilterUser[];
};

export function UsageFilters({ filters, users }: UsageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allUserIds = useMemo(() => users.map((user) => user.profileId), [users]);

  const [day, setDay] = useState(filters.day ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    selectedIdsFromFilters(filters, users)
  );
  const [usersOpen, setUsersOpen] = useState(false);

  useEffect(() => {
    setDay(filters.day ?? "");
    setSelectedIds(selectedIdsFromFilters(filters, users));
  }, [filters.day, filters.profileIds, users]);

  useEffect(() => {
    resyncViewportChrome();
    requestAnimationFrame(resyncViewportChrome);
  }, [searchParams]);

  function applyFilters(nextDay: string, nextSelected: Set<string>) {
    const params = new URLSearchParams();
    if (nextDay) params.set("dia", nextDay);
    const usersParam = serializeUsersParam(users, nextSelected);
    if (usersParam) params.set("usuarios", usersParam);
    const query = params.toString();
    router.push(query ? `/uso?${query}` : "/uso");
    setUsersOpen(false);
    resyncViewportChromeAfterFormControl();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(day, selectedIds);
  }

  function toggleUser(profileId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  function selectAllUsers() {
    setSelectedIds(new Set(allUserIds));
  }

  function clearAllUsers() {
    setSelectedIds(new Set());
  }

  const allSelected = selectedIds.size === allUserIds.length && allUserIds.length > 0;
  const noneSelected = selectedIds.size === 0;
  const usersLabel = usersFilterLabel(selectedIds.size, allUserIds.length);

  return (
    <form onSubmit={handleSubmit} data-block-tab-swipe="" className="space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <input
          id="usage-day"
          name="dia"
          type="date"
          aria-label="Dia"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          onBlur={resyncViewportChromeAfterFormControl}
          className={cn(
            "box-border h-10 w-[6.85rem] max-w-[6.85rem] shrink-0 rounded-lg border border-[var(--tm-border)]/70 bg-transparent px-1 text-xs text-[var(--tm-fg)] outline-none",
            "focus:border-[var(--tm-accent-muted)] [color-scheme:dark]",
            "[&::-webkit-calendar-picker-indicator]:ml-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          )}
        />

        <button
          type="button"
          onClick={() => setUsersOpen((value) => !value)}
          aria-expanded={usersOpen}
          aria-controls="usage-users-panel"
          className={cn(
            "inline-flex h-10 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-lg border px-2.5 text-xs outline-none",
            usersOpen
              ? "border-[var(--tm-accent-muted)] text-[var(--tm-fg)]"
              : "border-[var(--tm-border)]/70 text-[var(--tm-muted)]",
            "focus:border-[var(--tm-accent-muted)]"
          )}
        >
          <span className="truncate">{usersLabel}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 transition-transform",
              usersOpen && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        <Button type="submit" className="h-10 shrink-0 px-3 text-xs">
          OK
        </Button>

        <Link
          href="/uso"
          onClick={() => {
            setDay("");
            setSelectedIds(new Set(getDefaultUsageSelectedProfileIds(users)));
            setUsersOpen(false);
            resyncViewportChromeAfterFormControl();
          }}
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[var(--tm-border)]/70 px-2.5 text-xs text-[var(--tm-muted)]",
            "hover:border-[var(--tm-primary)]/40 hover:text-[var(--tm-primary)]"
          )}
        >
          ×
        </Link>
      </div>

      {usersOpen ? (
        <div
          id="usage-users-panel"
          className="rounded-xl border border-[var(--tm-border)]/50 p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--tm-muted)]">
              Usuarios
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={selectAllUsers}
                disabled={allSelected}
                className="text-[var(--tm-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Seleccionar todos
              </button>
              <span className="text-[var(--tm-border)]" aria-hidden>
                |
              </span>
              <button
                type="button"
                onClick={clearAllUsers}
                disabled={noneSelected}
                className="text-[var(--tm-muted)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Quitar todos
              </button>
            </div>
          </div>

          <div className="flex max-h-40 flex-wrap content-start gap-1.5 overflow-y-auto">
            {users.map((user) => {
              const checked = selectedIds.has(user.profileId);
              return (
                <label
                  key={user.profileId}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs transition-colors",
                    checked
                      ? "border-[var(--tm-accent-muted)]/50 bg-[var(--tm-accent-soft)]/20 text-[var(--tm-fg)]"
                      : "border-[var(--tm-border)]/40 text-[var(--tm-muted)]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(user.profileId)}
                    className="size-4 shrink-0 accent-[var(--tm-accent)]"
                  />
                  <span className="whitespace-nowrap">{user.displayName}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </form>
  );
}
