import type { ReactNode } from "react";

type HomeViewportShellProps = {
  hero: ReactNode;
  body: ReactNode;
};

/** Inicio: llena el main flex entre cabecera y TabBar (sin medición JS). */
export function HomeViewportShell({ hero, body }: HomeViewportShellProps) {
  return (
    <div className="tm-home-layout relative z-10 flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-4 pb-0">
      <div className="tm-home-layout__hero shrink-0">{hero}</div>
      <div className="tm-home-layout__body flex min-h-0 flex-1 flex-col overflow-hidden">{body}</div>
    </div>
  );
}
