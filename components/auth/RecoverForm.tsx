"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function RecoverForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const username = String(new FormData(e.currentTarget).get("username") ?? "");

    startTransition(async () => {
      const result = await requestPasswordReset(username);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        "Solicitud registrada. En 1a el enlace solo se envia si hay correo operativo configurado en Supabase (el destino es tecnico, no un buzon real)."
      );
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm text-[var(--tm-muted)]">
        Usuario
        <Input name="username" type="text" autoComplete="username" required className="mt-1" />
      </label>
      {error && (
        <p className="text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-[var(--tm-muted)]" role="status">
          {message}
        </p>
      )}
      <Button type="submit" disabled={pending} className={cn("w-full", pending && "opacity-60")}>
        {pending ? "Enviando..." : "Enviar enlace"}
      </Button>
    </form>
  );
}
