import { recordAppUsageEvent } from "@/lib/usage/record";
import type { AppUsageMetadata } from "@/lib/usage/types";

export async function trackUsageAction(
  profileId: string,
  input: {
    path?: string | null;
    label?: string | null;
    metadata: AppUsageMetadata;
  }
): Promise<void> {
  await recordAppUsageEvent(profileId, "action", input.path ?? null, {
    label: input.label,
    metadata: { ...input.metadata, source: "server" },
  });
}
