"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

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

async function downloadAvatarImage(avatarUrl: string, baseFilename: string): Promise<void> {
  const response = await fetch(avatarUrl);
  if (!response.ok) {
    throw new Error("No se pudo descargar la imagen.");
  }

  const blob = await response.blob();
  const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${baseFilename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function AvatarPreviewModal({ open, onClose, avatarUrl, label }: Props) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await downloadAvatarImage(avatarUrl, avatarDownloadFilename(label));
    } catch {
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
      wrapperClassName="fixed inset-0 z-10 flex h-full max-w-none w-full flex-col items-stretch justify-between p-0"
      className="flex max-h-none h-full min-h-0 w-full max-w-none flex-col rounded-none border-0 bg-transparent shadow-none backdrop-blur-none"
      backdropClassName="bg-[#2a1058]/95 backdrop-blur-lg"
      belowPanel={
        <div className="pointer-events-auto flex w-full flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
      }
    >
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex max-h-[min(72dvh,calc(100vw-2rem))] max-w-[min(72dvh,calc(100vw-2rem))] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={`Avatar de ${label}`}
            className="max-h-full max-w-full rounded-full border-2 border-[var(--tm-accent)] object-cover shadow-[0_0_64px_rgba(217,255,0,0.25)]"
          />
        </div>

        <p className="text-center font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
          {label}
        </p>
      </div>
    </Modal>
  );
}
