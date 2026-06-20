"use client";

import {
  isAppHeaderHidden,
  isAppShellScrollPage,
  isFullscreenPath,
} from "@/lib/layout/app-shell-paths";
import { useEffectiveShellPathname } from "@/lib/layout/use-effective-shell-pathname";
import { cn } from "@/lib/utils";

type AppMainWrapperProps = {
  children: React.ReactNode;
};

/** Main con padding superior/inferior estilo marbella-app MainWrapper. */
export function AppMainWrapper({ children }: AppMainWrapperProps) {
  const pathname = useEffectiveShellPathname();
  const fullscreen = isFullscreenPath(pathname);
  const internalScroll = isAppShellScrollPage(pathname);
  const headerHidden = isAppHeaderHidden(pathname);

  return (
    <main
      className={cn(
        "tm-app-main relative z-10 w-full",
        !fullscreen && !headerHidden && "pt-[var(--tm-app-header-block)]",
        !fullscreen && !internalScroll && "pb-[var(--tm-tabbar-shell)]",
        !fullscreen &&
          internalScroll &&
          "tm-app-main--internal-scroll flex flex-col overflow-hidden pb-0",
        headerHidden && internalScroll && "tm-app-main--no-header",
      )}
    >
      {children}
    </main>
  );
}
