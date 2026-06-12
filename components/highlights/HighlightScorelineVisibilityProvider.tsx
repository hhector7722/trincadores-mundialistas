"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  canControlHighlightScorelineVisibility,
  readHighlightScorelineVisible,
  writeHighlightScorelineVisible,
} from "@/lib/highlights/hero-scoreline-visibility";

type HighlightScorelineVisibilityContextValue = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
  canControl: boolean;
};

const HighlightScorelineVisibilityContext =
  createContext<HighlightScorelineVisibilityContextValue | null>(null);

export function HighlightScorelineVisibilityProvider({
  username,
  children,
}: {
  username: string | null;
  children: ReactNode;
}) {
  const canControl = canControlHighlightScorelineVisibility(username);
  const [visible, setVisibleState] = useState(true);

  useEffect(() => {
    setVisibleState(readHighlightScorelineVisible());
  }, []);

  const setVisible = useCallback((next: boolean) => {
    setVisibleState(next);
    writeHighlightScorelineVisible(next);
  }, []);

  const toggleVisible = useCallback(() => {
    setVisibleState((current) => {
      const next = !current;
      writeHighlightScorelineVisible(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      visible: canControl ? visible : true,
      setVisible,
      toggleVisible,
      canControl,
    }),
    [canControl, setVisible, toggleVisible, visible],
  );

  return (
    <HighlightScorelineVisibilityContext.Provider value={value}>
      {children}
    </HighlightScorelineVisibilityContext.Provider>
  );
}

export function useHighlightScorelineVisibility(): HighlightScorelineVisibilityContextValue {
  const ctx = useContext(HighlightScorelineVisibilityContext);
  if (!ctx) {
    return {
      visible: true,
      setVisible: () => {},
      toggleVisible: () => {},
      canControl: false,
    };
  }
  return ctx;
}
