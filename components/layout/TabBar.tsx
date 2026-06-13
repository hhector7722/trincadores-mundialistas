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

/** Misma estructura que marbella-app/src/components/StaffBottomNav.tsx */
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
      className={cn("tm-app-tabbar", showIndicators && "tm-app-tabbar--with-indicators")}
      aria-label="Navegacion principal"
    >
      {showIndicators ? (
        <div className="tm-tabbar-indicators-row">
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
              "tm-app-tabbar__link",
              active ? "tm-app-tabbar__link--active" : "tm-app-tabbar__link--idle",
              navigating && "opacity-90",
            )}
          >
            <Icon strokeWidth={active ? 2.5 : 2} />
            <span className="tm-app-tabbar__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
