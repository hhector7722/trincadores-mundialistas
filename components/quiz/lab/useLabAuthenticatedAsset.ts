"use client";

import { useEffect, useState } from "react";
import { isDerivedLabAssetUrl } from "@/lib/quiz/lab/generate-question.client";

export function useLabAuthenticatedAsset(assetUrl: string, enabled = true) {
  const needsFetch =
    enabled && Boolean(assetUrl?.trim()) && isDerivedLabAssetUrl(assetUrl);
  const [displayUrl, setDisplayUrl] = useState(() =>
    needsFetch ? "" : assetUrl
  );
  const [loading, setLoading] = useState(needsFetch);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!needsFetch) {
      setDisplayUrl(assetUrl);
      setLoading(false);
      setError(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    setLoading(true);
    setError(false);
    setDisplayUrl("");

    fetch(assetUrl, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`asset ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setDisplayUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [assetUrl, needsFetch]);

  return { displayUrl, loading, error, needsFetch };
}
