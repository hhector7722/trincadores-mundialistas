import { todayQuizDate } from "@/lib/quiz/date";
import { isPoolCompetitive } from "@/lib/quiz/mode";
import { parseQuizOptions } from "@/lib/quiz/options";
import { parseQuizStartSession } from "@/lib/quiz/parse-session";
import type {
  QuizAttemptRow,
  QuizDayHub,
  QuizDaySlot,
  QuizLeaderboardRow,
  QuizQuestionPublic,
  QuizResultResponse,
  QuizRow,
  QuizStartSession,
} from "@/lib/quiz/types";
import { createClient } from "@/lib/supabase/server";

type QuizDbRow = {
  id: string;
  pool_id: string;
  title: string;
  quiz_date: string | null;
  kind: QuizRow["kind"];
  scoring_mode: QuizRow["scoring_mode"];
  max_points: number;
  settings_json: Record<string, unknown> | null;
  opens_at: string | null;
  closes_at: string | null;
};

type AttemptDbRow = {
  id: string;
  quiz_id: string;
  profile_id: string;
  status: QuizAttemptRow["status"];
  score: number | null;
  started_at: string;
  submitted_at: string | null;
  expires_at: string | null;
};

function mapQuizRow(row: QuizDbRow): QuizRow {
  return {
    id: row.id,
    pool_id: row.pool_id,
    title: row.title,
    quiz_date: row.quiz_date,
    kind: row.kind,
    scoring_mode: row.scoring_mode,
    max_points: row.max_points,
    settings_json: row.settings_json ?? {},
    opens_at: row.opens_at,
    closes_at: row.closes_at,
  };
}

function mapAttemptRow(row: AttemptDbRow): QuizAttemptRow {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    profile_id: row.profile_id,
    status: row.status,
    score: row.score,
    started_at: row.started_at,
    submitted_at: row.submitted_at,
    expires_at: row.expires_at,
  };
}

function slotFrom(
  quiz: QuizRow | undefined,
  attempts: QuizAttemptRow[]
): QuizDaySlot | null {
  if (!quiz) return null;
  const attempt =
    attempts.find((a) => a.quiz_id === quiz.id && a.status !== "expired") ??
    attempts.find((a) => a.quiz_id === quiz.id) ??
    null;
  return { quiz, attempt };
}

export async function getQuizzesForDate(
  poolId: string,
  quizDate: string
): Promise<QuizRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      "id, pool_id, title, quiz_date, kind, scoring_mode, max_points, settings_json, opens_at, closes_at"
    )
    .eq("pool_id", poolId)
    .eq("quiz_date", quizDate);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapQuizRow(row as QuizDbRow));
}

