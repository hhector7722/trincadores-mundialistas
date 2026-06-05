const MIN_UI_SCALE = 0.15;
const MAX_UI_SCALE = 2.75;
const SCALE_SEARCH_ITERATIONS = 14;
const LAYOUT_PASSES = 4;
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
      ".tm-cal-day-num, .tm-cal-match-btn, .tm-cal-flags, .tm-cal-flag, .tm-cal-kickoff"
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

/** Encuentra filas y escala que caben en alto y ancho sin desbordar celdas. */
export function fitCalendarLayout(
  calendar: HTMLElement,
  grid: HTMLElement,
  rowCount: number
): CalendarLayoutResult | null {
  if (rowCount <= 0) return null;

  let rowHeight = 0;
  let uiScale = MIN_UI_SCALE;

  for (let pass = 0; pass < LAYOUT_PASSES; pass++) {
    const gridHeight = grid.clientHeight;
    if (gridHeight <= 0) return null;

    rowHeight = Math.floor(gridHeight / rowCount);
    calendar.style.setProperty("--tm-cal-row-height", `${rowHeight}px`);
    void calendar.offsetHeight;

    uiScale = searchMaxScale(calendar, grid);
  }

  while (uiScale > MIN_UI_SCALE && gridHasOverflow(grid)) {
    uiScale = Math.max(MIN_UI_SCALE, uiScale * 0.94);
    calendar.style.setProperty("--tm-cal-ui-scale", uiScale.toFixed(4));
    void calendar.offsetHeight;
  }

  return { rowHeight, uiScale };
}

export function resetCalendarLayout(calendar: HTMLElement): void {
  calendar.style.removeProperty("--tm-cal-row-height");
  calendar.style.removeProperty("--tm-cal-ui-scale");
}
