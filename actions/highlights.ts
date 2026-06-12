"use server";

import { revalidatePath } from "next/cache";
import {
  canControlHighlightScorelineVisibility,
  withHeroHighlightScorelineVisible,
} from "@/lib/highlights/hero-scoreline-visibility";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { createClient } from "@/lib/supabase/server";

export type HighlightActionResult = { ok: true } | { ok: false; error: string };

export async function setHeroHighlightScorelineVisible(
  poolId: string,
  visible: boolean,
): Promise<HighlightActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesión no válida." };
  }

  const member = await assertPoolMembership(user.id, poolId);
  if (!member) {
    return { ok: false, error: "No perteneces a esta porra." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !canControlHighlightScorelineVisibility(profile?.username)) {
    return { ok: false, error: "No tienes permiso para cambiar esta opción." };
  }

  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("settings_json")
    .eq("id", poolId)
    .maybeSingle();

  if (poolError || !pool) {
    return { ok: false, error: "No se pudo leer la configuración de la porra." };
  }

  const { error: updateError } = await supabase
    .from("pools")
    .update({
      settings_json: withHeroHighlightScorelineVisible(pool.settings_json, visible),
    })
    .eq("id", poolId);

  if (updateError) {
    return { ok: false, error: updateError.message || "No se pudo guardar la opción." };
  }

  revalidatePath("/");
  return { ok: true };
}
