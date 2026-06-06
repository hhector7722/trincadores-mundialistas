import { QuizHub } from "@/components/quiz/QuizHub";
import { getQuizDayHub } from "@/lib/quiz/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hub = await getQuizDayHub(ctx.activePoolId, user!.id);

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Quiz del dia
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Trivia diaria del Mundial. Las respuestas se revelan al final.
        </p>
      </div>
      <QuizHub hub={hub} />
    </div>
  );
}
