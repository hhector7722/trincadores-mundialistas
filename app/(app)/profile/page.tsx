import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const admin = await isPoolAdmin(ctx.activePoolId, user!.id);

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Perfil
        </h1>
      </div>
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
      <form action={signOut}>
        <Button type="submit" variant="outline" className="w-full">
          Cerrar sesion
        </Button>
      </form>
    </div>
  );
}