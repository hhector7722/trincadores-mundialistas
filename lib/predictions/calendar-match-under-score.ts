import { shirtPlayerName } from "@/lib/lineup/short-player-name";

export type CalendarMatchUnderScoreTone = "group" | "official-mvp" | "predicted-mvp";

export type CalendarMatchUnderScore = {
  label: string;
  tone: CalendarMatchUnderScoreTone;
};

export function formatCalendarMvpLabel(fullName: string): string {
  return shirtPlayerName(fullName.trim());
}

export function resolveCalendarMatchUnderScore(input: {
  finished: boolean;
  groupCode?: string | null;
  predictedMvpPlayerName?: string | null;
  officialMvpPlayerName?: string | null;
}): CalendarMatchUnderScore | null {
  if (input.finished) {
    const official = input.officialMvpPlayerName?.trim();
    if (!official) return null;
    return { label: formatCalendarMvpLabel(official), tone: "official-mvp" };
  }

  const predicted = input.predictedMvpPlayerName?.trim();
  if (predicted) {
    return { label: formatCalendarMvpLabel(predicted), tone: "predicted-mvp" };
  }

  const group = input.groupCode?.trim();
  if (group) {
    return { label: group.toUpperCase(), tone: "group" };
  }

  return null;
}
