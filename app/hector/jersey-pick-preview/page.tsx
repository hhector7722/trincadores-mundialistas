import { checkIsHector } from "@/actions/admin";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { PreviewWrapper } from "./PreviewWrapper";
import { JerseyOption, LabQuestionJerseyPick } from "@/lib/quiz/lab/types";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function JerseyPickPreviewPage() {
  const isHector = await checkIsHector();
  if (!isHector) {
    redirect("/");
  }

  const supabase = createAdminClient();
  const { data: record, error } = await supabase
    .from("quiz_jersey_pick_bank")
    .select("*")
    .eq("target_date", "2099-01-01")
    .maybeSingle();

  async function deletePreview() {
    "use server";
    const isHector = await checkIsHector();
    if (!isHector) return;
    const sb = await createClient();
    await sb.from("quiz_jersey_pick_bank").delete().eq("target_date", "2099-01-01");
    revalidatePath("/hector/jersey-pick-preview");
  }

  let question: LabQuestionJerseyPick | null = null;
  
  if (record && record.status === "ready") {
    const correctOption = record.correct_option;
    const distractors = record.distractor_options;
    const jerseyOptions: JerseyOption[] = [
      { id: "a", ...correctOption, isCorrect: true },
      { id: "b", ...distractors[0] },
      { id: "c", ...distractors[1] },
      { id: "d", ...distractors[2] },
    ].sort(() => Math.random() - 0.5);

    const letters = ["a", "b", "c", "d"];
    const finalJerseyOptions = jerseyOptions.map((opt, i) => ({ ...opt, id: letters[i] }));
    const correctId = finalJerseyOptions.find(opt => opt.isCorrect)!.id;

    question = {
      id: record.id,
      format: "jersey_pick",
      prompt: record.prompt,
      options: finalJerseyOptions.map(opt => ({ id: opt.id, label: opt.team })),
      correctOptionId: correctId,
      timerSeconds: 15,
      jerseyOptions: finalJerseyOptions,
    };
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4 flex flex-col gap-8">
      <h1 className="text-3xl font-display font-bold">Jersey Pick Preview</h1>
      
      {!record ? (
        <p className="text-white/70">No hay ningún registro generado para 2099-01-01. Ejecuta el script primero.</p>
      ) : record.status !== "ready" ? (
        <div className="p-4 bg-red-500/20 text-red-200 rounded-xl">
          <p className="font-bold">El registro falló (status: {record.status})</p>
          <pre className="mt-2 text-xs opacity-70 whitespace-pre-wrap">{record.source_notes}</pre>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col flex-1 min-h-[600px]">
            <PreviewWrapper question={question} />
          </div>
          <div className="p-4 bg-white/5 rounded-xl text-sm space-y-2">
            <p><span className="text-white/50">Correct ID:</span> {question?.correctOptionId}</p>
            <p><span className="text-white/50">Fuentes:</span> {record.source_notes}</p>
          </div>
        </div>
      )}

      {record && (
        <form action={deletePreview}>
          <button type="submit" className="px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-bold transition-colors">
            Eliminar prueba
          </button>
        </form>
      )}
    </div>
  );
}
