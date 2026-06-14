"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";
import { useTabPreviewMode } from "@/lib/layout/tab-preview";
import { isQuizLabPath } from "@/lib/quiz/lab-access";

export function BottomChrome() {
  const pathname = usePathname();
  const previewMode = useTabPreviewMode();

  if (previewMode || isQuizLabPath(pathname)) {
    return null;
  }
  return <TabBar />;
}
