export type IntroCountdownView = {
  eyebrow: string;
  main: string;
  emphasis: boolean;
};

/** Cuenta atrás TV en los últimos 3 s del vídeo; antes, texto de espera suave. */
export function introCountdownFromRemaining(remainingSec: number): IntroCountdownView {
  if (remainingSec > 3) {
    return {
      eyebrow: "Trincadores Mundialistas",
      main: "Un momento…",
      emphasis: false,
    };
  }

  if (remainingSec > 2) {
    return { eyebrow: "Empezamos en", main: "3", emphasis: true };
  }
  if (remainingSec > 1) {
    return { eyebrow: "Empezamos en", main: "2", emphasis: true };
  }
  if (remainingSec > 0) {
    return { eyebrow: "Empezamos en", main: "1", emphasis: true };
  }

  return { eyebrow: "", main: "¡Vamos!", emphasis: true };
}
