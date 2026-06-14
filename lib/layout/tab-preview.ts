"use client";

import { useSearchParams } from "next/navigation";

export const TAB_PREVIEW_PARAM = "tmTabPreview";

export function toTabPreviewUrl(href: string): string {
  const url = new URL(href, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  url.searchParams.set(TAB_PREVIEW_PARAM, "1");
  return `${url.pathname}${url.search}`;
}

export function useTabPreviewMode(): boolean {
  const params = useSearchParams();
  return params.get(TAB_PREVIEW_PARAM) === "1";
}
