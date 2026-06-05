import { LoginForm } from "@/components/auth/LoginForm";
import { LoginHero } from "@/components/auth/LoginHero";

export default function LoginPage() {
  return (
    <>
      <LoginHero />

      <div className="rounded-2xl border border-purple-500/20 bg-[#0a0612]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <LoginForm />
      </div>
    </>
  );
}
