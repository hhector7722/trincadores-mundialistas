import type { LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type FetchGeneratedLabQuestionInput = {
  format: LabQuestionFormat;
  questionId?: string;
  excludeMomentId?: string | null;
  minDifficulty?: WorldCupMomentDifficulty;
  force?: boolean;
};

export async function fetchGeneratedLabQuestion(
  input: FetchGeneratedLabQuestionInput
): Promise<LabQuestion> {
  const response = await fetch("/api/laboratorio/generate-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | { question?: LabQuestion; error?: string }
    | null;

  if (!response.ok || !payload?.question) {
    const statusHint = response.ok ? "" : ` (${response.status})`;
    throw new Error(
      payload?.error ?? `No se pudo generar la pregunta${statusHint}.`
    );
  }

  return payload.question;
}

export function isDerivedLabAssetUrl(imageUrl: string): boolean {
  return (
    imageUrl.includes("/api/laboratorio/asset") ||
    imageUrl.includes("/images/quiz/lab/generated/")
  );
}

export function isStaticLabAssetUrl(imageUrl: string): boolean {
  return (
    isDerivedLabAssetUrl(imageUrl) ||
    imageUrl.startsWith("/images/quiz/historic/")
  );
}
