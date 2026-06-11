"use client";

import { Modal } from "@/components/ui/modal";
import { youtubeEmbedUrl } from "@/lib/youtube/constants";

type MatchHighlightPlayerModalProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
};

export function MatchHighlightPlayerModal({
  open,
  onClose,
  videoId,
  title,
}: MatchHighlightPlayerModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resumen del partido"
      ariaLabel={title}
      scrollContent={false}
      className="max-w-3xl"
    >
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="overflow-hidden rounded-xl border border-[var(--tm-border)] bg-black">
          <div className="relative aspect-video w-full">
            {open ? (
              <iframe
                src={youtubeEmbedUrl(videoId, true)}
                title={title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
