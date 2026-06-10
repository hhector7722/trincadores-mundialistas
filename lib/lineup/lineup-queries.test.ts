import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isBetterLineupSource, loadLastKnownFormation } from "./lineup-queries";

test("isBetterLineupSource respeta prioridad confirmed > predicted > fallback", () => {
  assert.equal(isBetterLineupSource("confirmed", "predicted"), true);
  assert.equal(isBetterLineupSource("predicted", "fallback"), true);
  assert.equal(isBetterLineupSource("fallback", "confirmed"), false);
  assert.equal(isBetterLineupSource("confirmed", null), true);
});

function mockSupabaseForLastFormation(
  response: { data: { formation: string } | null; error: { message: string } | null }
): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => response,
              }),
            }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

test("loadLastKnownFormation devuelve null sin historial", async () => {
  const supabase = mockSupabaseForLastFormation({ data: null, error: null });
  const result = await loadLastKnownFormation(supabase, "Unknown Team");
  assert.equal(result, null);
});

test("loadLastKnownFormation devuelve null si la formación no es reconocida", async () => {
  const supabase = mockSupabaseForLastFormation({
    data: { formation: "3-4-3" },
    error: null,
  });
  const result = await loadLastKnownFormation(supabase, "Spain");
  assert.equal(result, null);
});

test("loadLastKnownFormation devuelve FormationId válida", async () => {
  const supabase = mockSupabaseForLastFormation({
    data: { formation: "4-2-3-1" },
    error: null,
  });
  const result = await loadLastKnownFormation(supabase, "Spain");
  assert.equal(result, "4-2-3-1");
});

test("loadLastKnownFormation devuelve null ante error de BD sin lanzar", async () => {
  const supabase = mockSupabaseForLastFormation({
    data: null,
    error: { message: "connection failed" },
  });
  const result = await loadLastKnownFormation(supabase, "Spain");
  assert.equal(result, null);
});

test("loadLastKnownFormation devuelve null si el cliente lanza", async () => {
  const supabase = {
    from: () => {
      throw new Error("boom");
    },
  } as unknown as SupabaseClient;
  const result = await loadLastKnownFormation(supabase, "Spain");
  assert.equal(result, null);
});
