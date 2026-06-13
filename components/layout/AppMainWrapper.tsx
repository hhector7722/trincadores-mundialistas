"use client";

import { usePathname } from "next/navigation";
import {
  isAppShellScrollPage,
  isFullscreenPath,
} from "@/lib/layout/app-shell-paths";
import { cn } from "@/lib/utils";

type AppMainWrapperProps = {
  children: React.ReactNode;
};

/** Main con padding superior/inferior estilo marbella-app MainWrapper. */
export function AppMainWrapper({ children }: AppMainWrapperProps) {
  const pathname = usePathname();
  const fullscreen = isFullscreenPath(pathname);
  const internalScroll = isAppShellScrollPage(pathname);

  return (
    <main
      className={cn(
        "tm-app-main relative z-10 w-full transition-all duration-300",
        !fullscreen && "pt-[var(--tm-app-header-block)]",
        !fullscreen && !internalScroll && "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
        !fullscreen && internalScroll && "tm-app-main--internal-scroll flex flex-col overflow-hidden pb-0",
      )}
    >
      {children}
    </main>
  );
}
