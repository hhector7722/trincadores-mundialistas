"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { generateSticker } from "./generate";

export async function ensurePlayerSticker(playerId: string, team: string, squadNumber: number) {
  if (!playerId || !team || squadNumber === undefined || squadNumber === null) {
    throw new Error("Missing required arguments for player sticker");
  }

  const supabase = createAdminClient();
  const hash = crypto.createHash("sha256").update(`${team}-${squadNumber}`).digest("hex");

  // Check if player already has this hash
  const { data: player, error: fetchError } = await supabase
    .from("team_squad_players")
    .select("sticker_hash, sticker_url")
    .eq("id", playerId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch player: ${fetchError.message}`);
  }

  if (player && player.sticker_hash === hash && player.sticker_url) {
    return player.sticker_url;
  }

  // Generate sticker buffer
  const buffer = await generateSticker(team, squadNumber);
  const path = `${team}/${squadNumber}.png`;

  // Upload to Supabase Storage using service role
  const { error: uploadError } = await supabase.storage
    .from("stickers")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload sticker to storage: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("stickers")
    .getPublicUrl(path);

  // Update team_squad_players record
  const { error: updateError } = await supabase
    .from("team_squad_players")
    .update({
      sticker_url: publicUrl,
      sticker_hash: hash,
    })
    .eq("id", playerId);

  if (updateError) {
    throw new Error(`Failed to update player record: ${updateError.message}`);
  }

  return publicUrl;
}
