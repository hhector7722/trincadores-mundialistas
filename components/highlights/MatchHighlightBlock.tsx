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
  variant?: "hero" | "modal";
  className?: string;
};

export function MatchHighlightBlock({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  youtubeVideoId,
  highlightSource = null,
  variant = "modal",
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
          <>
            <MatchHighlightScoreline
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeGoals={homeGoals}
              awayGoals={awayGoals}
              className="mt-0.5"
            />
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={openPlayer}
              compact
              className="mt-1"
            />
          </>
        ) : (
          <>
            <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
              {sourceLabel}
            </p>
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={openPlayer}
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
