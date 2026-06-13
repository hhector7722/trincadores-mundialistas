"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { BarChart3, Brain, Home, ListOrdered, User } from "lucide-react";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { TabPageIndicators } from "@/components/layout/TabPageIndicators";
import {
  isMainTabActive,
  MAIN_TAB_HREFS,
  MAIN_TABS,
  shouldShowTabPageIndicators,
} from "@/lib/layout/main-tabs";
import { isQuizLabPath } from "@/lib/quiz/lab-access";
import { cn } from "@/lib/utils";

const TAB_ICONS = {
  "/quiz": Brain,
  "/ranking": ListOrdered,
  "/": Home,
  "/predictions": BarChart3,
  "/profile": User,
} as const;

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { navigateTab } = useAppNavigation();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => {
    for (const href of MAIN_TAB_HREFS) {
      router.prefetch(href);
    }
  }, [router]);

  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  const displayPath = optimisticHref ?? pathname;

  if (isQuizLabPath(pathname)) {
    return null;
  }

  const showIndicators = shouldShowTabPageIndicators(pathname);

  function handleTabClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (isMainTabActive(pathname, href)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setOptimisticHref(href);
    navigateTab(href);
  }

  return (
    <nav
      className={cn(
        "tm-app-tabbar z-[90] box-border w-full shrink-0 border-t border-[var(--tm-border)] pb-safe",
        "bg-[var(--tm-tabbar-bg-hex)]",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.18)] backdrop-blur-md",
        showIndicators && "tm-app-tabbar--with-indicators",
      )}
      aria-label="Navegacion principal"
    >
      {showIndicators ? (
        <div className="tm-tabbar-indicators-row flex shrink-0 items-center justify-center">
          <TabPageIndicators />
        </div>
      ) : null}
      <div className="tm-tabbar-tabs-row w-full shrink-0 justify-around px-0.5">
        {MAIN_TABS.map(({ href, label }) => {
          const Icon = TAB_ICONS[href];
          const active = isMainTabActive(displayPath, href);
          const navigating = optimisticHref === href;

          return (
            <Link
              key={href}
              href={href}
              prefetch
              scroll
              onClick={(event) => handleTabClick(event, href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-full min-h-0 min-w-9 flex-1 touch-manipulation flex-col items-center justify-center gap-0 px-0.5",
                "text-[7px] font-medium leading-none transition-colors duration-150 active:opacity-80",
                active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]",
                navigating && "opacity-90",
              )}
            >
              <Icon className="h-3 w-3 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              <span className="mt-px max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
