"use client";

import {
  ArrowLeft,
  Copy,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  completePwaOnboarding,
  confirmStandaloneInstallation,
  assignParticipantAvatar,
  hasCompletedPwaOnboarding,
  revealParticipantCredentials,
  type OnboardingCredentials,
} from "@/actions/pwa-onboarding";
import { LoginHero } from "@/components/auth/LoginHero";
import { AvatarGenerationStep } from "@/components/pwa/AvatarGenerationStep";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { getPresetAvatarUrl } from "@/lib/avatars/presets";
import type { OnboardingParticipant } from "@/lib/pwa/onboarding-participants";
import { detectMobileOs, isStandalonePWA, type MobileOs } from "@/lib/pwa/standalone";
import { cn } from "@/lib/utils";

type OnboardingStep = "os" | "instructions" | "verify" | "identify" | "avatar" | "credentials";

type Props = {
  participants: OnboardingParticipant[];
};

function InstructionRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tm-accent-soft)] text-[var(--tm-accent)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/60">{detail}</p>
      </div>
    </li>
  );
}

function AndroidInstructions() {
  return (
    <ol className="space-y-2">
      <InstructionRow
        icon={MoreVertical}
        title="Abre el menu de Chrome"
        detail="Toca los tres puntos verticales en la esquina superior derecha del navegador."
      />
      <InstructionRow
        icon={PlusSquare}
        title="Anade a pantalla de inicio"
        detail='Elige "Anadir a pantalla de inicio" o "Instalar aplicacion". Confirma el nombre y pulsa Anadir.'
      />
      <InstructionRow
        icon={Smartphone}
        title="Abre desde el icono"
        detail="Cierra esta pestana del navegador y entra desde el icono nuevo en tu pantalla de inicio."
      />
    </ol>
  );
}

function IosInstructions() {
  return (
    <ol className="space-y-2">
      <InstructionRow
        icon={Share}
        title="Pulsa Compartir"
        detail="Toca el icono de compartir en la barra inferior de Safari (cuadrado con flecha hacia arriba)."
      />
      <InstructionRow
        icon={PlusSquare}
        title="Anade a pantalla de inicio"
        detail='Desplazate y elige "Anadir a pantalla de inicio". Confirma y pulsa Anadir.'
      />
      <InstructionRow
        icon={Smartphone}
        title="Abre desde el icono"
        detail="Cierra Safari y entra desde el icono de Trincadores en tu pantalla de inicio."
      />
    </ol>
  );
}

function OsChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 flex-1 items-center justify-center rounded-2xl border px-4 text-sm font-bold uppercase tracking-wide transition-colors",
        selected
          ? "border-[var(--tm-accent)] bg-[var(--tm-accent-soft)] text-[var(--tm-accent)]"
          : "border-white/15 bg-white/5 text-white/80 hover:border-white/25"
      )}
    >
      {label}
    </button>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="min-h-12 flex-1 rounded-xl border border-white/10 bg-[var(--tm-surface)] px-3 py-2.5 font-mono text-sm tracking-wide text-white">
          {value}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onCopy}
          className="size-12 shrink-0 rounded-xl px-0"
          aria-label={`Copiar ${label.toLowerCase()}`}
        >
          <Copy className="size-4" aria-hidden />
        </Button>
      </div>
      {copied ? <p className="mt-1 text-xs text-[var(--tm-accent)]">Copiado</p> : null}
    </div>
  );
}

const STEP_ORDER: OnboardingStep[] = ["os", "instructions", "verify", "identify", "credentials"];

function stepNumber(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step) + 1;
}

