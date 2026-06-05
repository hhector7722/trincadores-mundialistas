import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminResultForm } from "@/components/admin/AdminResultForm";
import { getAdminOpenMatches } from "@/lib/predictions/queries";
import { isPoolAdmin } from "@/lib/pool/admin";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = await isPoolAdmin(ctx.activePoolId, user!.id);
  if (!admin) {
    redirect("/profile");
  }

  const matches = await getAdminOpenMatches(ctx.activePoolId);

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Admin
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Minimo operativo: resultado oficial, finished y recalculo RPC.
        </p>
        <Link href="/profile" className="mt-2 inline-block text-sm text-[var(--tm-primary)]">
          Volver al perfil
        </Link>
      </div>
      <div className="rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] px-4">
        {matches.length === 0 ? (
          <p className="py-6 text-sm text-[var(--tm-muted)]">No hay partidos abiertos.</p>
        ) : (
          matches.map((m) => (
            <AdminResultForm
              key={m.id}
              poolId={ctx.activePoolId}
              matchId={m.id}
              label={`${m.home_team} - ${m.away_team}${m.hasResult ? " (ya tiene resultado)" : ""}`}
            />
          ))
        )}
      </div>
    </div>
  );
}