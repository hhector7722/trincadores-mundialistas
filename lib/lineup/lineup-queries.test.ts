import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadOfficialSquadFromClient } from "./lineup-queries";

function emptySupabaseMock(): SupabaseClient {
  const emptyResult = Promise.resolve({ data: [], error: null });
  const chain = {
    select: () => chain,
    in: () => chain,
    neq: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => emptyResult,
    maybeSingle: () => emptyResult,
  };
  return {
    from: () => chain,
  } as unknown as SupabaseClient;
}

test("loadOfficialSquadFromClient devuelve [] sin filas en BD", async () => {
  const result = await loadOfficialSquadFromClient(emptySupabaseMock(), "Atlantis FC");
  assert.deepEqual(result, []);
});
