import type { ReactNode } from "react";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: contenido natural; scroll en tm-app-main (hero + cards juntos). */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <div className="tm-home-layout relative z-10 flex w-full flex-col gap-3 p-4 pb-0">
      <div className="tm-home-layout__hero shrink-0">{hero}</div>
      {body}
    </div>
  );
}
