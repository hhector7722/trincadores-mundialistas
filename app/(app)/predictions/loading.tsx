import { LoadingCenter } from "@/components/ui/spinner";

export default function PredictionsLoading() {
  return (
    <div
      className="tm-porra-layout flex min-h-0 flex-1 flex-col items-center justify-center"
      aria-busy="true"
      aria-label="Cargando calendario"
    >
      <LoadingCenter minHeightClassName="min-h-0" />
    </div>
  );
}
