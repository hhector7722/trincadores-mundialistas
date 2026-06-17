"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type QuizWaitModalProps = {
  open: boolean;
  onClose: () => void;
  message: string;
  hideCloseButton?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  children?: ReactNode;
};

export function QuizWaitModal({
  open,
  onClose,
  message,
  hideCloseButton = false,
  imageSrc,
  imageAlt = "",
  children,
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
          hasImage ? "gap-3 px-4 py-4 sm:px-5 sm:py-5" : "px-3 py-5 sm:px-4"
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={160}
            height={220}
            className="mx-auto h-auto w-[5.5rem] max-w-full object-contain mix-blend-screen drop-shadow-[0_10px_28px_rgba(0,0,0,0.28)] sm:w-[6.25rem]"
            sizes="100px"
            priority
          />
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
        {children ? <div className="flex w-full flex-col items-center gap-2">{children}</div> : null}
      </div>
    </Modal>
  );
}
