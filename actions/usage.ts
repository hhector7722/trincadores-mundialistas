"use server";

import { canAccessUsageAnalytics } from "@/lib/usage/access";
import {
  getUsageRecentEventsPage,
  parseUsageDashboardFilters,
  type UsageRecentEvent,
} from "@/lib/usage/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export type UsageRecentEventsActionResult =
  | { ok: true; events: UsageRecentEvent[]; hasMore: boolean }
  | { ok: false; error: string };

export async function fetchMoreUsageActivityAction(input: {
  poolId: string;
  offset: number;
  dia?: string;
  usuarios?: string;
}): Promise<UsageRecentEventsActionResult> {
  const ctx = await requireActivePoolContext();
  if (ctx.activePoolId !== input.poolId) {
    return { ok: false, error: "Pool no valido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessUsageAnalytics(profile?.username)) {
    return { ok: false, error: "Sin permiso." };
  }

  const filters = parseUsageDashboardFilters({
    dia: input.dia,
    usuarios: input.usuarios,
  });

  try {
    const page = await getUsageRecentEventsPage(ctx.activePoolId, filters, {
      offset: input.offset,
    });
    return { ok: true, events: page.events, hasMore: page.hasMore };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar actividad.";
    return { ok: false, error: message };
  }
}
