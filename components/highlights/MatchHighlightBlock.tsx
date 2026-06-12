"use client";

import { useState } from "react";
import { MatchHighlightPlayerModal } from "@/components/highlights/MatchHighlightPlayerModal";
import { MatchHighlightScoreline } from "@/components/highlights/MatchHighlightScoreline";
import { MatchHighlightThumbnail } from "@/components/highlights/MatchHighlightThumbnail";
import { highlightSourceLabel, type HighlightSourceCode } from "@/lib/youtube/highlight-priority";
import { youtubeEmbedUrl } from "@/lib/youtube/constants";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchHighlightBlockProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  youtubeVideoId: string;
  highlightSource?: HighlightSourceCode | null;
  headline?: string | null;
  variant?: "hero" | "modal";
  /** Reduce altura del thumbnail ~22 % en modal detalle. */
  compactThumbnail?: boolean;
  className?: string;
};

export function MatchHighlightBlock({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  youtubeVideoId,
  highlightSource = null,
  headline = null,
  variant = "modal",
  compactThumbnail = false,
  className,
}: MatchHighlightBlockProps) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const title = `${teamAbbr(homeTeam)} - ${teamAbbr(awayTeam)}`;
  const sourceLabel = highlightSourceLabel(highlightSource);
  function openPlayer() {
    setEmbedSrc(youtubeEmbedUrl(youtubeVideoId, true));
    setPlayerOpen(true);
  }

  function closePlayer() {
    setPlayerOpen(false);
    setEmbedSrc(null);
  }

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
              <MatchHighlightScoreline
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                homeGoals={homeGoals}
                awayGoals={awayGoals}
              />
            </div>
            {headline?.trim() ? (
              <p className="line-clamp-2 text-left text-[clamp(8px,2.2cqw,9px)] font-medium leading-snug text-white/75">
                {headline.trim()}
              </p>
            ) : null}
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={openPlayer}
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
              onPlay={openPlayer}
              reduced={compactThumbnail}
              className="max-w-none"
            />
          </>
        )}
      </div>

      <MatchHighlightPlayerModal
        open={playerOpen}
        onClose={closePlayer}
        embedSrc={embedSrc}
        title={title}
      />
    </>
  );
}
