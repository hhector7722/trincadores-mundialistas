"use client";

import {
  ArrowLeft,
  ImageIcon,
  MoreHorizontal,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { signInWithPhone } from "@/actions/auth";
import {
  completePwaOnboarding,
  confirmStandaloneInstallation,
  assignParticipantAvatar,
  identifyParticipantByPhone,
  resolvePwaEntryRoute,
} from "@/actions/pwa-onboarding";
import { LoginHero } from "@/components/auth/LoginHero";
import { AvatarGenerationStep } from "@/components/pwa/AvatarGenerationStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPresetAvatarUrl } from "@/lib/avatars/presets";
import { detectMobileOs, isStandalonePWA, type MobileOs } from "@/lib/pwa/standalone";
type OnboardingStep = "os" | "instructions" | "verify" | "phone" | "avatar";

type IdentifiedParticipant = {
  username: string;
  displayName: string;
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
      <InstructionRow
        icon={ImageIcon}
        title="Espera al logo"
        detail="Cuando abra la app, espera a que cargue correctamente el logo de Trincadores antes de continuar."
      />
    </ol>
  );
}

function IosInstructions() {
  return (
    <ol className="space-y-2">
      <InstructionRow
        icon={MoreHorizontal}
        title="Pulsa los tres puntos"
        detail='Toca el boton "..." de Safari antes de llegar al menu de compartir.'
      />
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
      <InstructionRow
        icon={ImageIcon}
        title="Espera al logo"
        detail="Cuando abra la app, espera a que cargue correctamente el logo de Trincadores antes de continuar."
      />
    </ol>
  );
}

function OsChoiceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-bold uppercase tracking-wide text-white/80 transition-colors hover:border-[var(--tm-accent)] hover:bg-[var(--tm-accent-soft)] hover:text-[var(--tm-accent)]"
    >
      {label}
    </button>
  );
}

export function PwaOnboardingFlow() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<OnboardingStep>("os");
  const [os, setOs] = useState<MobileOs | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [participant, setParticipant] = useState<IdentifiedParticipant | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const goToAccess = useCallback(() => {
    startTransition(async () => {
      const username = participant?.username;
      if (!username || !phone.trim()) return;

      setAccessError(null);

      const result = await completePwaOnboarding(username);
      if (!result.ok) {
        setAccessError(result.error);
        return;
      }

      const signInResult = await signInWithPhone(phone);
      if (!signInResult.ok) {
        setAccessError(signInResult.error);
        return;
      }

      router.push("/");
      router.refresh();
    });
  }, [participant?.username, phone, router]);

  useEffect(() => {
    if (bootstrapped) return;

    const detectedOs = detectMobileOs();
    if (detectedOs) setOs(detectedOs);

    if (isStandalonePWA()) {
      void (async () => {
        const entry = await resolvePwaEntryRoute();
        if (entry === "restore") {
          window.location.assign("/api/auth/restore");
          return;
        }
        if (entry === "login") {
          window.location.assign("/login");
          return;
        }

        const gate = await confirmStandaloneInstallation();
        if (gate.ok) {
          setStep("phone");
        }
        setBootstrapped(true);
      })();
      return;
    }

    setBootstrapped(true);
  }, [bootstrapped, router]);

  function selectOs(nextOs: MobileOs) {
    setOs(nextOs);
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
      setStep("phone");
    });
  }

  function onPhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneError(null);

    startTransition(async () => {
      const identity = await identifyParticipantByPhone(phone);
      if (!identity.ok) {
        setPhoneError(identity.error);
        return;
      }

      setParticipant(identity.data);
      setStep("avatar");
    });
  }

  const handleAvatarReady = useCallback(async () => {
    if (!participant) {
      throw new Error("Participante no identificado.");
    }
    const result = await assignParticipantAvatar(participant.username);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }, [participant]);

  function onBack() {
    setVerifyError(null);
    setPhoneError(null);
    if (step === "instructions") setStep("os");
    if (step === "verify") setStep("instructions");
    if (step === "phone") setStep("verify");
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      <LoginHero tagline="PARA VOSOTROS JUGADORES" />

      <div className="tm-glass-card rounded-2xl p-5 backdrop-blur-xl">
        {step !== "os" && step !== "avatar" ? (
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
              <OsChoiceButton label="Android" onClick={() => selectOs("android")} />
              <OsChoiceButton label="iOS" onClick={() => selectOs("ios")} />
            </div>
          </div>
        ) : null}

        {step === "instructions" && os ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">
              {os === "android" ? "Instalar en Android" : "Instalar en iPhone"}
            </h2>

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

        {step === "phone" ? (
          <form className="space-y-4" onSubmit={onPhoneSubmit}>
            <h2 className="text-lg font-bold text-white">Tu telefono</h2>

            <div>
              <label
                htmlFor="onboarding-phone"
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50"
              >
                Numero de movil
              </label>
              <Input
                id="onboarding-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setPhoneError(null);
                }}
                className="mt-1.5 bg-[var(--tm-surface)] font-mono tracking-wide"
                placeholder="647229309"
                spellCheck={false}
              />
            </div>

            {phoneError ? (
              <p
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                role="alert"
              >
                {phoneError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending || !phone.trim()}>
              {pending ? "Comprobando..." : "Siguiente"}
            </Button>
          </form>
        ) : null}

        {step === "avatar" && participant ? (
          <>
            {accessError ? (
              <p
                className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                role="alert"
              >
                {accessError}
              </p>
            ) : null}
            <AvatarGenerationStep
              displayName={participant.displayName}
              avatarUrl={getPresetAvatarUrl(participant.username)}
              onReady={handleAvatarReady}
              onContinue={goToAccess}
              pending={pending}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
