import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
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
    redirect("/login");
  }

  const ctx = await getCachedAppShellContext();

  if (!ctx) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--tm-bg)] p-6">
        <p className="text-sm text-[var(--tm-fg)]">No perteneces a ninguna porra.</p>
        <form action={signOut} className="mt-4">
          <Button type="submit" variant="outline">
            Cerrar sesion
          </Button>
        </form>
      </main>
    );
  }

  return <AppShell ctx={ctx}>{children}</AppShell>;
}
