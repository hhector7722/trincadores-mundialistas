"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { revalidatePath } from "next/cache";

export type StarPlayerConfigRow = {
  id: string;
  player_name: string;
  team_name: string | null;
  top_scorer_prob: number | null;
  mvp_prob: number | null;
  golden_glove_prob: number | null;
  updated_at: string;
};

async function assertHector() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username?.toLowerCase() !== "hector") {
    throw new Error("No autorizado.");
  }
}

export async function getStarPlayerConfigsAction(): Promise<{
  ok: true;
  data: StarPlayerConfigRow[];
} | { ok: false; error: string }> {
  try {
    await assertHector();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("star_player_config")
      .select("*")
      .order("player_name", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [] };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function upsertStarPlayerConfigAction(
  playerName: string,
  teamName: string | null,
  topScorerProb: number | null,
  mvpProb: number | null,
  goldenGloveProb: number | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHector();
    const admin = createAdminClient();
    const { error } = await admin.from("star_player_config").upsert(
      {
        player_name: playerName,
        team_name: teamName,
        top_scorer_prob: topScorerProb,
        mvp_prob: mvpProb,
        golden_glove_prob: goldenGloveProb,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_name" }
    );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/hector/stars-config");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteStarPlayerConfigAction(
  playerName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertHector();
    const admin = createAdminClient();
    const { error } = await admin
      .from("star_player_config")
      .delete()
      .eq("player_name", playerName);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/hector/stars-config");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
