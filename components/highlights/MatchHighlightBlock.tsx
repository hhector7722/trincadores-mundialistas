"use client";

import { useCallback, useMemo, useState } from "react";
import { MatchHighlightPlayerModal } from "@/components/highlights/MatchHighlightPlayerModal";
import { MatchHighlightThumbnail } from "@/components/highlights/MatchHighlightThumbnail";
import { highlightSourceLabel, type HighlightSourceCode } from "@/lib/youtube/highlight-priority";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";
import type { AlternativeSource } from "@/lib/highlights/types";

type MatchHighlightBlockProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  youtubeVideoId: string;
  matchId?: string;
  highlightSource?: HighlightSourceCode | null;
  headline?: string | null;
  variant?: "hero" | "modal";
  compactThumbnail?: boolean;
  className?: string;
  alternativeSources?: AlternativeSource[];
};

export function MatchHighlightBlock({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  youtubeVideoId,
  matchId,
  highlightSource = null,
  headline = null,
  variant = "modal",
  compactThumbnail = false,
  className,
  alternativeSources = [],
}: MatchHighlightBlockProps) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const title = `${teamAbbr(homeTeam)} - ${teamAbbr(awayTeam)}`;
  const sourceLabel = highlightSourceLabel(highlightSource);

  const allSources = useMemo(() => {
    const sources: { videoId: string; source: HighlightSourceCode | null }[] = [
      { videoId: youtubeVideoId, source: highlightSource },
      ...alternativeSources.map((a) => ({ videoId: a.videoId, source: a.source })),
    ];
    return sources;
  }, [youtubeVideoId, highlightSource, alternativeSources]);

  const currentSource = allSources[currentVideoIndex] ?? allSources[0];

  const handlePlayerError = useCallback(() => {
    setCurrentVideoIndex((prev) => {
      const next = prev + 1;
      if (next >= allSources.length) {
        setPlayerOpen(false);
        return 0;
      }
      return next;
    });
  }, [allSources.length]);

  const handlePlay = useCallback(() => {
    setCurrentVideoIndex(0);
    setPlayerOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setPlayerOpen(false);
    setCurrentVideoIndex(0);
  }, []);

  return (
    <>
      <div className={cn("flex flex-col", className)}>
        {variant === "hero" ? (
          <div className="flex w-full min-w-0 flex-col gap-1">
            <div className="tm-hero-highlight-meta-row w-full min-w-0">
              <span className="tm-hero-highlight-pill whitespace-nowrap">
                <img
                  src="/icons/youtube-play.png"
                  alt=""
                  width={633}
                  height={452}
                  aria-hidden="true"
                  className="tm-hero-highlight-pill-logo"
                  decoding="async"
                />
                <span className="tm-hero-highlight-pill-label">HIGHLIGHTS</span>
              </span>
            </div>
            {headline?.trim() ? (
              <p className="line-clamp-2 text-left text-[clamp(8px,2.2cqw,9px)] font-medium leading-snug text-white/75">
                {headline.trim()}
              </p>
            ) : null}
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={handlePlay}
              compact
              className="mx-0 w-full max-w-none"
            />
          </div>
        ) : (
          <>
            <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
              {sourceLabel}
            </p>
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={handlePlay}
              reduced={compactThumbnail}
              className="max-w-none"
            />
          </>
        )}
      </div>

      <MatchHighlightPlayerModal
        open={playerOpen}
        onClose={handleClose}
        videoId={currentSource.videoId}
        title={title}
        matchId={matchId}
        onError={handlePlayerError}
      />
    </>
  );
}
