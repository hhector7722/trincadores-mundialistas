const MIN_UI_SCALE = 0.15;
const MAX_UI_SCALE = 2.75;
const SCALE_SEARCH_ITERATIONS = 14;
const OVERFLOW_TOLERANCE_PX = 1;

export function getMaxMatchesInMonthGrid<T extends { inMonth: boolean; matches: unknown[] }>(
  cells: T[]
): number {
  let max = 0;
  for (const cell of cells) {
    if (cell.inMonth) {
      max = Math.max(max, cell.matches.length);
    }
  }
  return max;
}

function elementOverflows(el: HTMLElement): boolean {
  return (
    el.scrollHeight > el.clientHeight + OVERFLOW_TOLERANCE_PX ||
    el.scrollWidth > el.clientWidth + OVERFLOW_TOLERANCE_PX
  );
}

function gridHasOverflow(grid: HTMLElement): boolean {
  const cells = Array.from(grid.children) as HTMLElement[];
  for (const cell of cells) {
    if (elementOverflows(cell)) return true;

    const inner = cell.querySelectorAll(
      ".tm-cal-day-num, .tm-cal-match-list, .tm-cal-match-card"
    );
    for (const node of inner) {
      if (node instanceof HTMLElement && elementOverflows(node)) return true;
    }
  }
  return false;
}

function searchMaxScale(calendar: HTMLElement, grid: HTMLElement): number {
  let lo = MIN_UI_SCALE;
  let hi = MAX_UI_SCALE;
  let best = MIN_UI_SCALE;

  for (let i = 0; i < SCALE_SEARCH_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    calendar.style.setProperty("--tm-cal-ui-scale", mid.toFixed(4));
    void calendar.offsetHeight;

    if (gridHasOverflow(grid)) {
      hi = mid;
    } else {
      best = mid;
      lo = mid;
    }
  }

  calendar.style.setProperty("--tm-cal-ui-scale", best.toFixed(4));
  return best;
}

export type CalendarLayoutResult = {
  rowHeight: number;
  uiScale: number;
};

/** Filas iguales vía CSS grid 1fr; escala UI para que el contenido quepa sin desbordar. */
export function fitCalendarLayout(
  calendar: HTMLElement,
  grid: HTMLElement,
  rowCount: number
): CalendarLayoutResult | null {
  if (rowCount <= 0) return null;

  calendar.style.setProperty("--tm-cal-weeks", String(rowCount));
  void grid.offsetHeight;

  let uiScale = searchMaxScale(calendar, grid);

  while (uiScale > MIN_UI_SCALE && gridHasOverflow(grid)) {
    uiScale = Math.max(MIN_UI_SCALE, uiScale * 0.94);
    calendar.style.setProperty("--tm-cal-ui-scale", uiScale.toFixed(4));
    void calendar.offsetHeight;
  }

  const rowHeight = grid.clientHeight > 0 ? grid.clientHeight / rowCount : 0;
  return { rowHeight, uiScale };
}

export function resetCalendarLayout(calendar: HTMLElement): void {
  calendar.style.removeProperty("--tm-cal-ui-scale");
}
