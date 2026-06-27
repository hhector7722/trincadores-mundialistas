"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { fetchMatchHighlightModalContextAction } from "@/actions/notifications";
import { HIGHLIGHT_NOTIFICATION_QUERY } from "@/lib/push/urls";

function HighlightNotificationOpenerInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const matchId = searchParams.get(HIGHLIGHT_NOTIFICATION_QUERY);

  useEffect(() => {
    if (!matchId) return;

    let cancelled = false;

    void (async () => {
      const result = await fetchMatchHighlightModalContextAction(matchId);
      if (cancelled) return;

      const params = new URLSearchParams(searchParams.toString());
      params.delete(HIGHLIGHT_NOTIFICATION_QUERY);
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });

      if (!result.ok || !result.data.highlightYoutubeId) return;

      if (window.confirm("¿Estás seguro de que quieres abrir este vídeo en YouTube?")) {
        window.open(`https://www.youtube.com/watch?v=${result.data.highlightYoutubeId}`, "_blank");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId, pathname, router, searchParams]);

  return null;
}

export function HighlightNotificationOpener() {
  return (
    <Suspense fallback={null}>
      <HighlightNotificationOpenerInner />
    </Suspense>
  );
}
