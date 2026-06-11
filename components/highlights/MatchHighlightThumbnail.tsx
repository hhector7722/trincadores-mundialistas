"use client";

import { Play } from "lucide-react";
import { youtubeThumbnailUrl } from "@/lib/youtube/constants";
import { cn } from "@/lib/utils";

type MatchHighlightThumbnailProps = {
  videoId: string;
  title: string;
  onPlay: () => void;
  className?: string;
};

export function MatchHighlightThumbnail({
  videoId,
  title,
  onPlay,
  className,
}: MatchHighlightThumbnailProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onPlay();
      }}
      className={cn(
        "group relative mx-auto block w-full max-w-[13.5rem] overflow-hidden rounded-xl border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        className,
      )}
      aria-label={`Reproducir resumen: ${title}`}
    >
      <img
        src={youtubeThumbnailUrl(videoId)}
        alt=""
        className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="eager"
        decoding="async"
      />
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10"
        aria-hidden="true"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#CCFF00] text-black shadow-[0_0_24px_rgba(204,255,0,0.45)] transition-transform group-hover:scale-105">
          <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
