"use client";

import { Play } from "lucide-react";
import { youtubeThumbnailUrl } from "@/lib/youtube/constants";
import { cn } from "@/lib/utils";

type MatchHighlightThumbnailProps = {
  videoId: string;
  title: string;
  onPlay: () => void;
  className?: string;
  /** Hero home: miniatura compacta para igualar altura del carrusel. */
  compact?: boolean;
};

export function MatchHighlightThumbnail({
  videoId,
  title,
  onPlay,
  className,
  compact = false,
}: MatchHighlightThumbnailProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onPlay();
      }}
      className={cn(
        "group relative mx-auto block w-full overflow-hidden rounded-lg border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.28)]",
        compact ? "max-w-[7.25rem]" : "max-w-[13.5rem] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        className,
      )}
      aria-label={`Reproducir resumen: ${title}`}
    >
      <img
        src={youtubeThumbnailUrl(videoId, compact ? "mqdefault" : "hqdefault")}
        alt=""
        className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="eager"
        decoding="async"
      />
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent"
        aria-hidden="true"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-zinc-600/85 text-white shadow-md transition-transform group-hover:scale-105",
            compact ? "h-7 w-7" : "h-9 w-9",
          )}
        >
          <Play
            className={cn("fill-current", compact ? "ml-0.5 h-3.5 w-3.5" : "ml-0.5 h-4 w-4")}
            aria-hidden="true"
          />
        </span>
      </span>
    </button>
  );
}
