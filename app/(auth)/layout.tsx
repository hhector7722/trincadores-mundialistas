import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--tm-bg)]">
      <HomeAtmosphere />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4 pb-8 sm:p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
