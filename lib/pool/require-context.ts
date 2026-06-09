import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadAppShellContext,
  type AppShellContext,
} from "@/lib/pool/active-pool";

/** Una resolucion por request (dedupe con layout + paginas). */
export const getCachedAppShellContext = cache(
  async (): Promise<AppShellContext | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return loadAppShellContext(user.id);
  }
);

/** Server-only: pool activo ya validado contra membresias. */
export async function requireActivePoolContext(): Promise<AppShellContext> {
  const ctx = await getCachedAppShellContext();
  if (!ctx) {
    redirect("/api/auth/restore");
  }
  return ctx;
}
