import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";

export const dynamic = "force-dynamic";

export default async function HectorYesterdayQuizPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile to check if it's hector
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .maybeSingle();

  // Only allow hector
  if (!profile || profile.username?.toLowerCase() !== "hector") {
    redirect("/quiz");
  }

  // Get the quiz for 2026-06-21
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("quiz_date", "2026-06-21")
    .eq("pool_id", ctx.activePoolId)
    .maybeSingle();

  if (!quiz) {
    redirect("/quiz");
  }

  // Redirect to the play page with the quiz ID
  redirect(`/quiz/play?quizId=${quiz.id}`);
}
