import { PredictionsCalendarSkeleton } from "@/components/predictions/PredictionsCalendarSkeleton";

export default function PredictionsLoading() {
  return (
    <div className="tm-porra-page flex min-h-0 flex-1 flex-col">
      <div className="tm-porra-calendar-wrap">
        <PredictionsCalendarSkeleton />
      </div>
    </div>
  );
}
