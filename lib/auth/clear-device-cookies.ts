import { ONBOARDED_USER_COOKIE } from "@/lib/auth/onboarding-device";
import { PWA_ONBOARDING_COOKIE } from "@/lib/pwa/onboarding-cookie";
import type { NextResponse } from "next/server";

/** Borra cookies de dispositivo en una respuesta de ruta (p. ej. restore). */
export function clearDeviceCookiesOnResponse(response: NextResponse): void {
  const options = {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  response.cookies.set(ONBOARDED_USER_COOKIE, "", options);
  response.cookies.set(PWA_ONBOARDING_COOKIE, "", options);
}
