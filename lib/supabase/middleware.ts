import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PWA_ONBOARDING_COOKIE } from "@/lib/pwa/onboarding-cookie";

const AUTH_PATHS = ["/login"];
const ONBOARDING_PATHS = ["/bienvenida"];

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

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}?`) || pathname.startsWith(`${p}/`),
  );
}

function hasPwaOnboardingCookie(request: NextRequest): boolean {
  return request.cookies.get(PWA_ONBOARDING_COOKIE)?.value === "1";
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

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (user && (isAuthPath(pathname) || isOnboardingPath(pathname))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isAuthPath(pathname) && !hasPwaOnboardingCookie(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/bienvenida";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isAuthPath(pathname) && !isOnboardingPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    if (!hasPwaOnboardingCookie(request)) {
      redirectUrl.pathname = "/bienvenida";
    } else {
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
