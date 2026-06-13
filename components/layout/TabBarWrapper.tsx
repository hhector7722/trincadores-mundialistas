"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";

/** Portal a body — patrón marbella-app/BottomNavWrapper.tsx */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<BottomChrome />, document.body);
}
