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
import { setHeroHighlightScorelineVisible } from "@/actions/highlights";
import { canControlHighlightScorelineVisibility } from "@/lib/highlights/hero-scoreline-visibility";

type HighlightScorelineVisibilityContextValue = {
  visible: boolean;
  toggleVisible: () => void;
  canControl: boolean;
  pending: boolean;
};

const HighlightScorelineVisibilityContext =
  createContext<HighlightScorelineVisibilityContextValue | null>(null);

export function HighlightScorelineVisibilityProvider({
  poolId,
  username,
  initialVisible,
  children,
}: {
  poolId: string;
  username: string | null;
  initialVisible: boolean;
  children: ReactNode;
}) {
  const canControl = canControlHighlightScorelineVisibility(username);
  const [visible, setVisible] = useState(initialVisible);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setVisible(initialVisible);
  }, [initialVisible]);

  const toggleVisible = useCallback(async () => {
    if (!canControl || pending) return;

    const next = !visible;
    setVisible(next);
    setPending(true);

    const result = await setHeroHighlightScorelineVisible(poolId, next);
    setPending(false);

    if (!result.ok) {
      setVisible(visible);
    }
  }, [canControl, pending, poolId, visible]);

  const value = useMemo(
    () => ({
      visible,
      toggleVisible,
      canControl,
      pending,
    }),
    [canControl, pending, toggleVisible, visible],
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
      toggleVisible: () => {},
      canControl: false,
      pending: false,
    };
  }
  return ctx;
}
