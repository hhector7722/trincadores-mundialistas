import type { ReactNode } from "react";

type TabScrollLoadingProps = {
  children?: ReactNode;
  label?: string;
};

/** Contenedor de carga sin fondo propio: hereda el shell de la app. */
export function TabScrollLoading({ children, label }: TabScrollLoadingProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label={label ?? "Cargando"}
    >
      {children}
    </div>
  );
}
