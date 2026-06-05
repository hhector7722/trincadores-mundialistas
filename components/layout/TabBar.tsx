"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, ListOrdered, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/predictions", label: "Porra", icon: Target },
  { href: "/ranking", label: "Ranking", icon: ListOrdered },
  { href: "/activity", label: "Actividad", icon: Activity },
  { href: "/profile", label: "Perfil", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-[var(--tm-border)] bg-[var(--tm-surface)] px-1 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegacion principal"
    >
      <ul className="flex items-stretch justify-between">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                  active ? "text-[var(--tm-primary)]" : "text-[var(--tm-muted)]"
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
