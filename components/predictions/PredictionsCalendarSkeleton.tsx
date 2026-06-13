import type { CSSProperties } from "react";

const WEEKDAY_LABELS_MOBILE = ["L", "M", "X", "J", "V", "S", "D"];

export function PredictionsCalendarSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Cargando calendario"
    >
      <section className="tm-porra-calendar tm-porra-calendar--fullbleed flex min-h-0 flex-1 flex-col p-0">
        <div className="tm-cal-header flex shrink-0 items-center justify-center px-2 py-1 sm:px-3">
          <h2 className="tm-cal-month-title text-center font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
            &nbsp;
          </h2>
        </div>

        <div className="tm-cal-weekdays grid shrink-0 grid-cols-7">
          {WEEKDAY_LABELS_MOBILE.map((label) => (
            <div key={label} className="tm-cal-weekday text-center uppercase tracking-wide">
              {label}
            </div>
          ))}
        </div>

        <div
          className="tm-cal-body min-h-0 flex-1"
          style={{ "--tm-cal-weeks": 3 } as CSSProperties}
        />
      </section>
    </div>
  );
}
