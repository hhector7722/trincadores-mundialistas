"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledUsername = searchParams.get("u")?.trim() ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "");
    const accessCode = String(fd.get("accessCode") ?? "");

    startTransition(async () => {
      const result = await signIn(username, accessCode);
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
          htmlFor="login-username"
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
        >
          Alias
        </label>
        <Input
          id="login-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          defaultValue={prefilledUsername}
          className="mt-1.5 bg-[var(--tm-surface)] backdrop-blur-sm"
          spellCheck={false}
        />
      </div>

      <div>
        <label
          htmlFor="login-access-code"
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
        >
          Codigo de acceso
        </label>
        <Input
          id="login-access-code"
          name="accessCode"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          className="mt-1.5 bg-[var(--tm-surface)] font-mono uppercase tracking-wider backdrop-blur-sm"
          spellCheck={false}
        />
      </div>

      {error && (
        <p
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

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
