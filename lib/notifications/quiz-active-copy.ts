export function buildQuizActiveAnnouncementCopy(): { title: string; body: string } {
  return {
    title: "Quiz activo",
    body:
      "El quiz diario ya está en modo competitivo y cuenta para la clasificación. " +
      "Al final del torneo, los 4 primeros del ranking sumarán puntos extra a la porra principal (+5/+3/+2/+1). " +
      "¡Entra y juega el de hoy!",
  };
}

export function buildQuizActiveModalCopy(): { title: string; body: string } {
  return {
    title: "Quiz activo",
    body: "El quiz diario ya está en modo competitivo.",
  };
}
