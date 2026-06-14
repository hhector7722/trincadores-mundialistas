import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PredictorFab } from "@/components/laboratorio/PredictorFab";
import { Button } from "@/components/ui/button";
import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import { getQuizDayHub } from "@/lib/quiz/queries";
import { getCachedAppShellContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/api/auth/restore");
  }

  const ctx = await getCachedAppShellContext();
  const quizHub = ctx ? await getQuizDayHub(ctx.activePoolId, user.id) : null;

  if (!ctx || !quizHub) {
    return (
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center p-6">
        <p className="text-sm text-[var(--tm-fg)]">No perteneces a ninguna porra.</p>
        <form action={signOut} className="mt-4">
          <Button type="submit" variant="outline">
            Cerrar sesion
          </Button>
        </form>
      </main>
    );
  }

  const predictorEnabled = canAccessQuizLab(ctx.username);

  return (
    <>
      <AppShell ctx={ctx} quizHub={quizHub}>
        {children}
      </AppShell>
      {predictorEnabled ? <PredictorFab enabled={predictorEnabled} /> : null}
    </>
  );
}
