import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarPlayerConfigEditor } from "@/components/hector/StarPlayerConfigEditor";

export const dynamic = "force-dynamic";

export default async function HectorStarsConfigPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profile?.username?.toLowerCase() !== "hector") redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-[var(--tm-bg)] px-4 pb-2 pt-4 shadow-sm">
        <h1 className="font-display text-xl font-bold uppercase tracking-wide text-[var(--tm-fg)]">
          ⭐ Jugadores Estrella
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-fg-alt)]">
          Configura las probabilidades manuales para las estrellas del torneo.
          Estos valores se usan para calcular los porcentajes de Pichichi, MVP y Guante de Oro
          que ven todos los usuarios.
        </p>
      </div>

      <StarPlayerConfigEditor />
    </div>
  );
}
