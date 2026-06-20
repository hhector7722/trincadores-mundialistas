"use client";

import { useTabPreviewMode } from "@/lib/layout/tab-preview";
import {
  isAppHeaderVisible,
  isDocumentScrollPath,
} from "@/lib/layout/app-shell-paths";
import { useEffectiveShellPathname } from "@/lib/layout/use-effective-shell-pathname";

/** Degradado fijo bajo cabecera: atenúa el contenido que scrolla por debajo (scroll documento). */
export function HeaderContentFade() {
  const pathname = useEffectiveShellPathname();
  const previewMode = useTabPreviewMode();

  if (previewMode || !isAppHeaderVisible(pathname) || !isDocumentScrollPath(pathname)) {
    return null;
  }

  return <div className="tm-header-content-fade" aria-hidden />;
}
