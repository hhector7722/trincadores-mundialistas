import { isProfileOnboardingComplete } from "@/lib/auth/onboarding-device";
import {
  buildDrillPicksFromSnapshot,
  composeDrillSessionPicks,
  type DrillHistoricalQuiz,
  type DrillQuestionPick,
} from "@/lib/quiz/compose-drill-session";
import { isQuizPublishHeld, isQuizWindowOpen, todayQuizDate } from "@/lib/quiz/date";
import { isPoolCompetitive } from "@/lib/quiz/mode";
import { computeQuizReliabilityPct } from "@/lib/quiz/reliability";
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
  counts_for_score?: boolean;
  drill_question_ids?: string[] | null;
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
    counts_for_score: row.counts_for_score ?? true,
    drill_question_ids: row.drill_question_ids ?? null,
  };
}

function pickOfficialSlotAttempt(
  quizId: string,
  attempts: QuizAttemptRow[]
): Pick<QuizDaySlot, "attempt" | "countingSubmittedAttemptId" | "drillAttempt"> {
  const forQuiz = attempts.filter((a) => a.quiz_id === quizId);
  const countingSubmitted = forQuiz.find(
    (a) => a.status === "submitted" && a.counts_for_score !== false
  );
  const competitiveInProgress = forQuiz.find(
    (a) =>
      a.status === "in_progress" &&
      a.counts_for_score !== false &&
      !a.drill_question_ids?.length
  );
  const drillInProgress = forQuiz.find(
    (a) => a.status === "in_progress" && Boolean(a.drill_question_ids?.length)
  );

  if (competitiveInProgress) {
    return {
      attempt: competitiveInProgress,
      countingSubmittedAttemptId: countingSubmitted?.id ?? null,
      drillAttempt: drillInProgress ?? null,
    };
  }

  if (countingSubmitted) {
    return {
      attempt: countingSubmitted,
      countingSubmittedAttemptId: countingSubmitted.id,
      drillAttempt: drillInProgress ?? null,
    };
  }

  if (drillInProgress) {
    return {
      attempt: drillInProgress,
      countingSubmittedAttemptId: null,
      drillAttempt: drillInProgress,
    };
  }

  const attempt =
    forQuiz.find((a) => a.status !== "expired") ?? forQuiz[0] ?? null;

  return { attempt, countingSubmittedAttemptId: null, drillAttempt: null };
}

function slotFrom(
  quiz: QuizRow | undefined,
  attempts: QuizAttemptRow[]
): QuizDaySlot | null {
  if (!quiz) return null;
  return { quiz, ...pickOfficialSlotAttempt(quiz.id, attempts) };
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
      "id, quiz_id, profile_id, status, score, started_at, submitted_at, expires_at, counts_for_score, drill_question_ids"
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
  const officialAttempt =
    officialQuiz &&
    (attempts.find(
      (a) =>
        a.quiz_id === officialQuiz.id &&
        (a.status === "submitted" || a.status === "in_progress")
    ) ??
      null);

  const windowPending =
    Boolean(officialQuiz) &&
    !isQuizWindowOpen(officialQuiz!) &&
    !officialAttempt;

  const publishHeld = isQuizPublishHeld(quizDate) || windowPending;
  const drillAvailable = officialQuiz
    ? await isDrillAvailable(poolId, quizDate)
    : false;

  return {
    quizDate,
    competitive,
    publishHeld,
    drillAvailable,
    official: publishHeld ? null : slotFrom(officialQuiz, attempts),
    bonus: null,
  };
}

async function isDrillAvailable(poolId: string, todayQuizDate: string): Promise<boolean> {
  try {
    const historical = await loadHistoricalQuizzesForDrill(poolId, todayQuizDate);
    composeDrillSessionPicks({
      todayQuizId: "",
      todayQuizDate,
      historicalQuizzes: historical,
      rng: () => 0,
    });
    return true;
  } catch {
    return false;
  }
}

