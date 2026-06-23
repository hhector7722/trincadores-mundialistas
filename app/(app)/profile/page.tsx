import Link from "next/link";
import { FlaskConical, Play } from "lucide-react";
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
  const isHector = profile?.username?.toLowerCase() === "hector";

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

      {isHector && (
        <div className="flex flex-col gap-2 w-full">
          <Link
            href="/quiz/play-hector-yesterday"
            className={cn(
              "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
              "border border-[var(--tm-primary)] bg-[var(--tm-primary)]/10",
              "font-display text-sm uppercase tracking-[0.12em] text-[var(--tm-primary)]",
              "transition-colors hover:bg-[var(--tm-primary)]/20"
            )}
          >
            <Play className="size-4 shrink-0" aria-hidden />
            Quiz ayer (21/06)
          </Link>
          <Link
            href="/hector/force-result"
            className={cn(
              "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
              "border border-red-500 bg-red-500/10",
              "font-display text-sm uppercase tracking-[0.12em] text-red-500",
              "transition-colors hover:bg-red-500/20"
            )}
          >
            <Play className="size-4 shrink-0" aria-hidden />
            Forzar Resultado (SuperAdmin)
          </Link>
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
