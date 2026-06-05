import { LoginForm } from "@/components/auth/LoginForm";
import { LoginHero } from "@/components/auth/LoginHero";

export default function LoginPage() {
  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      <LoginHero />

      <div className="tm-glass-card rounded-2xl p-5 backdrop-blur-xl">
        <LoginForm />
      </div>
    </div>
  );
}
