"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useTransition, useState, type MouseEvent } from "react";
import { BarChart3, Brain, Home, ListOrdered, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABBAR_HEIGHT_FALLBACK = "var(--tm-tabbar-core)";

function syncTabBarHeight(node: HTMLElement) {
  const height = Math.ceil(node.getBoundingClientRect().height);
  if (height > 0) {
    document.documentElement.style.setProperty("--tm-tabbar-height", `${height}px`);
  }
}

function resetTabBarHeight() {
  document.documentElement.style.setProperty("--tm-tabbar-height", TABBAR_HEIGHT_FALLBACK);
}

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
  const navRef = useRef<HTMLElement>(null);
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useLayoutEffect(() => {
    const node = navRef.current;
    if (!node) return;

    const onViewportChange = () => syncTabBarHeight(node);

    syncTabBarHeight(node);

    const observer = new ResizeObserver(onViewportChange);
    observer.observe(node);
    window.visualViewport?.addEventListener("resize", onViewportChange);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      resetTabBarHeight();
    };
  }, []);

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
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <nav
      ref={navRef}
      className="tm-tabbar shrink-0 border-t border-[var(--tm-border)] px-1"
      aria-label="Navegacion principal"
    >
      <ul className="flex h-12 items-stretch justify-between">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(displayPath, href);
          const navigating = optimisticHref === href;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch
                scroll
                onClick={(event) => handleTabClick(event, href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors duration-150 active:opacity-80",
                  active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]",
                  navigating && "opacity-90"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
