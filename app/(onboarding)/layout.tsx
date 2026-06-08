import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <HomeAtmosphere />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex w-full max-w-md flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}
