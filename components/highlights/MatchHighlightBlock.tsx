"use client";

import { useState } from "react";
import { MatchHighlightPlayerModal } from "@/components/highlights/MatchHighlightPlayerModal";
import { MatchHighlightScoreline } from "@/components/highlights/MatchHighlightScoreline";
import { MatchHighlightThumbnail } from "@/components/highlights/MatchHighlightThumbnail";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchHighlightBlockProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  youtubeVideoId: string;
  variant?: "hero" | "modal";
  className?: string;
};

export function MatchHighlightBlock({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  youtubeVideoId,
  variant = "modal",
  className,
}: MatchHighlightBlockProps) {
  const [playerOpen, setPlayerOpen] = useState(false);
  const title = `${teamAbbr(homeTeam)} - ${teamAbbr(awayTeam)}`;

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
              className="mt-1"
            />
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={() => setPlayerOpen(true)}
              className="mt-2"
            />
          </>
        ) : (
          <>
            <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
              Resumen FIFA
            </p>
            <MatchHighlightThumbnail
              videoId={youtubeVideoId}
              title={title}
              onPlay={() => setPlayerOpen(true)}
              className="max-w-none"
            />
          </>
        )}
      </div>

      <MatchHighlightPlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        videoId={youtubeVideoId}
        title={title}
      />
    </>
  );
}
