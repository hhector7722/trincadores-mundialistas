import { PwaOnboardingFlow } from "@/components/pwa/PwaOnboardingFlow";
import { getOnboardingParticipants } from "@/lib/pwa/onboarding-participants";

export default async function BienvenidaPage() {
  const participants = await getOnboardingParticipants();
  return <PwaOnboardingFlow participants={participants} />;
}
