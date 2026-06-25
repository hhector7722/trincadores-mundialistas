"use server";

import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { createClient } from "@/lib/supabase/server";
import { syncDynamicProbabilities } from "@/lib/predictions/probabilities/sync";
import { revalidatePath } from "next/cache";

type DynProb = {
  category: string;
  selection_key: string;
  probability: number;
};

export async function syncProbabilitiesAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "No autenticado." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profile?.username?.toLowerCase() !== "hector") {
      return { ok: false, error: "No autorizado." };
    }

    const admin = createAdminClient();
    await syncDynamicProbabilities(admin);
    revalidatePath("/hector/stars-config");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getDynamicProbabilitiesAction(): Promise<
  { ok: true; data: DynProb[] } | { ok: false; error: string }
> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dynamic_probabilities")
      .select("category, selection_key, probability");

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
