"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TabBar } from "@/components/layout/TabBar";

/**
 * Portal a document.body: el fixed no hereda containing blocks del shell
 * (overflow, transform, filter). Mismo patrón que marbella-app/BottomNavWrapper.
 */
export function TabBarWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(<TabBar />, document.body);
}
