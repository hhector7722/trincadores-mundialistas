"use client";

import { useEffect, useState } from "react";
import { isDerivedLabAssetUrl } from "@/lib/quiz/lab/generate-question.client";

export function isSilhouetteAssetUrl(imageUrl: string): boolean {
  return (
    isDerivedLabAssetUrl(imageUrl) &&
    (imageUrl.includes("variant=silhouette") || imageUrl.includes("variant%3Dsilhouette"))
  );
}

export function useLabAssetImageLoading(imageUrl: string, enabled = true) {
  const isRemoteAsset = enabled && isDerivedLabAssetUrl(imageUrl);
  const [assetLoading, setAssetLoading] = useState(isRemoteAsset);
  const [assetError, setAssetError] = useState(false);

  useEffect(() => {
    if (!isRemoteAsset) {
      setAssetLoading(false);
      setAssetError(false);
      return;
    }

    setAssetLoading(true);
    setAssetError(false);
  }, [imageUrl, isRemoteAsset]);

  const onAssetLoad = () => {
    setAssetLoading(false);
    setAssetError(false);
  };

  const onAssetError = () => {
    setAssetLoading(false);
    setAssetError(true);
  };

  return {
    isRemoteAsset,
    assetLoading,
    assetError,
    onAssetLoad,
    onAssetError,
  };
}
