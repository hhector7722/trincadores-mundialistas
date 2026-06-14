"use client";

import { usePathname } from "next/navigation";
import { useTabNavigation } from "@/components/layout/TabNavigationProvider";

/** Ruta efectiva para header, padding del main y TabBar durante swipe entre pestañas. */
export function useEffectiveShellPathname(): string {
  const pathname = usePathname();
  const { shellPathnameOverride } = useTabNavigation();
  return shellPathnameOverride ?? pathname;
}
