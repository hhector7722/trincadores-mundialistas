"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { isShareSaveCancellation, saveImageToGallery } from "@/lib/media/save-image-to-gallery";
import { cn } from "@/lib/utils";

const AVATAR_PREVIEW_IMAGE_CLASS =
  "max-h-[min(65dvh,calc(100vw-2rem))] max-w-full rounded-xl object-contain";

type Props = {
  open: boolean;
  onClose: () => void;
  avatarUrl: string;
  label: string;
};

function avatarDownloadFilename(label: string): string {
  const slug =
    label
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "avatar";
  return `${slug}-avatar`;
}

export function AvatarPreviewModal({ open, onClose, avatarUrl, label }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveImageToGallery({
        url: avatarUrl,
        baseFilename: avatarDownloadFilename(label),
        imageElement: imageRef.current,
      });
    } catch (error) {
      if (isShareSaveCancellation(error)) {
        return;
      }
      setSaveError("No se pudo guardar la imagen. Intentalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label}
      headerTitleAlign="left"
      ariaLabel={`Avatar ampliado de ${label}`}
      wrapperClassName="w-max max-w-[calc(100vw-2rem)]"
      panelHostClassName="w-max"
      className="w-max max-w-[calc(100vw-2rem)]"
    >
      <div className="flex flex-col items-center gap-4 px-4 pb-4 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={avatarUrl}
          alt={`Avatar de ${label}`}
          className={AVATAR_PREVIEW_IMAGE_CLASS}
        />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className={cn(
            "inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full",
            "min-h-12 bg-[#CCFF00] px-4 py-2",
            "text-xs font-bold uppercase tracking-wide text-black",
            "transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-wait disabled:opacity-70"
          )}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          {saving ? "Guardando..." : "Guardar imagen"}
        </button>
        {saveError ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
