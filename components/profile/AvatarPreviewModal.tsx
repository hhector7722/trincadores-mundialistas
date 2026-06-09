"use client";

import { useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { isShareSaveCancellation, saveImageToGallery } from "@/lib/media/save-image-to-gallery";

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
      hideHeader
      ariaLabel={`Avatar ampliado de ${label}`}
      containerClassName="fixed inset-0 z-[100] flex flex-col p-0"
      wrapperClassName="relative z-10 flex h-full min-h-0 w-full max-w-none flex-1 flex-col items-center justify-center pointer-events-none"
      className="flex max-h-none h-full min-h-0 w-full max-w-none flex-1 flex-col rounded-none border-0 bg-transparent shadow-none backdrop-blur-none"
      backdropClassName="bg-[#2a1058]/95 backdrop-blur-lg"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="pointer-events-auto fixed right-0 top-0 z-[110] flex h-12 w-12 shrink-0 items-center justify-center bg-black/30 text-white transition-colors hover:bg-black/50 pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)]"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="pointer-events-auto flex w-full flex-col items-center justify-center gap-4 px-4 py-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={avatarUrl}
          alt={`Avatar de ${label}`}
          className="max-h-[min(65dvh,calc(100vw-2rem))] max-w-full rounded-xl object-contain"
        />
        <Button
          type="button"
          className="w-full max-w-sm gap-2"
          disabled={saving}
          onClick={handleSave}
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          {saving ? "Guardando..." : "Guardar imagen"}
        </Button>
        {saveError ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
