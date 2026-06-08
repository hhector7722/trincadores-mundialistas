import type { ReactNode } from "react";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: scroll interno acotado; TabBar fixed fuera del flujo (portal). */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <div className="tm-home-layout relative z-10 flex h-full min-h-0 w-full flex-col gap-3 p-4 pb-0">
      <div className="tm-home-layout__hero shrink-0">{hero}</div>
      {body}
    </div>
  );
}
