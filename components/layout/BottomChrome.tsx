"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";
import { isQuizLabPath } from "@/lib/quiz/lab-access";

export function BottomChrome() {
  const pathname = usePathname();
  if (isQuizLabPath(pathname)) {
    return null;
  }
  return <TabBar />;
}
