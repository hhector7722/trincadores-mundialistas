import { LoadingCenter } from "@/components/ui/spinner";

type TabPageLoadingProps = {
  label?: string;
};

/** Spinner centrado en el área de contenido; sin fondo propio ni animaciones de entrada. */
export function TabPageLoading({ label }: TabPageLoadingProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center"
      aria-busy="true"
      aria-live="polite"
      aria-label={label ?? "Cargando"}
    >
      <LoadingCenter minHeightClassName="min-h-0" label={label} />
    </div>
  );
}
