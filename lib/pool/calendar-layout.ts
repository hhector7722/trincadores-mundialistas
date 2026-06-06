const MIN_UI_SCALE = 0.15;
const MAX_UI_SCALE = 2.75;
const SCALE_SEARCH_ITERATIONS = 14;
const OVERFLOW_TOLERANCE_PX = 1;
const MATCH_CARD_GAP_PX = 4;
const MIN_MATCH_CARD_HEIGHT_PX = 22;
const GROUPS_EDGE_INSET_PX = 4;
const GROUPS_FLAGS_PER_ROW = 4;
const GROUPS_FLAG_GAP_PX = 2;
const GROUPS_LETTER_WIDTH_RATIO = 0.1;
const GROUPS_SIZE_FIT = 0.92;
const MIN_GROUPS_FLAG_PX = 6;

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
      ".tm-cal-day-num, .tm-cal-match-list, .tm-cal-match-card, .tm-cal-groups-panel, .tm-cal-groups-list, .tm-cal-group-row"
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

function findBusiestMatchCell(grid: HTMLElement): HTMLElement | null {
  const cells = grid.querySelectorAll<HTMLElement>(".tm-cal-cell--matches");
  let best: HTMLElement | null = null;
  let bestCount = 0;

  for (const cell of cells) {
    const count = cell.querySelectorAll(".tm-cal-match-card").length;
    if (count > bestCount) {
      bestCount = count;
      best = cell;
    }
  }

  return best;
}

/** Altura uniforme de tarjetas según la celda con más partidos. */
function syncMatchCardMetrics(calendar: HTMLElement, grid: HTMLElement): number {
  calendar.style.setProperty("--tm-cal-match-gap", `${MATCH_CARD_GAP_PX}px`);

  const refCell = findBusiestMatchCell(grid);
  if (!refCell) {
    calendar.style.removeProperty("--tm-cal-match-card-h");
    return 0;
  }

  const matchCount = refCell.querySelectorAll(".tm-cal-match-card").length;
  const matchList = refCell.querySelector<HTMLElement>(".tm-cal-match-list");
  if (!matchList || matchCount <= 0) {
    calendar.style.removeProperty("--tm-cal-match-card-h");
    return 0;
  }

  const listHeight = matchList.clientHeight;
  const totalGap = MATCH_CARD_GAP_PX * Math.max(0, matchCount - 1);
  const cardHeight = Math.max(
    MIN_MATCH_CARD_HEIGHT_PX,
    Math.floor((listHeight - totalGap) / matchCount)
  );

  calendar.style.setProperty("--tm-cal-match-card-h", `${cardHeight}px`);
  return cardHeight;
}

/** Escala título, letras y banderas del panel GRUPOS al tamaño de la celda fusionada. */
function syncGroupsPanelMetrics(calendar: HTMLElement, grid: HTMLElement): void {
  const panel = grid.querySelector<HTMLElement>(".tm-cal-groups-panel");
  if (!panel) {
    calendar.style.removeProperty("--tm-cal-groups-pad");
    calendar.style.removeProperty("--tm-cal-groups-title-fs");
    calendar.style.removeProperty("--tm-cal-groups-letter-fs");
    calendar.style.removeProperty("--tm-cal-groups-letter-w");
    calendar.style.removeProperty("--tm-cal-groups-flag");
    calendar.style.removeProperty("--tm-cal-groups-flag-gap");
    return;
  }

  const rowCount = panel.querySelectorAll(".tm-cal-group-row").length;
  if (rowCount <= 0) return;

  const innerW = Math.max(0, panel.clientWidth - GROUPS_EDGE_INSET_PX * 2);
  const innerH = Math.max(0, panel.clientHeight - GROUPS_EDGE_INSET_PX * 2);
  if (innerW < 24 || innerH < 24) return;

  let fit = GROUPS_SIZE_FIT;
  let flagSize = MIN_GROUPS_FLAG_PX;
  let titleFs = 6;
  let letterFs = 5;
  let letterW = 6;

  for (let attempt = 0; attempt < 12; attempt++) {
    titleFs = Math.max(6, Math.floor(innerH * 0.065 * fit));
    const titleBlock = titleFs * 1.2 + 2;
    const listH = Math.max(0, innerH - titleBlock);
    const rowH = listH / rowCount;

    letterW = Math.max(6, Math.floor(innerW * GROUPS_LETTER_WIDTH_RATIO));
    const flagsTrackW = Math.max(0, innerW - letterW - 2);
    const flagByHeight = rowH * fit;
    const flagByWidth =
      (flagsTrackW - GROUPS_FLAG_GAP_PX * (GROUPS_FLAGS_PER_ROW - 1)) / GROUPS_FLAGS_PER_ROW;
    flagSize = Math.max(
      MIN_GROUPS_FLAG_PX,
      Math.floor(Math.min(flagByHeight, flagByWidth) * fit)
    );
    letterFs = Math.max(5, Math.floor(flagSize * 0.48));

    calendar.style.setProperty("--tm-cal-groups-pad", `${GROUPS_EDGE_INSET_PX}px`);
    calendar.style.setProperty("--tm-cal-groups-title-fs", `${titleFs}px`);
    calendar.style.setProperty("--tm-cal-groups-letter-fs", `${letterFs}px`);
    calendar.style.setProperty("--tm-cal-groups-letter-w", `${letterW}px`);
    calendar.style.setProperty("--tm-cal-groups-flag", `${flagSize}px`);
    calendar.style.setProperty("--tm-cal-groups-flag-gap", `${GROUPS_FLAG_GAP_PX}px`);
    void panel.offsetHeight;

    const list = panel.querySelector<HTMLElement>(".tm-cal-groups-list");
    if (!list || !elementOverflows(list)) break;
    fit *= 0.9;
  }
}

export type CalendarLayoutResult = {
  rowHeight: number;
  uiScale: number;
  matchCardHeight: number;
};

/** Filas iguales vía CSS grid 1fr; tarjetas compartidas según el día más cargado. */
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

  let matchCardHeight = syncMatchCardMetrics(calendar, grid);
  syncGroupsPanelMetrics(calendar, grid);

  for (let pass = 0; pass < 6 && gridHasOverflow(grid); pass++) {
    uiScale = Math.max(MIN_UI_SCALE, uiScale * 0.94);
    calendar.style.setProperty("--tm-cal-ui-scale", uiScale.toFixed(4));
    void calendar.offsetHeight;
    matchCardHeight = syncMatchCardMetrics(calendar, grid);
    syncGroupsPanelMetrics(calendar, grid);
  }

  const rowHeight = grid.clientHeight > 0 ? grid.clientHeight / rowCount : 0;
  return { rowHeight, uiScale, matchCardHeight };
}

export function resetCalendarLayout(calendar: HTMLElement): void {
  calendar.style.removeProperty("--tm-cal-ui-scale");
  calendar.style.removeProperty("--tm-cal-match-gap");
  calendar.style.removeProperty("--tm-cal-match-card-h");
  calendar.style.removeProperty("--tm-cal-groups-pad");
  calendar.style.removeProperty("--tm-cal-groups-title-fs");
  calendar.style.removeProperty("--tm-cal-groups-letter-fs");
  calendar.style.removeProperty("--tm-cal-groups-letter-w");
  calendar.style.removeProperty("--tm-cal-groups-flag");
  calendar.style.removeProperty("--tm-cal-groups-flag-gap");
}
