import { LoginForm } from "@/components/auth/LoginForm";
import { LoginHero } from "@/components/auth/LoginHero";
import { KeyRound } from "lucide-react";

export default function LoginPage() {
  return (
    <>
      <LoginHero />

      <div className="rounded-2xl border border-purple-500/20 bg-[#0a0612]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-950/80 ring-1 ring-purple-500/25">
            <KeyRound className="h-5 w-5 text-purple-400" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-sm uppercase tracking-wide text-white">Entrar</h2>
            <p className="mt-1 text-sm text-white/50">
              Alias y codigo de acceso de la porra.
            </p>
          </div>
        </div>

        <LoginForm />
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        Si perdiste el codigo, contacta al administrador de la porra.
      </p>
    </>
  );
}
