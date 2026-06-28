"use client";

import { X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const LIGHTBOX_IMAGE_CLASS =
  "block max-h-[min(85dvh,calc(100vw-2rem))] max-w-full rounded-md object-contain";

type ImageLightboxModalProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  ariaLabel?: string;
};

export function ImageLightboxModal({
  open,
  onClose,
  src,
  alt = "",
  ariaLabel = "Imagen ampliada",
}: ImageLightboxModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ariaLabel}
      hideHeader
      ariaLabel={ariaLabel}
      scrollContent={false}
      wrapperClassName="w-max max-w-[calc(100vw-2rem)]"
      panelHostClassName="w-max"
      className={cn(
        "w-max max-w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
      )}
    >
      <div className="relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={LIGHTBOX_IMAGE_CLASS} />
      </div>
    </Modal>
  );
}
