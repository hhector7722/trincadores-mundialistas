import { NextResponse, type NextRequest } from "next/server";
import { signInUserByPhoneWithClient } from "@/lib/auth/phone-sign-in";
import { createClientFromRoute } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { phone?: string };
    const phone = String(body.phone ?? "").trim();
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Introduce tu numero de telefono." }, { status: 400 });
    }

    const cookieCarrier = NextResponse.json({ ok: true });
    const supabase = createClientFromRoute(request, cookieCarrier);
    const result = await signInUserByPhoneWithClient(phone, supabase);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json(
      { ok: true, username: result.username },
      { headers: cookieCarrier.headers }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al iniciar sesion.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
