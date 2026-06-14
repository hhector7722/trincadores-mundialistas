import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordAppUsageEventWithClient } from "@/lib/usage/record";

export const USAGE_SESSION_COOKIE = "tm_usage_session";
export const USAGE_PAGE_COOKIE = "tm_usage_page";

const SESSION_IDLE_MS = 30 * 60 * 1000;
const PAGE_VIEW_MIN_MS = 2 * 60 * 1000;

function shouldTrackPath(pathname: string): boolean {
  if (!pathname || pathname.startsWith("/api/") || pathname.startsWith("/_next")) {
    return false;
  }
  if (pathname.startsWith("/icon") || pathname.startsWith("/sw.js")) {
    return false;
  }
  return true;
}

export async function trackAppUsageInMiddleware(
  request: NextRequest,
  supabase: SupabaseClient,
  profileId: string,
  pathname: string
): Promise<{ session: boolean; pageView: boolean }> {
  if (!shouldTrackPath(pathname)) {
    return { session: false, pageView: false };
  }

  const now = Date.now();
  const lastSessionRaw = request.cookies.get(USAGE_SESSION_COOKIE)?.value;
  const lastSession = lastSessionRaw ? Number(lastSessionRaw) : 0;
  const isNewSession = !lastSession || now - lastSession >= SESSION_IDLE_MS;

  if (isNewSession) {
    await recordAppUsageEventWithClient(supabase, profileId, "session", pathname);
  }

  const pageCookieRaw = request.cookies.get(USAGE_PAGE_COOKIE)?.value;
  let pageView = false;

  if (pageCookieRaw) {
    const [lastPath, lastAtRaw] = pageCookieRaw.split("|");
    const lastAt = Number(lastAtRaw);
    const pathChanged = lastPath !== pathname;
    const cooledDown = !lastAt || now - lastAt >= PAGE_VIEW_MIN_MS;

    if (pathChanged || cooledDown) {
      await recordAppUsageEventWithClient(supabase, profileId, "page_view", pathname);
      pageView = true;
    }
  } else {
    await recordAppUsageEventWithClient(supabase, profileId, "page_view", pathname);
    pageView = true;
  }

  return { session: isNewSession, pageView };
}

export function applyUsageTrackingCookies(
  response: import("next/server").NextResponse,
  pathname: string,
  flags: { session: boolean; pageView: boolean }
): void {
  const now = Date.now();
  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  if (flags.session) {
    response.cookies.set(USAGE_SESSION_COOKIE, String(now), cookieBase);
  }

  if (flags.pageView) {
    response.cookies.set(USAGE_PAGE_COOKIE, `${pathname}|${now}`, cookieBase);
  }
}
