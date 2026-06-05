import Link from "next/link";
import { Card } from "@/components/ui/card";
import { isPoolAdmin } from "@/lib/pool/admin";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, created_at")
    .eq("id", user!.id)
    .single();

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role, joined_at")
    .eq("profile_id", user!.id)
    .eq("pool_id", ctx.activePoolId)
    .single();

  const admin = await isPoolAdmin(ctx.activePoolId, user!.id);
  const label = profile?.display_name ?? profile?.username ?? " ";

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="text-lg font-semibold text-[var(--tm-fg)]">Perfil</h1>
      </div>
      <Card className="space-y-4">
        <div>
          <p className="text-xs text-[var(--tm-muted)]">Nombre</p>
          <p className="text-base font-medium text-[var(--tm-fg)]">{label}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--tm-muted)]">Usuario</p>
          <p className="text-sm text-[var(--tm-fg)]">@{profile?.username}</p>
        </div>
        {membership && (
          <div>
            <p className="text-xs text-[var(--tm-muted)]">Rol en la porra</p>
            <p className="text-sm text-[var(--tm-fg)]">{membership.role}</p>
          </div>
        )}
      </Card>
      {admin && (
        <Card>
          <Link href="/admin" className="text-sm font-medium text-[var(--tm-primary)]">
            Administrar resultados (admin)
          </Link>
        </Card>
      )}
      <Card>
        <p className="text-sm text-[var(--tm-muted)]">
          Perfil publico y logros: fase 1d.
        </p>
      </Card>
    </div>
  );
}