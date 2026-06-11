export type QuizKind = "official" | "bonus";
export type QuizScoringMode = "training" | "competitive";
export type QuizAttemptStatus = "in_progress" | "submitted" | "expired";

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestionPublic = {
  id: string;
  sort_order: number;
  prompt: string;
  options: QuizOption[];
  points: number;
  image_url: string | null;
};

/** Pregunta en sesión de play: incluye clave correcta vía RPC start (solo intento activo). */
export type QuizQuestionPlay = QuizQuestionPublic & {
  correct_option_id: string;
};

export type QuizSummary = {
  id: string;
  title: string;
  quiz_date: string | null;
  kind: QuizKind;
  scoring_mode: QuizScoringMode;
  max_points: number;
};

export type QuizStartSession = {
  attempt_id: string;
  expires_at: string;
  resumed: boolean;
  quiz: QuizSummary;
  questions: QuizQuestionPlay[];
};

export type QuizRow = {
  id: string;
  pool_id: string;
  title: string;
  quiz_date: string | null;
  kind: QuizKind;
  scoring_mode: QuizScoringMode;
  max_points: number;
  settings_json: Record<string, unknown>;
  opens_at: string | null;
  closes_at: string | null;
};

export type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  profile_id: string;
  status: QuizAttemptStatus;
  score: number | null;
  started_at: string;
  submitted_at: string | null;
  expires_at: string | null;
};

export type QuizDaySlot = {
  quiz: QuizRow;
  attempt: QuizAttemptRow | null;
};

export type QuizDayHub = {
  quizDate: string;
  competitive: boolean;
  isOwner: boolean;
  official: QuizDaySlot | null;
  bonus: QuizDaySlot | null;
};

export type QuizLeaderboardRow = {
  position: number;
  profileId: string;
  label: string;
  avatarUrl: string | null;
  totalScore: number;
  reliabilityPct: number | null;
};

export type QuizResultResponse = {
  attemptId: string;
  score: number;
  maxPoints: number;
  scoringMode: QuizScoringMode;
  kind: QuizKind;
  responses: Array<{
    questionId: string;
    prompt: string;
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
    pointsAwarded: number;
  }>;
};