export async function loadHistoricalQuizzesForDrill(
  poolId: string,
  beforeQuizDate: string
): Promise<DrillHistoricalQuiz[]> {
  const supabase = await createClient();
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id, quiz_date, settings_json")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .lt("quiz_date", beforeQuizDate);

  if (quizError) throw new Error(quizError.message);
  if (!quizzes?.length) return [];

  const quizIds = quizzes.map((q) => q.id as string);
  const { data: questions, error: questionError } = await supabase
    .from("quiz_questions_public")
    .select("id, quiz_id, sort_order")
    .in("quiz_id", quizIds);

  if (questionError) throw new Error(questionError.message);

  const questionsByQuiz = new Map<string, DrillHistoricalQuiz["questions"]>();
  for (const row of questions ?? []) {
    const quizId = row.quiz_id as string;
    const list = questionsByQuiz.get(quizId) ?? [];
    list.push({
      id: row.id as string,
      sort_order: row.sort_order as number,
    });
    questionsByQuiz.set(quizId, list);
  }

  return quizzes
    .map((quiz) => ({
      id: quiz.id as string,
      quizDate: (quiz.quiz_date as string).slice(0, 10),
      settingsJson: quiz.settings_json,
      questions: (questionsByQuiz.get(quiz.id as string) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    }))
    .filter((quiz) => quiz.questions.length > 0);
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

export async function startQuizSessionYesterday(quizId: string): Promise<QuizStartSession> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_quiz_attempt_yesterday", {
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

export async function startQuizDrillSession(
  quizId: string,
  todayQuizDate: string,
  poolId: string
): Promise<{ session: QuizStartSession; picks: DrillQuestionPick[] }> {
  const supabase = await createClient();

  const tryResume = await supabase.rpc("start_quiz_drill_attempt", {
    p_quiz_id: quizId,
    p_question_ids: null,
  });

  if (!tryResume.error) {
    const session = parseQuizStartSession(tryResume.data);
    if (!session) throw new Error("Respuesta de entrenamiento invalida.");

    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("drill_question_ids")
      .eq("id", session.attempt_id)
      .maybeSingle();

    if (attemptError) throw new Error(attemptError.message);
    const questionIds = (attempt?.drill_question_ids as string[] | null) ?? [];
    const picks = await loadDrillPicksForQuestionIds(questionIds);
    return { session, picks };
  }

  const resumeMsg = tryResume.error.message.toLowerCase();
  if (resumeMsg.includes("drill not allowed")) {
    throw new Error(tryResume.error.message);
  }
  if (!resumeMsg.includes("drill invalid questions")) {
    throw new Error(tryResume.error.message);
  }

  const historical = await loadHistoricalQuizzesForDrill(poolId, todayQuizDate);
  const picks = composeDrillSessionPicks({
    todayQuizId: quizId,
    todayQuizDate,
    historicalQuizzes: historical,
  });

  const { data, error } = await supabase.rpc("start_quiz_drill_attempt", {
    p_quiz_id: quizId,
    p_question_ids: picks.map((pick) => pick.questionId),
  });

  if (error) throw new Error(error.message);

  const session = parseQuizStartSession(data);
  if (!session) throw new Error("Respuesta de entrenamiento invalida.");

  return { session, picks };
}

async function loadDrillPicksForQuestionIds(questionIds: string[]) {
  if (questionIds.length !== 3) {
    throw new Error("Sesion de entrenamiento invalida.");
  }

  const supabase = await createClient();
  const { data: questions, error: questionError } = await supabase
    .from("quiz_questions_public")
    .select("id, quiz_id, sort_order")
    .in("id", questionIds);

  if (questionError) throw new Error(questionError.message);

  const quizIds = [...new Set((questions ?? []).map((q) => q.quiz_id as string))];
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id, quiz_date, settings_json")
    .in("id", quizIds);

  if (quizError) throw new Error(quizError.message);

  return buildDrillPicksFromSnapshot({
    questionIds,
    questions: (questions ?? []).map((q) => ({
      id: q.id as string,
      quiz_id: q.quiz_id as string,
      sort_order: q.sort_order as number,
    })),
    quizzes: (quizzes ?? []).map((q) => ({
      id: q.id as string,
      quiz_date: q.quiz_date as string | null,
      settings_json: q.settings_json,
    })),
  });
}

export async function getQuizResult(
  attemptId: string,
  profileId: string
): Promise<QuizResultResponse | null> {
  const supabase = await createClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, profile_id, status, score, counts_for_score")
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
    .select(
      "question_id, selected_option_id, selected_option_label, question_prompt, is_correct, points_awarded"
    )
    .eq("attempt_id", attemptId);

  if (responsesError) throw new Error(responsesError.message);

  const countsForScore = (attempt.counts_for_score as boolean | null) ?? true;

  const questionIds = (responses ?? []).map((r) => r.question_id);
  if (!questionIds.length) {
    return {
      attemptId,
      score: attempt.score ?? 0,
      maxPoints: quiz.max_points,
      scoringMode: quiz.scoring_mode,
      kind: quiz.kind,
      countsForScore,
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
        prompt: (r.question_prompt as string | null) ?? question.prompt,
        selectedOptionId: r.selected_option_id as string,
        selectedOptionLabel: (r.selected_option_label as string | null) ?? undefined,
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
    countsForScore,
    responses: mappedResponses,
  };
}

type QuizMemberRow = {
  profileId: string;
  label: string;
  avatarUrl: string | null;
};

async function loadQuizPoolMembers(poolId: string): Promise<QuizMemberRow[]> {
  const supabase = await createClient();
  const { data: memberships, error: memberError } = await supabase
    .from("pool_members")
    .select("profile_id")
    .eq("pool_id", poolId);

  if (memberError) throw new Error(memberError.message);
  if (!memberships?.length) return [];

  const profileIds = memberships.map((m) => m.profile_id as string);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, onboarding_completed_at")
    .in("id", profileIds);

  if (profileError) throw new Error(profileError.message);

  const profileMap = new Map(
    (profiles ?? [])
      .filter((p) => isProfileOnboardingComplete(p))
      .map((p) => [
        p.id as string,
        {
          label: (p.display_name as string | null)?.trim() || (p.username as string),
          avatarUrl: (p.avatar_url as string | null) ?? null,
        },
      ])
  );

  return memberships
    .map((m) => {
      const profile = profileMap.get(m.profile_id as string);
      if (!profile) return null;
      return {
        profileId: m.profile_id as string,
        label: profile.label,
        avatarUrl: profile.avatarUrl,
      };
    })
    .filter((row): row is QuizMemberRow => row !== null);
}

export async function getQuizLeaderboard(poolId: string): Promise<QuizLeaderboardRow[]> {
  const supabase = await createClient();
  const members = await loadQuizPoolMembers(poolId);
  if (!members.length) return [];

  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id, max_points")
    .eq("pool_id", poolId)
    .eq("kind", "official")
    .eq("scoring_mode", "competitive");

  if (quizError) throw new Error(quizError.message);

  const quizIds = (quizzes ?? []).map((q) => q.id as string);
  const maxPointsByQuiz = new Map(
    (quizzes ?? []).map((q) => [q.id as string, (q.max_points as number) ?? 0])
  );

  const totals = new Map<string, { totalScore: number; totalMaxPoints: number; totalTimeMs: number }>();

  if (quizIds.length) {
    const { data: scores, error: scoreError } = await supabase
      .from("quiz_leaderboard")
      .select("quiz_id, profile_id, best_score, best_time_ms")
      .in("quiz_id", quizIds);

    if (scoreError) throw new Error(scoreError.message);

    for (const row of scores ?? []) {
      const profileId = row.profile_id as string;
      const current = totals.get(profileId) ?? { totalScore: 0, totalMaxPoints: 0, totalTimeMs: 0 };
      current.totalScore += (row.best_score as number) ?? 0;
      current.totalMaxPoints += maxPointsByQuiz.get(row.quiz_id as string) ?? 0;
      current.totalTimeMs += (row.best_time_ms as number) ?? 0;
      totals.set(profileId, current);
    }
  }

  const merged = members.map((member) => {
    const stats = totals.get(member.profileId);
    const totalScore = stats?.totalScore ?? 0;
    const totalMaxPoints = stats?.totalMaxPoints ?? 0;
    const totalTimeMs = stats?.totalTimeMs ?? 0;
    const hasParticipated = totalMaxPoints > 0;
    return {
      profileId: member.profileId,
      label: member.label,
      avatarUrl: member.avatarUrl,
      totalScore,
      totalTimeMs,
      reliabilityPct: computeQuizReliabilityPct(totalScore, totalMaxPoints),
      hasParticipated,
    };
  });

  merged.sort(
    (a, b) =>
      b.totalScore - a.totalScore ||
      a.totalTimeMs - b.totalTimeMs ||
      a.label.localeCompare(b.label, "es", { sensitivity: "base" })
  );

  return merged.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}

export { getLatestSubmittedAttemptId } from "@/lib/quiz/slot-status";

export function isQuizPlayable(slot: QuizDaySlot | null): boolean {
  if (!slot) return false;
  if (!isQuizWindowOpen(slot.quiz)) return false;
  if (!slot.attempt) return true;
  if (slot.attempt.status === "submitted") {
    return slot.quiz.scoring_mode === "training";
  }
  if (slot.attempt.status === "in_progress") {
    if (!slot.attempt.expires_at) return true;
    return Date.now() < new Date(slot.attempt.expires_at).getTime();
  }
  return true;
}
