"use client";

import { useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { isShareSaveCancellation, saveImageToGallery } from "@/lib/media/save-image-to-gallery";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  avatarUrl: string;
  label: string;
  /** Perfil: imagen + guardar centrados, sin alias ni barra inferior. */
  layout?: "centered" | "footer";
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

export function AvatarPreviewModal({
  open,
  onClose,
  avatarUrl,
  label,
  layout = "footer",
}: Props) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const centered = layout === "centered";

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

  const saveButton = (
    <Button
      type="button"
      className="w-full max-w-sm gap-2"
      disabled={saving}
      onClick={handleSave}
    >
      <Download className="h-4 w-4 shrink-0" aria-hidden />
      {saving ? "Guardando..." : "Guardar imagen"}
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label}
      hideHeader
      ariaLabel={`Avatar ampliado de ${label}`}
      containerClassName="fixed inset-0 z-[100] flex flex-col p-0"
      wrapperClassName={cn(
        "relative z-10 flex h-full min-h-0 w-full max-w-none flex-1 flex-col pointer-events-none",
        centered ? "items-center justify-center" : "items-stretch justify-between gap-0"
      )}
      className="flex max-h-none h-full min-h-0 w-full max-w-none flex-1 flex-col rounded-none border-0 bg-transparent shadow-none backdrop-blur-none"
      backdropClassName="bg-[#2a1058]/95 backdrop-blur-lg"
      belowPanel={
        centered ? undefined : (
          <div className="pointer-events-auto flex w-full shrink-0 flex-col items-center gap-2 border-t border-white/10 bg-[#2a1058]/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
            <p className="text-center font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
              {label}
            </p>
            {saveButton}
            {saveError ? (
              <p className="text-center text-sm text-red-300" role="alert">
                {saveError}
              </p>
            ) : null}
          </div>
        )
      }
    >
      <div
        className={cn(
          "relative flex w-full flex-col",
          centered
            ? "pointer-events-auto items-center justify-center gap-4 px-4 py-[max(1rem,env(safe-area-inset-top))]"
            : "min-h-[40dvh] flex-1 pt-[max(1rem,env(safe-area-inset-top))]"
        )}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className={cn(
            "absolute right-4 z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50",
            "top-[max(1rem,env(safe-area-inset-top))]"
          )}
        >
          <X className="h-5 w-5" />
        </button>

        {centered ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={avatarUrl}
              alt={`Avatar de ${label}`}
              className="max-h-[min(65dvh,calc(100vw-2rem))] max-w-full rounded-xl object-contain"
            />
            {saveButton}
            {saveError ? (
              <p className="text-center text-sm text-red-300" role="alert">
                {saveError}
              </p>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={avatarUrl}
              alt={`Avatar de ${label}`}
              className="max-h-[min(72dvh,calc(100vw-2rem))] max-w-full rounded-xl object-contain"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
