"use client";

import { useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { isShareSaveCancellation, saveImageToGallery, canSaveImageToGallery } from "@/lib/media/save-image-to-gallery";

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
      wrapperClassName="relative z-10 flex h-full min-h-0 w-full max-w-none flex-1 flex-col items-stretch justify-between gap-0 pointer-events-none"
      className="flex max-h-none h-full min-h-0 w-full max-w-none flex-1 flex-col rounded-none border-0 bg-transparent shadow-none backdrop-blur-none"
      backdropClassName="bg-[#2a1058]/95 backdrop-blur-lg"
      belowPanel={
        <div className="pointer-events-auto flex w-full shrink-0 flex-col items-center gap-2 border-t border-white/10 bg-[#2a1058]/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
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
          ) : canSaveImageToGallery() ? (
            <p className="text-center text-xs text-white/50">
              Elige «Guardar imagen» o «Fotos» en el menu que se abre.
            </p>
          ) : null}
        </div>
      }
    >
      <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={avatarUrl}
            alt={`Avatar de ${label}`}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>

        <p className="shrink-0 pt-3 text-center font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
          {label}
        </p>
      </div>
    </Modal>
  );
}
