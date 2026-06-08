"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getMainTabSectionIndex } from "@/lib/layout/main-tabs";

type TabNavigationContextValue = {
  swipeProgress: number | null;
  setSwipeProgress: (progress: number | null) => void;
  activeIndex: number | null;
};

const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

export function TabNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [swipeProgress, setSwipeProgress] = useState<number | null>(null);
  const activeIndex = getMainTabSectionIndex(pathname);

  const value = useMemo(
    () => ({
      swipeProgress,
      setSwipeProgress,
      activeIndex,
    }),
    [activeIndex, swipeProgress]
  );

  return <TabNavigationContext.Provider value={value}>{children}</TabNavigationContext.Provider>;
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  return (
    context ?? {
      swipeProgress: null,
      setSwipeProgress: () => undefined,
      activeIndex: null,
    }
  );
}

export function useTabIndicatorProgress() {
  const { swipeProgress, activeIndex } = useTabNavigation();
  if (swipeProgress != null) return swipeProgress;
  if (activeIndex != null) return activeIndex;
  return 0;
}
