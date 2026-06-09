import { NextResponse, type NextRequest } from "next/server";
import { clearDeviceCookiesOnResponse } from "@/lib/auth/clear-device-cookies";
import {
  ONBOARDED_USER_COOKIE,
  readOnboardedUsernameFromCookieValue,
} from "@/lib/auth/onboarding-device";
import { restoreSessionForUsername } from "@/lib/auth/restore-session";
import { PWA_ONBOARDING_COOKIE } from "@/lib/pwa/onboarding-cookie";
import { createClientFromRoute } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  if (raw.startsWith("/api/auth/restore") || raw.startsWith("/bienvenida") || raw.startsWith("/login")) {
    return "/";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const username = readOnboardedUsernameFromCookieValue(
    request.cookies.get(ONBOARDED_USER_COOKIE)?.value,
    request.cookies.get(PWA_ONBOARDING_COOKIE)?.value
  );

  if (!username) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/bienvenida";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const successUrl = request.nextUrl.clone();
  successUrl.pathname = next;
  successUrl.search = "";

  const response = NextResponse.redirect(successUrl);
  const supabase = createClientFromRoute(request, response);
  const result = await restoreSessionForUsername(username, supabase);

  if (!result.ok) {
    if (result.code === "incomplete") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/bienvenida";
      redirectUrl.search = "";
      const failResponse = NextResponse.redirect(redirectUrl);
      clearDeviceCookiesOnResponse(failResponse);
      return failResponse;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "restore_failed");
    const failResponse = NextResponse.redirect(redirectUrl);
    clearDeviceCookiesOnResponse(failResponse);
    return failResponse;
  }

  return response;
}
