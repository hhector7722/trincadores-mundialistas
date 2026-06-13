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

const TABBAR_NAV_CLASS =
  "tm-app-tabbar fixed bottom-0 left-0 right-0 z-[95] flex h-20 items-center justify-around border-t border-[var(--tm-border)] bg-[var(--tm-tabbar-bg-hex)] px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md md:h-16 md:px-8";

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
      className={cn(TABBAR_NAV_CLASS, showIndicators && "tm-app-tabbar--with-indicators")}
      aria-label="Navegacion principal"
    >
      {showIndicators ? (
        <div className="tm-tabbar-indicators-row flex items-center justify-center">
          <TabPageIndicators />
        </div>
      ) : null}
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
              "flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center",
              "transition-all duration-200 active:scale-95",
              active ? "scale-110 text-[var(--tm-accent)] drop-shadow-md" : "text-[var(--tm-muted)]",
              navigating && "opacity-90",
            )}
          >
            <Icon size={20} className="md:h-5 md:w-5" strokeWidth={2.5} />
            <span className="mt-0.5 text-[7.5px] font-black uppercase tracking-tighter whitespace-nowrap md:mt-1 md:text-[9px] md:tracking-widest">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
