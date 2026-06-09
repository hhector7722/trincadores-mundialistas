import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileAvatarButton } from "@/components/profile/ProfileAvatarButton";
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

  const [{ data: profile }, admin] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user!.id)
      .single(),
    isPoolAdmin(ctx.activePoolId, user!.id),
  ]);

  const label = profile?.display_name ?? profile?.username ?? "Jugador";

  return (
    <div className="space-y-4 p-4 pb-4">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <ProfileAvatarButton
          avatarUrl={profile?.avatar_url ?? null}
          label={label}
          variant="profile"
        />
        <p className="text-lg font-medium text-[var(--tm-fg)]">{label}</p>
      </div>
      {admin && (
        <Card>
          <Link href="/admin" className="text-sm font-medium text-[var(--tm-primary)]">
            Administrar resultados (admin)
          </Link>
        </Card>
      )}
      <form action={signOut}>
        <Button type="submit" variant="outline" className="w-full">
          Cerrar sesion
        </Button>
      </form>
    </div>
  );
}
