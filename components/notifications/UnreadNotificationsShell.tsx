"use client";

import type { ReactNode } from "react";
import { UnreadNotificationsProvider } from "@/components/notifications/UnreadNotificationsContext";

export function UnreadNotificationsShell({ children }: { children: ReactNode }) {
  return <UnreadNotificationsProvider>{children}</UnreadNotificationsProvider>;
}
