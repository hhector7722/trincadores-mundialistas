"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NotificationRow } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_LIMIT = 30;
const FETCH_ERROR_COOLDOWN_MS = 30_000;

type Options = {
  withItems?: boolean;
  limit?: number;
  onFetchError?: (message: string) => void;
};

export function useUnreadNotificationCount(options: Options = {}) {
  const { withItems = false, limit = DEFAULT_LIMIT, onFetchError } = options;
  const onFetchErrorRef = useRef(onFetchError);
  onFetchErrorRef.current = onFetchError;

  const supabase = useMemo(() => createClient(), []);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchErrorAtRef = useRef(0);

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!profileId) return;
      const force = opts?.force === true;
      if (
        !force &&
        lastFetchErrorAtRef.current > 0 &&
        Date.now() - lastFetchErrorAtRef.current < FETCH_ERROR_COOLDOWN_MS
      ) {
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from("notifications")
          .select(withItems ? "*" : "id", { count: "exact", head: !withItems })
          .eq("profile_id", profileId)
          .is("read_at", null)
          .order("created_at", { ascending: false });

        if (withItems) {
          query = query.limit(limit);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        lastFetchErrorAtRef.current = 0;
        setUnreadCount(count ?? (withItems ? (data?.length ?? 0) : 0));
        if (withItems) {
          setItems((data ?? []) as NotificationRow[]);
        }
      } catch (e) {
        lastFetchErrorAtRef.current = Date.now();
        const msg =
          (e as { message?: string })?.message || "No se pudieron cargar las notificaciones";
        onFetchErrorRef.current?.(msg);
        setUnreadCount(0);
        if (withItems) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase, profileId, withItems, limit],
  );

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setProfileId(session?.user?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!profileId) {
      setUnreadCount(0);
      setItems([]);
      lastFetchErrorAtRef.current = 0;
      return;
    }
    void refreshRef.current();
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          void refreshRef.current();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          void refreshRef.current();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, profileId]);

  useEffect(() => {
    if (!profileId) return;
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshRef.current();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [profileId]);

  const refreshStable = useCallback(() => refreshRef.current({ force: true }), []);

  return { profileId, unreadCount, items, loading, refresh: refreshStable, supabase };
}
