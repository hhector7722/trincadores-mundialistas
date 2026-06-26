"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { trackUsageHighlightOpen, trackUsageHighlightWatch } from "@/lib/usage/client";
import { loadYouTubeIframeApi, type YTPlayer } from "@/lib/youtube/iframe-api";

const EMBED_DISABLED_CODES = new Set([101, 150]);

type MatchHighlightPlayerModalProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
  matchId?: string;
  onError?: () => void;
};

export function MatchHighlightPlayerModal({
  open,
  onClose,
  videoId,
  title,
  matchId,
  onError,
}: MatchHighlightPlayerModalProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playingSinceRef = useRef<number | null>(null);
  const watchedMsRef = useRef(0);
  const videoDurationSecRef = useRef(0);
  const openTrackedRef = useRef(false);
  const usageLabel = `Resumen: ${title}`;

  const flushPlayingTime = useCallback(() => {
    if (playingSinceRef.current == null) return;
    watchedMsRef.current += Date.now() - playingSinceRef.current;
    playingSinceRef.current = null;
  }, []);

  const reportWatchSession = useCallback(() => {
    flushPlayingTime();
    trackUsageHighlightWatch(
      videoId,
      usageLabel,
      pathname,
      watchedMsRef.current,
      videoDurationSecRef.current,
      matchId
    );
  }, [flushPlayingTime, matchId, pathname, usageLabel, videoId]);

  useEffect(() => {
    if (!open) return;

    if (!openTrackedRef.current) {
      openTrackedRef.current = true;
      trackUsageHighlightOpen(videoId, usageLabel, pathname, matchId);
    }

    let destroyed = false;

    void loadYouTubeIframeApi()
      .then((YT) => {
        if (destroyed || !containerRef.current) return;

        playerRef.current = new YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event) => {
              const duration = event.target.getDuration();
              if (duration > 0) {
                videoDurationSecRef.current = duration;
              }
            },
            onStateChange: (event) => {
              const { PLAYING, PAUSED, ENDED, BUFFERING } = YT.PlayerState;

              if (event.data === PLAYING) {
                playingSinceRef.current = Date.now();
                return;
              }

              if (event.data === PAUSED || event.data === ENDED || event.data === BUFFERING) {
                flushPlayingTime();
              }
            },
            onError: (event) => {
              if (EMBED_DISABLED_CODES.has(event.data)) {
                onError?.();
              }
            },
          },
        });
      })
      .catch(() => {
        // Sin API: al menos queda highlight_open al abrir el modal.
      });

    return () => {
      destroyed = true;
      reportWatchSession();
      playerRef.current?.destroy();
      playerRef.current = null;
      playingSinceRef.current = null;
      watchedMsRef.current = 0;
      videoDurationSecRef.current = 0;
      openTrackedRef.current = false;
    };
  }, [flushPlayingTime, matchId, onError, open, pathname, reportWatchSession, usageLabel, videoId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      disableUsageTracking
      title="Resumen del partido"
      ariaLabel={title}
      scrollContent={false}
      className="max-w-3xl"
    >
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="overflow-hidden rounded-xl border border-[var(--tm-border)] bg-black">
          <div className="relative aspect-video w-full">
            {open ? <div ref={containerRef} className="absolute inset-0 h-full w-full" /> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
