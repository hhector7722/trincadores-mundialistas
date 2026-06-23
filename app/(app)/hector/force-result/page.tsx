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
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-[var(--tm-fg)] uppercase">
        SuperAdmin: Forzar Resultado
      </h1>
      <p className="text-sm text-[var(--tm-fg-alt)]">
        Selecciona un partido para forzar su resultado oficial y MVP. Esto sobreescribirá
        los datos actuales y actualizará las puntuaciones de todas las porras.
      </p>

      <SuperAdminMatchEditor matches={matches || []} />
    </div>
  );
}
