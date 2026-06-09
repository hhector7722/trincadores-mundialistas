import { todayQuizDate } from "@/lib/quiz/date";

const MADRID_TZ = "Europe/Madrid";
const TARGET_HOUR = 5;

export function madridHour(now = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TZ,
    hour: "numeric",
    hour12: false,
  }).format(now);
  return Number.parseInt(hour, 10);
}

export function isQuizCronWindow(now = new Date()): boolean {
  return madridHour(now) === TARGET_HOUR;
}

export function quizDateForCron(now = new Date()): string {
  return todayQuizDate(now);
}

export function assertCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
