import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ProfileAvatarButton } from "@/components/profile/ProfileAvatarButton";
import { UsageAnalyticsButton } from "@/components/profile/UsageAnalyticsButton";
import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import { canAccessUsageAnalytics } from "@/lib/usage/access";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user!.id)
    .single();

  const label = profile?.display_name ?? profile?.username ?? "Jugador";
  const showLab = canAccessQuizLab(profile?.username);
  const showUsage = canAccessUsageAnalytics(profile?.username);
  const showActions = showUsage || showLab;

  return (
    <div className="space-y-3 p-4 pb-4">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <ProfileAvatarButton
          avatarUrl={profile?.avatar_url ?? null}
          label={label}
          variant="profile"
        />
        <p className="text-lg font-medium text-[var(--tm-fg)]">{label}</p>
      </div>

      {showActions && (
        <div className="flex gap-2">
          {showUsage && <UsageAnalyticsButton />}
          {showLab && (
            <Link
              href="/laboratorio"
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl",
                "border border-[var(--tm-border)] bg-[var(--tm-surface)]/60",
                "font-display text-sm uppercase tracking-[0.12em] text-[var(--tm-fg)]",
                "transition-colors hover:border-[var(--tm-primary)]/50 hover:text-[var(--tm-primary)]"
              )}
            >
              <FlaskConical className="size-4 shrink-0" aria-hidden />
              Laboratorio
            </Link>
          )}
        </div>
      )}

      <form action={signOut}>
        <Button type="submit" variant="outline" className="min-h-11 w-full">
          Cerrar sesion
        </Button>
      </form>
    </div>
  );
}
