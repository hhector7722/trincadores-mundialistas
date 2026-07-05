import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isProfileOnboardingComplete,
  ONBOARDED_USER_COOKIE,
  readOnboardedUsernameFromCookieValue,
  type OnboardingProfileRow,
} from "@/lib/auth/onboarding-device";
import { PWA_ONBOARDING_COOKIE } from "@/lib/pwa/onboarding-cookie";
import {
  applyUsageTrackingCookies,
  trackAppUsageInMiddleware,
} from "@/lib/usage/middleware-track";

const AUTH_PATHS = ["/login"];
const ONBOARDING_PATHS = ["/bienvenida"];
const RESTORE_PATH = "/api/auth/restore";
const PHONE_LOGIN_PATH = "/api/auth/phone-login";
const CRON_PATH = "/api/cron";

const PUBLIC_PATHS = [
  "/manifest.webmanifest",
  "/sw.js",
  "/icon",
  "/apple-icon",
  "/app-icon",
];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isOnboardingPath(pathname: string): boolean {
  return ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isRestorePath(pathname: string): boolean {
  return pathname === RESTORE_PATH || pathname.startsWith(`${RESTORE_PATH}/`);
}

function isPhoneLoginPath(pathname: string): boolean {
  return pathname === PHONE_LOGIN_PATH || pathname.startsWith(`${PHONE_LOGIN_PATH}/`);
}

function isCronPath(pathname: string): boolean {
  return pathname === CRON_PATH || pathname.startsWith(`${CRON_PATH}/`);
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}?`) || pathname.startsWith(`${p}/`),
  );
}

function getOnboardedUsername(request: NextRequest): string | null {
  return readOnboardedUsernameFromCookieValue(
    request.cookies.get(ONBOARDED_USER_COOKIE)?.value,
    request.cookies.get(PWA_ONBOARDING_COOKIE)?.value
  );
}

function redirectToRestore(request: NextRequest): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = RESTORE_PATH;
  const pathname = request.nextUrl.pathname;
  if (pathname && pathname !== "/" && !isAuthPath(pathname) && !isOnboardingPath(pathname)) {
    redirectUrl.searchParams.set("next", pathname);
  } else {
    redirectUrl.search = "";
  }
  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (
    isPublicPath(pathname) ||
    isRestorePath(pathname) ||
    isPhoneLoginPath(pathname) ||
    isCronPath(pathname)
  ) {
    return supabaseResponse;
  }

  const onboardedUsername = getOnboardedUsername(request);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, onboarding_completed_at, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const onboardingComplete =
      profile?.is_active && isProfileOnboardingComplete(profile as OnboardingProfileRow);

    if (!onboardingComplete) {
      if (!isOnboardingPath(pathname)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/bienvenida";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
      return supabaseResponse;
    }

    if (isAuthPath(pathname) || isOnboardingPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    try {
      const flags = await trackAppUsageInMiddleware(request, supabase, user.id, pathname);
      applyUsageTrackingCookies(supabaseResponse, pathname, request.nextUrl.search, flags);
    } catch {
      // No bloquear navegacion si falla el tracking.
    }
  }

  if (!user && onboardedUsername) {
    if (isOnboardingPath(pathname)) {
      return supabaseResponse;
    }
    return redirectToRestore(request);
  }

  if (!user && isAuthPath(pathname)) {
    return supabaseResponse;
  }

  if (!user && !isAuthPath(pathname) && !isOnboardingPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
