import { redirect } from "next/navigation";
import { LabWorkspace } from "@/components/quiz/lab/LabWorkspace";
import { canAccessQuizLab } from "@/lib/quiz/lab-access";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";

export const dynamic = "force-dynamic";

export default async function LaboratorioPage() {
  await requireActivePoolContext();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/api/auth/restore");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessQuizLab(profile?.username)) {
    redirect("/profile");
  }

  return <LabWorkspace />;
}
