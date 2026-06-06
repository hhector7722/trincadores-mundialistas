import { QuizHub } from "@/components/quiz/QuizHub";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";
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
    <QuizPageShell>
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Quiz del dia
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">
          Trivia rapida del Mundial. 10 segundos por pregunta.
        </p>
      </div>
      <QuizHub hub={hub} />
    </QuizPageShell>
  );
}
