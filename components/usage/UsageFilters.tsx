"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";
import type { UsageDashboardFilters, UsageFilterUser } from "@/lib/usage/queries";
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

type UsageFiltersProps = {
  filters: UsageDashboardFilters;
  users: UsageFilterUser[];
};

export function UsageFilters({ filters, users }: UsageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [day, setDay] = useState(filters.day ?? "");
  const [profileId, setProfileId] = useState(filters.profileId ?? "");

  useEffect(() => {
    setDay(filters.day ?? "");
    setProfileId(filters.profileId ?? "");
  }, [filters.day, filters.profileId]);

  useEffect(() => {
    resyncViewportChrome();
    requestAnimationFrame(resyncViewportChrome);
  }, [searchParams]);

  function applyFilters(nextDay: string, nextProfileId: string) {
    const params = new URLSearchParams();
    if (nextDay) params.set("dia", nextDay);
    if (nextProfileId) params.set("usuario", nextProfileId);
    const query = params.toString();
    router.push(query ? `/uso?${query}` : "/uso");
    resyncViewportChromeAfterFormControl();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters(day, profileId);
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-block-tab-swipe=""
      className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
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

      <select
        id="usage-user"
        name="usuario"
        aria-label="Usuario"
        value={profileId}
        onChange={(event) => setProfileId(event.target.value)}
        onBlur={resyncViewportChromeAfterFormControl}
        className={cn(
          "h-10 min-w-[7.5rem] flex-1 shrink-0 rounded-lg border border-[var(--tm-border)]/70 bg-transparent px-2 text-xs text-[var(--tm-fg)] outline-none",
          "focus:border-[var(--tm-accent-muted)]"
        )}
      >
        <option value="">Todos</option>
        {users.map((user) => (
          <option key={user.profileId} value={user.profileId}>
            {user.displayName}
          </option>
        ))}
      </select>

      <Button type="submit" className="h-10 shrink-0 px-3 text-xs">
        OK
      </Button>

      <Link
        href="/uso"
        onClick={() => {
          setDay("");
          setProfileId("");
          resyncViewportChromeAfterFormControl();
        }}
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[var(--tm-border)]/70 px-2.5 text-xs text-[var(--tm-muted)]",
          "hover:border-[var(--tm-primary)]/40 hover:text-[var(--tm-primary)]"
        )}
      >
        ×
      </Link>
    </form>
  );
}
