"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { bottomAboveTabBar } from "@/lib/layout/tabbar-bounds";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Ancla el bloque de inicio al hueco entre cabecera y TabBar (sin gap ni solapamiento). */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      const frame = root.closest<HTMLElement>(".tm-app-frame");
      const header = frame?.querySelector<HTMLElement>(".tm-app-header");
      if (!frame) return;

      const frameRect = frame.getBoundingClientRect();
      const headerHeight = header?.offsetHeight ?? 0;
      const contentBottom = bottomAboveTabBar(frameRect.bottom);
      const height = Math.max(0, Math.floor(contentBottom - frameRect.top - headerHeight));

      root.style.height = `${height}px`;
    };

    sync();

    const observer = new ResizeObserver(sync);
    const frame = root.closest<HTMLElement>(".tm-app-frame");
    if (frame) observer.observe(frame);
    const header = frame?.querySelector<HTMLElement>(".tm-app-header");
    if (header) observer.observe(header);
    observer.observe(root);

    const tabBar = document.querySelector<HTMLElement>(".tm-bottom-chrome:not(.tm-bottom-chrome-placeholder)");
    if (tabBar) observer.observe(tabBar);
    const indicators = document.querySelector<HTMLElement>(".tm-tab-indicators-float");
    if (indicators) observer.observe(indicators);
    const placeholder = document.getElementById("tm-bottom-chrome-placeholder");
    if (placeholder) observer.observe(placeholder);

    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      root.style.removeProperty("height");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="tm-home-layout relative z-10 flex min-h-0 w-full flex-col gap-3 overflow-hidden p-4 pb-0"
    >
      <div className="tm-home-layout__hero shrink-0">{hero}</div>
      <div className="tm-home-layout__body flex min-h-0 flex-1 flex-col overflow-hidden">{body}</div>
    </div>
  );
}
