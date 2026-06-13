import { LoadingCenter } from "@/components/ui/spinner";

export default function AppSectionLoading() {
  return (
    <div
      className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center"
      aria-busy="true"
      aria-label="Cargando seccion"
    >
      <LoadingCenter minHeightClassName="min-h-0" />
    </div>
  );
}
