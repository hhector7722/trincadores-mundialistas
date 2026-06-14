"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchMatchHighlightModalContextAction } from "@/actions/notifications";
import { MatchHighlightPlayerModal } from "@/components/highlights/MatchHighlightPlayerModal";
import { HIGHLIGHT_NOTIFICATION_QUERY } from "@/lib/push/urls";
import { teamAbbr } from "@/lib/teams/display";

function HighlightNotificationOpenerInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const matchId = searchParams.get(HIGHLIGHT_NOTIFICATION_QUERY);
  const [player, setPlayer] = useState<{
    open: boolean;
    videoId: string;
    title: string;
    matchId: string;
  } | null>(null);

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

      const title = `${teamAbbr(result.data.homeTeam)} - ${teamAbbr(result.data.awayTeam)}`;
      setPlayer({
        open: true,
        videoId: result.data.highlightYoutubeId,
        title,
        matchId,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId, pathname, router, searchParams]);

  if (!player?.open) return null;

  return (
    <MatchHighlightPlayerModal
      open={player.open}
      onClose={() => setPlayer(null)}
      videoId={player.videoId}
      title={player.title}
      matchId={player.matchId}
    />
  );
}

export function HighlightNotificationOpener() {
  return (
    <Suspense fallback={null}>
      <HighlightNotificationOpenerInner />
    </Suspense>
  );
}
