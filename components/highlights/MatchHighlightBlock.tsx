"use client";

import { useCallback } from "react";
import { MatchHighlightThumbnail } from "@/components/highlights/MatchHighlightThumbnail";
import { highlightSourceLabel, type HighlightSourceCode } from "@/lib/youtube/highlight-priority";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchHighlightBlockProps = {
  homeTeam: string;
  awayTeam: string;
  youtubeVideoId: string;
  highlightSource?: HighlightSourceCode | null;
  headline?: string | null;
  variant?: "hero" | "modal";
  compactThumbnail?: boolean;
  className?: string;
};

export function MatchHighlightBlock({
  homeTeam,
  awayTeam,
  youtubeVideoId,
  highlightSource = null,
  headline = null,
  variant = "modal",
  compactThumbnail = false,
  className,
}: MatchHighlightBlockProps) {
  const title = `${teamAbbr(homeTeam)} - ${teamAbbr(awayTeam)}`;
  const sourceLabel = highlightSourceLabel(highlightSource);

  const handlePlay = useCallback(() => {
    if (window.confirm("¿Estás seguro de que quieres abrir este vídeo en YouTube?")) {
      window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, "_blank");
    }
  }, [youtubeVideoId]);

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
            <p className="line-clamp-2 text-left text-[clamp(8px,2.2cqw,9px)] font-medium leading-snug text-white/75">
              {headline?.trim() || `Resumen del partido`}
            </p>
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
    </>
  );
}
