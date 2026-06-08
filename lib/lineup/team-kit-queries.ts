import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadTeamKitHexBySlug(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("teams")
    .select("external_key, primary_kit_hex")
    .not("primary_kit_hex", "is", null);

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.primary_kit_hex) {
      map[row.external_key] = row.primary_kit_hex;
    }
  }
  return map;
}
