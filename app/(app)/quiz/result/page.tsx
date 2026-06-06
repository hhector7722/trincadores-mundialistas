import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";
import { QuizResultSummary } from "@/components/quiz/QuizResultSummary";
import { getQuizResult } from "@/lib/quiz/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuizResultPageProps = {
  searchParams: Promise<{ attempt?: string }>;
};

export default async function QuizResultPage({ searchParams }: QuizResultPageProps) {
  await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const attemptId = params.attempt?.trim();
  if (!attemptId) {
    redirect("/quiz");
  }

  const result = await getQuizResult(attemptId, user!.id);
  if (!result) {
    notFound();
  }

  return (
    <QuizPageShell>
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          {result.kind === "bonus" ? "Resultado bonus" : "Resultado oficial"}
        </h1>
        <Link href="/quiz" className="mt-1 inline-block text-sm text-[var(--tm-muted)]">
          Quiz del dia
        </Link>
      </div>
      <QuizResultSummary result={result} />
    </QuizPageShell>
  );
}
