export type LabCropKind = "hair" | "eyes";

export type LabCropFocus = {
  scale: number;
  originX: string;
  originY: string;
  clipTop: string;
  clipRight: string;
  clipBottom: string;
  clipLeft: string;
};

/** Recorte pelo: solo zona superior de la cabeza, sin cejas. */
export const LAB_HAIR_CROP: LabCropFocus = {
  scale: 3.2,
  originX: "50%",
  originY: "6%",
  clipTop: "0%",
  clipRight: "12%",
  clipBottom: "74%",
  clipLeft: "12%",
};

/** Recorte ojos: banda central, sin pelo ni nariz. */
export const LAB_EYES_CROP: LabCropFocus = {
  scale: 4,
  originX: "50%",
  originY: "36%",
  clipTop: "30%",
  clipRight: "18%",
  clipBottom: "54%",
  clipLeft: "18%",
};

export function cropFocusForKind(kind: LabCropKind): LabCropFocus {
  return kind === "hair" ? LAB_HAIR_CROP : LAB_EYES_CROP;
}

export function cropClipPath(focus: LabCropFocus): string {
  return `inset(${focus.clipTop} ${focus.clipRight} ${focus.clipBottom} ${focus.clipLeft})`;
}
