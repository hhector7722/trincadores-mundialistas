"use client";

import { createPortal } from "react-dom";
import { BottomChrome } from "@/components/layout/BottomChrome";

/** Portal a body — TabBar fija al borde inferior (marbella-app). */
export function TabBarWrapper() {
  if (typeof document === "undefined") return null;

  return createPortal(<BottomChrome />, document.body);
}
