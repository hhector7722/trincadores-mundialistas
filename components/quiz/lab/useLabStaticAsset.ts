"use client";

import { useState } from "react";
import {
  isStaticLabGeneratedAssetUrl,
  labGeneratedAssetApiUrl,
  type LabAssetVariant,
} from "@/lib/quiz/lab/lab-asset-url";
import { useLabAuthenticatedAsset } from "@/components/quiz/lab/useLabAuthenticatedAsset";

type UseLabStaticAssetOptions = {
  momentId?: string | null;
  variant?: LabAssetVariant;
  enabled?: boolean;
};

export function useLabStaticAsset(imageUrl: string, opts?: UseLabStaticAssetOptions) {
  const enabled = opts?.enabled ?? true;
  const [staticFailed, setStaticFailed] = useState(false);
  const isStatic = isStaticLabGeneratedAssetUrl(imageUrl);
  const useDevApiFallback =
    process.env.NODE_ENV === "development" &&
    staticFailed &&
    Boolean(opts?.momentId && opts?.variant);

  const apiUrl =
    useDevApiFallback && opts?.momentId && opts?.variant
      ? labGeneratedAssetApiUrl(opts.momentId, opts.variant)
      : "";

  const {
    displayUrl: apiDisplayUrl,
    loading: apiLoading,
    error: apiError,
  } = useLabAuthenticatedAsset(apiUrl, enabled && useDevApiFallback);

  const displayUrl =
    useDevApiFallback && apiDisplayUrl ? apiDisplayUrl : imageUrl;

  const assetError =
    enabled &&
    isStatic &&
    staticFailed &&
    (!useDevApiFallback || apiError);

  const assetLoading = enabled && useDevApiFallback && apiLoading;

  const onImageError = () => {
    if (isStatic) {
      setStaticFailed(true);
    }
  };

  return {
    displayUrl,
    assetLoading,
    assetError,
    onImageError,
    isStatic,
  };
}
