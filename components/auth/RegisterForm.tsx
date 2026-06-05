"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpAndJoin } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUpAndJoin(new FormData(e.currentTarget));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm text-[var(--tm-muted)]">
        Codigo de invitacion
        <Input name="inviteCode" type="text" required className="mt-1" />
      </label>
      <label className="block text-sm text-[var(--tm-muted)]">
        Usuario
        <Input name="username" type="text" autoComplete="username" required className="mt-1" />
      </label>
      <label className="block text-sm text-[var(--tm-muted)]">
        Nombre visible (opcional)
        <Input name="displayName" type="text" className="mt-1" />
      </label>
      <label className="block text-sm text-[var(--tm-muted)]">
        Contrasena
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1"
        />
      </label>
      {error && (
        <p className="text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className={cn("w-full", pending && "opacity-60")}>
        {pending ? "Registrando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
