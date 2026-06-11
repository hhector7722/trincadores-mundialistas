"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useUnreadNotificationCount } from "@/components/notifications/useUnreadNotificationCount";
import type { NotificationRow } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

type UnreadNotificationsContextValue = {
  profileId: string | null;
  unreadCount: number;
  items: NotificationRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  supabase: SupabaseClient;
};

const UnreadNotificationsContext = createContext<UnreadNotificationsContextValue | null>(null);

export function UnreadNotificationsProvider({ children }: { children: ReactNode }) {
  const handleFetchError = useCallback((message: string) => {
    console.error("[notifications]", message);
  }, []);

  const { profileId, unreadCount, items, loading, refresh, supabase } = useUnreadNotificationCount({
    withItems: true,
    onFetchError: handleFetchError,
  });

  const value = useMemo(
    () => ({ profileId, unreadCount, items, loading, refresh, supabase }),
    [profileId, unreadCount, items, loading, refresh, supabase],
  );

  return (
    <UnreadNotificationsContext.Provider value={value}>
      {children}
    </UnreadNotificationsContext.Provider>
  );
}

export function useUnreadNotifications() {
  const ctx = useContext(UnreadNotificationsContext);
  if (!ctx) {
    throw new Error("useUnreadNotifications debe usarse dentro de UnreadNotificationsProvider");
  }
  return ctx;
}
