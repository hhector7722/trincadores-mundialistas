"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, ListOrdered, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/predictions", label: "Porra", icon: Target },
  { href: "/ranking", label: "La tabla", icon: ListOrdered },
  { href: "/", label: "Inicio", icon: Home },
  { href: "/activity", label: "Actividad", icon: Activity },
  { href: "/profile", label: "Perfil", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="tm-surface-fade fixed bottom-0 left-0 right-0 z-50 shrink-0 border-t border-[var(--tm-border)] px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      aria-label="Navegacion principal"
    >
      <ul className="flex h-12 items-stretch justify-between">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                  active ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
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
