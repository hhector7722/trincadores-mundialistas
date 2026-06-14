import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import {
  getDerivedLabAssetBuffer,
  momentSourceAbsolutePath,
  persistDerivedAssetToDisk,
  tryReadPersistedDerivedAsset,
  type LabDeriveVariant,
} from "@/lib/quiz/lab/derive-images.server";
import { pickMomentById } from "@/lib/quiz/world-cup-moments";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import { resolveMomentImageUrl } from "@/lib/quiz/world-cup-moments";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VARIANTS = new Set<LabDeriveVariant>(["hair", "eyes", "silhouette"]);

async function assertLabAccess(): Promise<Response | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado.", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessQuizLab(profile?.username)) {
    return new Response("Acceso denegado.", { status: 403 });
  }

  return null;
}

export async function GET(request: Request) {
  const denied = await assertLabAccess();
  if (denied) return denied;

  const url = new URL(request.url);
  const momentId = url.searchParams.get("momentId")?.trim();
  const variant = url.searchParams.get("variant")?.trim();
  const force = url.searchParams.get("force") === "1";

  if (!momentId || !variant || !VARIANTS.has(variant as LabDeriveVariant)) {
    return new Response("Parametros invalidos.", { status: 400 });
  }

  const catalog = getWorldCupMomentsCatalog();
  const moment = pickMomentById(catalog, momentId, { readyOnly: true });
  const sourcePath = moment ? resolveMomentImageUrl(moment) : null;

  if (!moment || !sourcePath) {
    return new Response("Momento no encontrado.", { status: 404 });
  }

  try {
    const persisted = force
      ? null
      : await tryReadPersistedDerivedAsset(momentId, variant as LabDeriveVariant);
    const buffer =
      persisted ??
      (await getDerivedLabAssetBuffer(
        momentSourceAbsolutePath(sourcePath),
        momentId,
        variant as LabDeriveVariant,
        {
          moment,
          force,
        }
      ));

    if (!persisted) {
      try {
        await persistDerivedAssetToDisk(momentId, variant as LabDeriveVariant, buffer);
      } catch (persistError) {
        console.warn("[laboratorio/asset] Persistencia en disco omitida.", persistError);
      }
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[laboratorio/asset]", error);
    const detail =
      error instanceof Error ? error.message : "No se pudo generar la imagen.";
    return new Response(detail, { status: 500 });
  }
}
