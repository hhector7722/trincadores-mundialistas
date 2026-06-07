import { LoadingCenter } from "@/components/ui/spinner";

export default function AppSectionLoading() {
  return (
    <div className="relative z-10 pb-4" aria-busy="true" aria-label="Cargando seccion">
      <LoadingCenter minHeightClassName="min-h-[min(55dvh,24rem)]" />
    </div>
  );
}
