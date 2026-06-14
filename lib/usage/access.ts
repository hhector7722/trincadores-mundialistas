import { normalizeAlias } from "@/lib/text/normalize-alias";

export function canAccessUsageAnalytics(username: string | null | undefined): boolean {
  return normalizeAlias(username ?? "") === "hector";
}

export function isUsageAnalyticsPath(pathname: string): boolean {
  return pathname === "/uso" || pathname.startsWith("/uso/");
}
