"use client";

import { useLayoutEffect, type RefObject } from "react";
import {
  resetLayoutAboveTabBar,
  syncLayoutAboveIndicators,
  syncLayoutAboveTabBar,
  syncLayoutFitAboveTabBar,
  VIEWPORT_CHROME_SYNC_EVENT,
} from "@/lib/layout/viewport-chrome";
import { TAB_INDICATORS_SYNC_EVENT } from "@/lib/layout/tab-indicators-position";

export type LayoutBottomAnchor = "tabbar" | "indicators";
export type LayoutHeightMode = "viewport" | "content";

/** Fija la altura del contenedor hasta la TabBar o los indicadores swipe. */
export function useLayoutAboveTabBar(
  rootRef: RefObject<HTMLElement | null>,
  enabled = true,
  bottomAnchor: LayoutBottomAnchor = "tabbar",
  heightMode: LayoutHeightMode = "viewport"
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      if (heightMode === "content") {
        syncLayoutFitAboveTabBar(root);
        return;
      }
      if (bottomAnchor === "indicators") {
        syncLayoutAboveIndicators(root);
      } else {
        syncLayoutAboveTabBar(root);
      }
    };

    sync();
    requestAnimationFrame(sync);

    const observedNodes = new Set<Element>();

    const observeNode = (node: Element | null | undefined) => {
      if (!node || observedNodes.has(node)) return;
      observedNodes.add(node);
      observer.observe(node);
    };

    const observer = new ResizeObserver(sync);
    observeNode(root);
    observeNode(root.parentElement);

    const observeChromeNodes = () => {
      observeNode(document.querySelector('nav[aria-label="Navegacion principal"]'));
    };

    observeChromeNodes();

    const mutationObserver = new MutationObserver(() => {
      observeChromeNodes();
      sync();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", sync);
    window.addEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    if (bottomAnchor === "indicators") {
      window.addEventListener(TAB_INDICATORS_SYNC_EVENT, sync);
    }

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      if (bottomAnchor === "indicators") {
        window.removeEventListener(TAB_INDICATORS_SYNC_EVENT, sync);
      }
      resetLayoutAboveTabBar(root);
    };
  }, [rootRef, enabled, bottomAnchor, heightMode]);
}
