"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { BarChart3, Brain, Home, ListOrdered, User } from "lucide-react";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/ranking", label: "La tabla", icon: ListOrdered },
  { href: "/", label: "Inicio", icon: Home },
  { href: "/predictions", label: "Partidos", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: User },
] as const;

const TAB_HREFS = TABS.map((tab) => tab.href);

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { navigate } = useAppNavigation();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  useEffect(() => {
    for (const href of TAB_HREFS) {
      router.prefetch(href);
    }
  }, [router]);

  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  const displayPath = optimisticHref ?? pathname;

  function handleTabClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (isActive(pathname, href)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setOptimisticHref(href);
    navigate(href);
  }

  return (
    <nav
      className={cn(
        "tm-fixed-bottombar fixed bottom-0 left-0 right-0 z-[95] box-border",
        "border-t border-[var(--tm-border)] bg-[var(--tm-tabbar-bg-hex)] pb-safe",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
      )}
      aria-label="Navegacion principal"
    >
      <div className="flex h-12 items-center justify-around px-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(displayPath, href);
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
              "flex min-h-12 min-w-12 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-150 active:opacity-80",
              active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]",
              navigating && "opacity-90"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
