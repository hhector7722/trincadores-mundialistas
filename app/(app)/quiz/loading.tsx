import { TabScrollLoading } from "@/components/layout/TabScrollLoading";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";

export default function QuizLoading() {
  return (
    <TabScrollLoading label="Cargando quiz">
      <QuizPageShell variant="hub">
        <div className="tm-quiz-hub flex min-h-0 flex-1 flex-col gap-4 opacity-40">
          <div className="h-28 rounded-2xl border border-[var(--tm-border)]/40" />
          <div className="min-h-0 flex-1 rounded-2xl border border-[var(--tm-border)]/40" />
        </div>
      </QuizPageShell>
    </TabScrollLoading>
  );
}
