import Link from "next/link";
import { FlaskConical, Play, Star } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ProfileAvatarButton } from "@/components/profile/ProfileAvatarButton";
import { UsageAnalyticsButton } from "@/components/profile/UsageAnalyticsButton";
import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import { canAccessUsageAnalytics } from "@/lib/usage/access";
import { addQuizDays, todayQuizDate } from "@/lib/quiz/date";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await requireActivePoolContext();
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

  let yesterdayQuizPlayed = false;
  let yesterdayQuizExists = false;
  let yesterdayDateStr = "";

  if (isHector) {
    yesterdayDateStr = addQuizDays(todayQuizDate(), -1);

    const { data: yesterdayQuiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("quiz_date", yesterdayDateStr)
      .eq("pool_id", ctx.activePoolId)
      .maybeSingle();

    yesterdayQuizExists = !!yesterdayQuiz;

    if (yesterdayQuiz) {
      const { data: attempt } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", yesterdayQuiz.id)
        .eq("profile_id", user!.id)
        .eq("status", "submitted")
        .eq("counts_for_score", true)
        .maybeSingle();

      yesterdayQuizPlayed = !!attempt;
    }
  }

  const yesterdayDisabled = !yesterdayQuizExists || yesterdayQuizPlayed;
  const yesterdayDayMonth = yesterdayDateStr.slice(5);

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
          {yesterdayDisabled ? (
            <span
              className={cn(
                "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
                "border border-[var(--tm-border)] bg-[var(--tm-surface)]/30",
                "font-display text-sm uppercase tracking-[0.12em] text-[var(--tm-muted)]",
                "cursor-not-allowed"
              )}
            >
              <Play className="size-4 shrink-0" aria-hidden />
              Quiz ayer ({yesterdayDayMonth})
            </span>
          ) : (
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
              Quiz ayer ({yesterdayDayMonth})
            </Link>
          )}
          <Link
            href="/hector/stars-config"
            className={cn(
              "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl",
              "border border-[#CCFF00]/30 bg-[#CCFF00]/5",
              "font-display text-sm uppercase tracking-[0.12em] text-[#CCFF00]",
              "transition-colors hover:bg-[#CCFF00]/10"
            )}
          >
            <Star className="size-4 shrink-0" aria-hidden />
            Top jugadores estrella
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
