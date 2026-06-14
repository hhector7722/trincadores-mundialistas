"use client";

import { useEffect, useRef, useState } from "react";
import { isDerivedLabAssetUrl } from "@/lib/quiz/lab/generate-question.client";

export function isSilhouetteAssetUrl(imageUrl: string): boolean {
  return (
    isDerivedLabAssetUrl(imageUrl) &&
    (imageUrl.includes("variant=silhouette") || imageUrl.includes("variant%3Dsilhouette"))
  );
}

const DEFAULT_TIMEOUT_MS = 45_000;
const SILHOUETTE_TIMEOUT_MS = 75_000;

export function labAssetLoadingTimeoutMs(imageUrl: string): number {
  return isSilhouetteAssetUrl(imageUrl) ? SILHOUETTE_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

export function useLabAssetImageLoading(imageUrl: string, enabled = true) {
  const isRemoteAsset = enabled && isDerivedLabAssetUrl(imageUrl);
  const timeoutMs = labAssetLoadingTimeoutMs(imageUrl);
  const [assetLoading, setAssetLoading] = useState(isRemoteAsset);
  const [assetError, setAssetError] = useState(false);
  const [assetTimedOut, setAssetTimedOut] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearLoadingTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearLoadingTimeout();

    if (!isRemoteAsset) {
      setAssetLoading(false);
      setAssetError(false);
      setAssetTimedOut(false);
      return;
    }

    setAssetLoading(true);
    setAssetError(false);
    setAssetTimedOut(false);

    timeoutRef.current = window.setTimeout(() => {
      setAssetLoading(false);
      setAssetError(true);
      setAssetTimedOut(true);
      timeoutRef.current = null;
    }, timeoutMs);

    return clearLoadingTimeout;
  }, [imageUrl, isRemoteAsset, timeoutMs]);

  const onAssetLoad = () => {
    clearLoadingTimeout();
    setAssetLoading(false);
    setAssetError(false);
    setAssetTimedOut(false);
  };

  const onAssetError = () => {
    clearLoadingTimeout();
    setAssetLoading(false);
    setAssetError(true);
  };

  return {
    isRemoteAsset,
    assetLoading,
    assetError,
    assetTimedOut,
    onAssetLoad,
    onAssetError,
  };
}
