"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type QuizWaitModalProps = {
  open: boolean;
  onClose: () => void;
  message: string;
  hideCloseButton?: boolean;
  imageSrc?: string;
  imageAlt?: string;
};

export function QuizWaitModal({
  open,
  onClose,
  message,
  hideCloseButton = false,
  imageSrc,
  imageAlt = "",
}: QuizWaitModalProps) {
  const hasImage = Boolean(imageSrc);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={message}
      hideTitle
      hideHeader={hasImage}
      headerCompact
      hideHeaderDivider
      hideCloseButton={hideCloseButton}
      ariaLabel={message}
      wrapperClassName="w-full max-w-[min(100vw-1rem,28rem)]"
    >
      <div
        className={cn(
          "flex flex-col items-center",
          hasImage ? "gap-4 px-4 py-5 sm:px-5 sm:py-6" : "px-3 py-5 sm:px-4"
        )}
      >
        {imageSrc ? (
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[11.5rem] overflow-hidden rounded-2xl bg-black sm:max-w-[13rem]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 46vw, 208px"
              priority
            />
          </div>
        ) : null}
        <p
          className={cn(
            "text-center font-semibold leading-snug tracking-tight text-[var(--tm-fg)]",
            hasImage
              ? "text-sm sm:text-base"
              : cn(
                  "whitespace-nowrap leading-tight",
                  "text-[length:clamp(0.6875rem,3.6vw,1.25rem)]"
                )
          )}
        >
          {message}
        </p>
      </div>
    </Modal>
  );
}