export function PwaOnboardingFlow({ participants }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<OnboardingStep>("os");
  const [os, setOs] = useState<MobileOs | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<OnboardingParticipant | null>(null);
  const [credentials, setCredentials] = useState<OnboardingCredentials | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const goToAccess = useCallback(() => {
    startTransition(async () => {
      const result = await completePwaOnboarding();
      if (!result.ok) return;

      const username = credentials?.username;
      router.push(username ? `/login?u=${encodeURIComponent(username)}` : "/login");
      router.refresh();
    });
  }, [credentials?.username, router]);

  useEffect(() => {
    if (bootstrapped) return;

    const detectedOs = detectMobileOs();
    if (detectedOs) setOs(detectedOs);

    if (isStandalonePWA()) {
      void (async () => {
        const completed = await hasCompletedPwaOnboarding();
        if (completed) {
          router.replace("/login");
          router.refresh();
        } else {
          const gate = await confirmStandaloneInstallation();
          if (gate.ok) {
            setStep("identify");
          }
        }
        setBootstrapped(true);
      })();
      return;
    }

    setBootstrapped(true);
  }, [bootstrapped, router]);

  function onOsContinue() {
    if (!os) return;
    setVerifyError(null);
    setStep("instructions");
  }

  function onInstructionsContinue() {
    setVerifyError(null);
    setStep("verify");
  }

  function onVerifyInstalled() {
    setVerifyError(null);

    if (!isStandalonePWA()) {
      setVerifyError(
        "Aun no detectamos la app instalada. Abre Trincadores desde el icono de tu pantalla de inicio, no desde el navegador."
      );
      return;
    }

    startTransition(async () => {
      const gate = await confirmStandaloneInstallation();
      if (!gate.ok) {
        setVerifyError("No se pudo validar la instalacion. Intentalo de nuevo.");
        return;
      }
      setStep("identify");
    });
  }

  const handleAvatarReady = useCallback(async () => {
    if (!selectedParticipant) {
      throw new Error("Participante no seleccionado.");
    }
    const result = await assignParticipantAvatar(selectedParticipant.username);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }, [selectedParticipant]);

  function onIdentifyConfirm() {
    setIdentifyError(null);
    if (!selectedUsername) {
      setIdentifyError("Selecciona tu nombre en la lista.");
      return;
    }

    const participant = participants.find((row) => row.username === selectedUsername);
    if (!participant) {
      setIdentifyError("Participante no valido.");
      return;
    }

    setSelectedParticipant(participant);
    setStep("avatar");
  }

  function onAvatarContinue() {
    if (!selectedParticipant) return;

    startTransition(async () => {
      const result = await revealParticipantCredentials(
        selectedParticipant.username,
        selectedParticipant.displayName
      );
      if (!result.ok) {
        setIdentifyError(result.error);
        setStep("identify");
        return;
      }
      setCredentials(result.data);
      setStep("credentials");
    });
  }

  function onBack() {
    setVerifyError(null);
    setIdentifyError(null);
    if (step === "instructions") setStep("os");
    if (step === "verify") setStep("instructions");
    if (step === "identify") setStep("verify");
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      <LoginHero />

      <div className="tm-glass-card rounded-2xl p-5 backdrop-blur-xl">
        {step !== "os" && step !== "credentials" && step !== "avatar" ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex min-h-12 items-center gap-1 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Atras
          </button>
        ) : null}

        {step === "os" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Instala la app</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                Para jugar necesitas abrir Trincadores como app instalada en tu movil. Elige tu
                sistema operativo.
              </p>
            </div>

            <div className="flex gap-3">
              <OsChoiceButton label="Android" selected={os === "android"} onClick={() => setOs("android")} />
              <OsChoiceButton label="iOS" selected={os === "ios"} onClick={() => setOs("ios")} />
            </div>

            <Button type="button" className="w-full" disabled={!os} onClick={onOsContinue}>
              Ver instrucciones
            </Button>
          </div>
        ) : null}

        {step === "instructions" && os ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {os === "android" ? "Instalar en Android" : "Instalar en iPhone"}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                Sigue estos pasos y despues confirma que ya la abriste desde el icono.
              </p>
            </div>

            {os === "android" ? <AndroidInstructions /> : <IosInstructions />}

            <Button type="button" className="w-full" onClick={onInstructionsContinue}>
              Ya la he instalado
            </Button>
          </div>
        ) : null}

        {step === "verify" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Comprobacion</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                Abre la app desde el icono de tu pantalla de inicio. Si sigues en el navegador, la
                comprobacion fallara.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="font-semibold text-white">Que comprobamos</p>
              <p className="mt-1 leading-relaxed">
                Solo verificamos que la app se ejecuta en modo instalada (standalone). No pedimos
                capturas ni comprobamos el icono.
              </p>
            </div>

            {verifyError ? (
              <p
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                role="alert"
              >
                {verifyError}
              </p>
            ) : null}

            <Button type="button" className="w-full" disabled={pending} onClick={onVerifyInstalled}>
              {pending ? "Comprobando..." : "Comprobar instalacion"}
            </Button>
          </div>
        ) : null}

        {step === "identify" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Quien eres?</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                Selecciona tu nombre. Despues generaremos tu avatar para la porra.
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-2">
              {participants.map((participant) => {
                const selected = selectedUsername === participant.username;
                return (
                  <li key={participant.username}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUsername(participant.username);
                        setIdentifyError(null);
                      }}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
                        selected
                          ? "border-[var(--tm-accent)] bg-[var(--tm-accent-soft)] text-[var(--tm-accent)]"
                          : "border-white/15 bg-white/5 text-white hover:border-white/25"
                      )}
                    >
                      {participant.displayName}
                    </button>
                  </li>
                );
              })}
            </ul>

            {identifyError ? (
              <p
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                role="alert"
              >
                {identifyError}
              </p>
            ) : null}

            <Button
              type="button"
              className="w-full"
              disabled={!selectedUsername}
              onClick={onIdentifyConfirm}
            >
              Generar mi avatar
            </Button>
          </div>
        ) : null}

        {step === "avatar" && selectedParticipant ? (
          <AvatarGenerationStep
            displayName={selectedParticipant.displayName}
            avatarUrl={getPresetAvatarUrl(selectedParticipant.username)}
            onReady={handleAvatarReady}
            onContinue={onAvatarContinue}
            pending={pending}
          />
        ) : null}

        {step === "credentials" && credentials ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-[var(--tm-accent)]/30 bg-[var(--tm-accent-soft)] p-3">
              <ProfileAvatar
                avatarUrl={getPresetAvatarUrl(credentials.username)}
                label={credentials.displayName}
                className="size-12 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Hola, {credentials.displayName}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                  Guarda estos datos. Los necesitaras cada vez que entres.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <CopyField label="Alias" value={credentials.username} />
              <CopyField label="Codigo de acceso" value={credentials.accessCode} />
            </div>

            <Button type="button" className="w-full" disabled={pending} onClick={goToAccess}>
              {pending ? "Continuando..." : "Continuar al acceso"}
            </Button>
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs leading-relaxed text-white/50">
        Paso {stepNumber(step)} de {STEP_ORDER.length}
      </p>
    </div>
  );
}
