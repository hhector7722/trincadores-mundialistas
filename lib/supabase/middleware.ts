import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ONBOARDED_USER_COOKIE,
  readOnboardedUsernameFromCookieValue,
} from "@/lib/auth/onboarding-device";
import { PWA_ONBOARDING_COOKIE } from "@/lib/pwa/onboarding-cookie";

const AUTH_PATHS = ["/login"];
const ONBOARDING_PATHS = ["/bienvenida"];
const RESTORE_PATH = "/api/auth/restore";

const PUBLIC_PATHS = [
  "/manifest.webmanifest",
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

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}?`) || pathname.startsWith(`${p}/`),
  );
}

function hasLegacyPwaOnboardingCookie(request: NextRequest): boolean {
  return request.cookies.get(PWA_ONBOARDING_COOKIE)?.value === "1";
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

  if (isPublicPath(pathname) || isRestorePath(pathname)) {
    return supabaseResponse;
  }

  const onboardedUsername = getOnboardedUsername(request);

  if (user && (isAuthPath(pathname) || isOnboardingPath(pathname))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && onboardedUsername) {
    return redirectToRestore(request);
  }

  if (!user && isAuthPath(pathname) && !hasLegacyPwaOnboardingCookie(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/bienvenida";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isAuthPath(pathname) && !isOnboardingPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    if (!hasLegacyPwaOnboardingCookie(request)) {
      redirectUrl.pathname = "/bienvenida";
      redirectUrl.search = "";
    } else {
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
