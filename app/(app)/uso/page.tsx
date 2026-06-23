import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { UsageDashboard } from "@/components/usage/UsageDashboard";
import { canAccessUsageAnalytics } from "@/lib/usage/access";
import { getUsageDashboardData, parseUsageDashboardFilters } from "@/lib/usage/queries";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";

export const dynamic = "force-dynamic";

type UsoPageProps = {
  searchParams: Promise<{ dia?: string; usuario?: string; usuarios?: string }>;
};

export default async function UsoPage({ searchParams }: UsoPageProps) {
  const ctx = await requireActivePoolContext();
  const params = await searchParams;
  const filters = parseUsageDashboardFilters(params);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/api/auth/restore");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessUsageAnalytics(profile?.username)) {
    redirect("/profile");
  }

  const data = await getUsageDashboardData(ctx.activePoolId, filters);

  return (
    <div className="space-y-4 p-4 pb-4">
      <div className="sticky top-0 z-20 flex items-center gap-3 -mx-4 -mt-4 bg-[var(--tm-bg)] px-4 pb-2 pt-4 shadow-sm">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)]">
          <BarChart3 className="size-5 text-[var(--tm-primary)]" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
            Uso de la app
          </h1>
          <p className="text-sm text-[var(--tm-muted)]">
            Conexiones, sesiones y horarios de los participantes.
          </p>
        </div>
      </div>
      <UsageDashboard data={data} poolId={ctx.activePoolId} />
    </div>
  );
}
