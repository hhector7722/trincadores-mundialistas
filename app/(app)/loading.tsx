import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";
import { LoadingCenter } from "@/components/ui/spinner";

export default function AppSectionLoading() {
  return (
    <ViewportLayoutRoot
      className="tm-tab-scroll-layout relative z-10 flex flex-col items-center justify-center overflow-hidden"
      aria-busy="true"
      aria-label="Cargando seccion"
    >
      <LoadingCenter minHeightClassName="min-h-0" />
    </ViewportLayoutRoot>
  );
}
