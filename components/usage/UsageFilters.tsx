"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayQuizDate } from "@/lib/quiz/date";
import {
  applyVisualViewportChrome,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";
import type { UsageDashboardFilters, UsageFilterUser } from "@/lib/usage/queries";
import { cn } from "@/lib/utils";

function buildFilterHref(filters: UsageDashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.day) params.set("dia", filters.day);
  if (filters.profileId) params.set("usuario", filters.profileId);
  const query = params.toString();
  return query ? `/uso?${query}` : "/uso";
}

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

const pillClass = (active: boolean) =>
  cn(
    "inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-2.5 text-[11px] font-medium uppercase tracking-wide",
    active
      ? "border-[var(--tm-primary)] text-[var(--tm-primary)]"
      : "border-[var(--tm-border)]/70 text-[var(--tm-muted)] hover:border-[var(--tm-primary)]/40"
  );

type UsageFiltersProps = {
  filters: UsageDashboardFilters;
  users: UsageFilterUser[];
};

export function UsageFilters({ filters, users }: UsageFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = todayQuizDate();

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
      <Input
        id="usage-day"
        name="dia"
        type="date"
        aria-label="Dia"
        value={day}
        onChange={(event) => setDay(event.target.value)}
        onBlur={resyncViewportChromeAfterFormControl}
        className="h-10 w-[8.75rem] shrink-0 px-2 text-xs"
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

      <Link
        href={buildFilterHref({ ...filters, day: today })}
        onClick={() => resyncViewportChromeAfterFormControl()}
        className={pillClass(filters.day === today)}
      >
        Hoy
      </Link>

      <Link
        href={buildFilterHref({ ...filters, day: null })}
        onClick={() => resyncViewportChromeAfterFormControl()}
        className={pillClass(!filters.day)}
      >
        Todos
      </Link>

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