export async function getQuizAttemptsForProfile(
  quizIds: string[],
  profileId: string
): Promise<QuizAttemptRow[]> {
  if (!quizIds.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(
      "id, quiz_id, profile_id, status, score, started_at, submitted_at, expires_at"
    )
    .in("quiz_id", quizIds)
    .eq("profile_id", profileId)
    .order("started_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapAttemptRow(row as AttemptDbRow));
}

export async function getQuizDayHub(
  poolId: string,
  profileId: string,
  quizDate = todayQuizDate()
): Promise<QuizDayHub> {
  const [quizzes, competitive] = await Promise.all([
    getQuizzesForDate(poolId, quizDate),
    isPoolCompetitive(poolId),
  ]);

  const attempts = await getQuizAttemptsForProfile(
    quizzes.map((q) => q.id),
    profileId
  );

  const officialQuiz = quizzes.find((q) => q.kind === "official");
  const bonusQuiz = quizzes.find((q) => q.kind === "bonus");

  return {
    quizDate,
    competitive,
    official: slotFrom(officialQuiz, attempts),
    bonus: slotFrom(bonusQuiz, attempts),
  };
}

export async function startQuizSession(quizId: string): Promise<QuizStartSession> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_quiz_attempt", {
    p_quiz_id: quizId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const session = parseQuizStartSession(data);
  if (!session) {
    throw new Error("Respuesta de quiz invalida.");
  }

  return session;
}

export async function getQuizResult(
  attemptId: string,
  profileId: string
): Promise<QuizResultResponse | null> {
  const supabase = await createClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, profile_id, status, score")
    .eq("id", attemptId)
    .eq("profile_id", profileId)
    .eq("status", "submitted")
    .maybeSingle();

  if (attemptError) throw new Error(attemptError.message);
  if (!attempt) return null;

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("kind, scoring_mode, max_points")
    .eq("id", attempt.quiz_id)
    .maybeSingle();

  if (quizError) throw new Error(quizError.message);
  if (!quiz) return null;

  const { data: responses, error: responsesError } = await supabase
    .from("quiz_responses")
    .select("question_id, selected_option_id, is_correct, points_awarded")
    .eq("attempt_id", attemptId);

  if (responsesError) throw new Error(responsesError.message);

  const questionIds = (responses ?? []).map((r) => r.question_id);
  if (!questionIds.length) {
    return {
      attemptId,
      score: attempt.score ?? 0,
      maxPoints: quiz.max_points,
      scoringMode: quiz.scoring_mode,
      kind: quiz.kind,
      responses: [],
    };
  }

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions_public")
    .select("id, prompt, options, sort_order")
    .in("id", questionIds);

  if (questionsError) throw new Error(questionsError.message);

  const questionMap = new Map(
    (questions ?? []).map((q) => [
      q.id as string,
      {
        prompt: q.prompt as string,
        options: parseQuizOptions(q.options),
        sort_order: q.sort_order as number,
      },
    ])
  );

  const mappedResponses = (responses ?? [])
    .map((r) => {
      const question = questionMap.get(r.question_id);
      if (!question) return null;
      return {
        questionId: r.question_id as string,
        prompt: question.prompt,
        selectedOptionId: r.selected_option_id as string,
        correctOptionId: "",
        isCorrect: Boolean(r.is_correct),
        pointsAwarded: r.points_awarded as number,
        sortOrder: question.sort_order,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...row }) => row);

  return {
    attemptId,
    score: attempt.score ?? 0,
    maxPoints: quiz.max_points,
    scoringMode: quiz.scoring_mode,
    kind: quiz.kind,
    responses: mappedResponses,
  };
}

export async function getQuizLeaderboard(poolId: string): Promise<QuizLeaderboardRow[]> {
  const supabase = await createClient();

  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .eq("scoring_mode", "competitive");

  if (quizError) throw new Error(quizError.message);

  const quizIds = (quizzes ?? []).map((q) => q.id as string);
  if (!quizIds.length) return [];

  const { data: scores, error: scoreError } = await supabase
    .from("quiz_leaderboard")
    .select("quiz_id, profile_id, best_score")
    .in("quiz_id", quizIds);

  if (scoreError) throw new Error(scoreError.message);

  const { data: members, error: memberError } = await supabase
    .from("pool_members")
    .select("profile_id, profiles(display_name, username)")
    .eq("pool_id", poolId);

  if (memberError) throw new Error(memberError.message);

  const labelByProfile = new Map<string, string>();
  for (const member of members ?? []) {
    const profile = member.profiles as
      | { display_name: string | null; username: string }
      | null
      | undefined;
    if (!profile) continue;
    labelByProfile.set(
      member.profile_id as string,
      profile.display_name?.trim() || profile.username
    );
  }

  const totals = new Map<string, { totalScore: number; daysPlayed: number }>();
  for (const row of scores ?? []) {
    const profileId = row.profile_id as string;
    const current = totals.get(profileId) ?? { totalScore: 0, daysPlayed: 0 };
    current.totalScore += (row.best_score as number) ?? 0;
    current.daysPlayed += 1;
    totals.set(profileId, current);
  }

  return [...totals.entries()]
    .map(([profileId, stats]) => ({
      profileId,
      label: labelByProfile.get(profileId) ?? profileId.slice(0, 8),
      totalScore: stats.totalScore,
      daysPlayed: stats.daysPlayed,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || a.label.localeCompare(b.label, "es"));
}

export function getLatestSubmittedAttemptId(slot: QuizDaySlot | null): string | null {
  if (!slot?.attempt || slot.attempt.status !== "submitted") return null;
  return slot.attempt.id;
}

export function isQuizPlayable(slot: QuizDaySlot | null): boolean {
  if (!slot) return false;
  if (!slot.attempt) return true;
  if (slot.attempt.status === "submitted") return false;
  if (slot.attempt.status === "in_progress") {
    if (!slot.attempt.expires_at) return true;
    return Date.now() < new Date(slot.attempt.expires_at).getTime();
  }
  return true;
}
