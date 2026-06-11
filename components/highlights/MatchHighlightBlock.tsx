"use client";

import { useState } from "react";
import { MatchHighlightPlayerModal } from "@/components/highlights/MatchHighlightPlayerModal";
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
            <div className="mt-0.5 flex w-full min-w-0 items-center gap-1.5 overflow-hidden">
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#CCFF00] px-[clamp(8px,2.5cqw,10px)] py-[clamp(3px,1cqw,4px)] text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-black">
                Last match
              </span>
              <p className="min-w-0 truncate text-[clamp(9px,2.4cqw,10px)] font-bold uppercase tracking-wide text-white/85">
                {teamAbbr(homeTeam)} {homeGoals} - {awayGoals} {teamAbbr(awayTeam)}
              </p>
            </div>
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={openPlayer}
              compact
              className="mt-1 w-full"
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
