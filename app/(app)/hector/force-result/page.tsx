import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminMatchEditor } from "@/components/hector/SuperAdminMatchEditor";

export const dynamic = "force-dynamic";

export default async function HectorForceResultPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username?.toLowerCase() !== "hector") {
    redirect("/");
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, status")
    .in("status", ["scheduled", "live", "finished"])
    .order("kickoff_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-[var(--tm-bg)] px-4 pb-2 pt-4 shadow-sm">
        <h1 className="font-display text-2xl font-bold uppercase text-[var(--tm-fg)]">
          SuperAdmin: Forzar Resultado
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-fg-alt)]">
          Selecciona un partido para forzar su resultado oficial y MVP. Esto sobreescribirá
          los datos actuales y actualizará las puntuaciones de todas las porras.
        </p>
      </div>

      <SuperAdminMatchEditor matches={matches || []} />
    </div>
  );
}
