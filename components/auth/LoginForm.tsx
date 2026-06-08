"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signInWithPhone } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const phone = String(fd.get("phone") ?? "");

    startTransition(async () => {
      const result = await signInWithPhone(phone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      {pending ? <LoadingOverlay label="Entrando…" /> : null}
      <div>
        <label
          htmlFor="login-phone"
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
        >
          Numero de movil
        </label>
        <Input
          id="login-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          className="mt-1.5 bg-[var(--tm-surface)] font-mono tracking-wide backdrop-blur-sm"
          placeholder="647229309"
          spellCheck={false}
        />
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full font-bold uppercase tracking-wide shadow-[0_4px_20px_rgba(204,255,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(204,255,0,0.35)]",
          pending && "opacity-60"
        )}
      >
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
