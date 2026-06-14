export type AppUsageEventType = "login" | "session" | "page_view" | "action";

export type AppUsageActionKind =
  | "tab_switch"
  | "page_dwell"
  | "modal_open"
  | "modal_dwell"
  | "prediction_saved"
  | "quiz_started"
  | "quiz_submitted";

export type AppUsageMetadata = {
  action?: AppUsageActionKind;
  matchId?: string;
  profileId?: string;
  quizId?: string;
  quizDay?: string;
  homeGoals?: number;
  awayGoals?: number;
  score?: number;
  modalId?: string;
  modalLabel?: string;
  source?: "client" | "middleware" | "server";
  [key: string]: string | number | boolean | null | undefined;
};

export type AppUsageEventInput = {
  eventType: AppUsageEventType;
  path?: string | null;
  label?: string | null;
  search?: string | null;
  referrerPath?: string | null;
  durationMs?: number | null;
  metadata?: AppUsageMetadata;
};

export type UsageClientEventPayload = AppUsageEventInput;
