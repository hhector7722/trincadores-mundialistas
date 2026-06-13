"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import {
  getMainTabIndex,
  getMainTabIndexForHref,
  getMainTabSectionIndex,
  isMainTabRoot,
} from "@/lib/layout/main-tabs";

export type TabNavigatorApi = {
  commitToTab: (targetIndex: number) => void;
};

type TabNavigationContextValue = {
  swipeProgress: number | null;
  setSwipeProgress: (progress: number | null) => void;
  activeIndex: number | null;
  registerTabNavigator: (api: TabNavigatorApi | null) => void;
  switchMainTab: (href: string) => void;
};

const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

export function TabNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { navigateTab } = useAppNavigation();
  const [swipeProgress, setSwipeProgress] = useState<number | null>(null);
  const navigatorRef = useRef<TabNavigatorApi | null>(null);
  const activeIndex = getMainTabSectionIndex(pathname);

  const registerTabNavigator = useCallback((api: TabNavigatorApi | null) => {
    navigatorRef.current = api;
  }, []);

  const switchMainTab = useCallback(
    (href: string) => {
      const targetIndex = getMainTabIndexForHref(href);
      const currentIndex = getMainTabIndex(pathname);

      if (targetIndex == null || targetIndex === currentIndex) return;

      if (currentIndex != null && isMainTabRoot(pathname) && navigatorRef.current) {
        navigatorRef.current.commitToTab(targetIndex);
        return;
      }

      navigateTab(href);
    },
    [navigateTab, pathname]
  );

  const value = useMemo(
    () => ({
      swipeProgress,
      setSwipeProgress,
      activeIndex,
      registerTabNavigator,
      switchMainTab,
    }),
    [activeIndex, registerTabNavigator, swipeProgress, switchMainTab]
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
      registerTabNavigator: () => undefined,
      switchMainTab: () => undefined,
    }
  );
}

export function useTabIndicatorProgress() {
  const { swipeProgress, activeIndex } = useTabNavigation();
  if (swipeProgress != null) return swipeProgress;
  if (activeIndex != null) return activeIndex;
  return 0;
}
