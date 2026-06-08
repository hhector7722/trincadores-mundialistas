function imageExtension(mimeType: string): string {
  return mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
}

function toAbsoluteImageUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  return new URL(url, window.location.origin).href;
}

async function blobFromImageElement(image: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar la imagen.");
  }

  context.drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo exportar la imagen."))),
      "image/png"
    );
  });
}

async function loadImageBlob(url: string, imageElement?: HTMLImageElement | null): Promise<Blob> {
  if (imageElement?.complete && imageElement.naturalWidth > 0) {
    try {
      return await blobFromImageElement(imageElement);
    } catch {
      // Canvas puede fallar por CORS; intentamos fetch.
    }
  }

  const response = await fetch(toAbsoluteImageUrl(url), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("No se pudo descargar la imagen.");
  }

  return response.blob();
}

async function shareImageFile(file: File): Promise<void> {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    throw new Error("Share API no disponible.");
  }

  if (!navigator.canShare({ files: [file] })) {
    throw new Error("No se puede compartir este archivo.");
  }

  await navigator.share({
    files: [file],
    title: file.name,
  });
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  if (/android|iphone|ipad|ipod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isShareSaveCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function canSaveImageToGallery(): boolean {
  return isMobileDevice();
}

/** Guarda la imagen en galeria (movil) o la descarga (escritorio). */
export async function saveImageToGallery(options: {
  url: string;
  baseFilename: string;
  imageElement?: HTMLImageElement | null;
}): Promise<void> {
  const blob = await loadImageBlob(options.url, options.imageElement);
  const mimeType = blob.type || "image/png";
  const filename = `${options.baseFilename}.${imageExtension(mimeType)}`;
  const file = new File([blob], filename, { type: mimeType });

  if (isMobileDevice()) {
    try {
      await shareImageFile(file);
      return;
    } catch (error) {
      if (isShareSaveCancellation(error)) {
        return;
      }
      throw new Error("No se pudo abrir el menu para guardar la imagen.");
    }
  }

  triggerBrowserDownload(blob, filename);
}
