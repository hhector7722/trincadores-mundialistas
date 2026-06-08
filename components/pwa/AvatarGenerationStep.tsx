"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GENERATION_MS = 10_000;
const MESSAGE_SWITCH_AT = 0.55;

type Phase = "generating" | "reveal";

type Props = {
  displayName: string;
  avatarUrl: string;
  onReady: () => Promise<void>;
  onContinue: () => void;
  pending?: boolean;
};

export function AvatarGenerationStep({
  displayName,
  avatarUrl,
  onReady,
  onContinue,
  pending = false,
}: Props) {
  const [phase, setPhase] = useState<Phase>("generating");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(`generando imagen de '${displayName}'`);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (phase !== "generating" || startedRef.current) return;
    startedRef.current = true;

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / GENERATION_MS);
      const pct = Math.round(ratio * 100);
      setProgress(pct);
      setMessage(
        ratio >= MESSAGE_SWITCH_AT
          ? "ya casi lo tengo crack"
          : `generando imagen de '${displayName}'`
      );

      if (ratio >= 1) {
        void (async () => {
          setSaving(true);
          setReadyError(null);
          try {
            await onReady();
            setPhase("reveal");
          } catch (error) {
            setReadyError(
              error instanceof Error ? error.message : "No se pudo guardar tu avatar. Intentalo de nuevo."
            );
            startedRef.current = false;
          } finally {
            setSaving(false);
          }
        })();
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [displayName, onReady, phase]);

  if (phase === "generating") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--tm-accent)]">
            Generando avatar
          </p>
          <h2 className="mt-2 font-display text-xl uppercase tracking-wide text-white">
            Un momento...
          </h2>
          <p className="mt-2 min-h-10 text-sm leading-relaxed text-white/70">{message}</p>
        </div>

        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r from-[var(--tm-purple)] via-[var(--tm-accent)] to-[var(--tm-accent)] transition-[width] duration-150 ease-out",
                progress >= 100 && "shadow-[0_0_20px_rgba(217,255,0,0.45)]"
              )}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de generacion de avatar"
            />
          </div>
          <p className="text-center text-xs tabular-nums text-white/50">{progress}%</p>
        </div>

        {readyError ? (
          <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
            {readyError}
          </p>
        ) : null}

        {saving ? (
          <p className="text-center text-xs text-white/50">Guardando tu avatar definitivo...</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--tm-accent)]">
          Avatar listo
        </p>
        <h2 className="mt-2 font-display text-xl uppercase tracking-wide text-white">
          {displayName}
        </h2>
        <p className="mt-2 text-sm text-white/60">Este sera tu avatar en la porra. No se puede cambiar.</p>
      </div>

      <div className="relative mx-auto flex size-44 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[var(--tm-accent-soft)] blur-2xl" aria-hidden />
        <div className="relative size-40 overflow-hidden rounded-full border-2 border-[var(--tm-accent)] shadow-[0_0_40px_rgba(217,255,0,0.25)]">
          <Image
            src={avatarUrl}
            alt={`Avatar de ${displayName}`}
            width={320}
            height={320}
            className="size-full object-cover"
            priority
          />
        </div>
      </div>

      <Button type="button" className="w-full" disabled={pending} onClick={onContinue}>
        {pending ? "Continuando..." : "Continuar"}
      </Button>
    </div>
  );
}
