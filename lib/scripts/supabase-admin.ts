import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServiceEnv } from "@/lib/scripts/env-guard";

export type AdminClient = SupabaseClient;

export function createAdminClient(): AdminClient {
  assertServiceEnv();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function upsertChunks<T extends Record<string, unknown>>(
  admin: AdminClient,
  table: string,
  rows: T[],
  onConflict: string,
  chunkSize = 100
): Promise<number> {
  if (!rows.length) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await admin
      .from(table)
      .upsert(chunk as unknown as Record<string, unknown>[], { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
    written += chunk.length;
  }
  return written;
}
