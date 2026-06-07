const OVERFLOW_TOLERANCE_PX = 1;
const MATCH_CARD_GAP_PX = 4;
const MIN_MATCH_CARD_HEIGHT_PX = 28;
const GROUPS_EDGE_INSET_PX = 2;
const GROUPS_FLAGS_PER_ROW = 4;
const GROUPS_LIST_COLUMNS = 2;
const GROUPS_COL_GAP_PX = 3;
const GROUPS_FLAG_GAP_PX = 1;
const GROUPS_CARD_GAP_PX = 2;
const GROUPS_CARD_PAD_Y = 1;
const GROUPS_LETTER_WIDTH_RATIO = 0.1;
const GROUPS_SIZE_FIT = 0.98;
const GROUPS_FLAG_SCALE = 0.96;
const GROUPS_CARD_HEIGHT_RATIO = 0.92;
const MIN_GROUPS_FLAG_PX = 7;
const MIN_PREDICTION_FS_PX = 4;
const MAX_PREDICTION_FS_RATIO = 0.62;

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
  const panel =
    grid.querySelector<HTMLElement>(".tm-cal-groups-section .tm-cal-groups-panel") ??
    grid.querySelector<HTMLElement>(".tm-cal-sidebar-card .tm-cal-groups-panel") ??
    grid.querySelector<HTMLElement>(".tm-cal-groups-panel");
  if (!panel) {
    calendar.style.removeProperty("--tm-cal-groups-pad");
    calendar.style.removeProperty("--tm-cal-groups-letter-fs");
    calendar.style.removeProperty("--tm-cal-groups-letter-w");
    calendar.style.removeProperty("--tm-cal-groups-flag");
    calendar.style.removeProperty("--tm-cal-groups-flag-gap");
    calendar.style.removeProperty("--tm-cal-groups-col-gap");
    calendar.style.removeProperty("--tm-cal-group-card-gap");
    calendar.style.removeProperty("--tm-cal-group-card-py");
    return;
  }

  const groupCount = panel.querySelectorAll(".tm-cal-group-card").length;
  if (groupCount <= 0) return;

  const rowCount = Math.ceil(groupCount / GROUPS_LIST_COLUMNS);

  const innerW = Math.max(0, panel.clientWidth - GROUPS_EDGE_INSET_PX * 2);
  const innerH = Math.max(0, panel.clientHeight - GROUPS_EDGE_INSET_PX * 2);
  if (innerW < 24 || innerH < 24) return;

  const cardW = Math.max(
    0,
    (innerW - GROUPS_COL_GAP_PX * (GROUPS_LIST_COLUMNS - 1)) / GROUPS_LIST_COLUMNS
  );

  let fit = GROUPS_SIZE_FIT;
  let flagSize = MIN_GROUPS_FLAG_PX;
  let letterFs = 5;
  let letterW = 6;

  for (let attempt = 0; attempt < 12; attempt++) {
    const listH = innerH;
    const totalCardGap = GROUPS_CARD_GAP_PX * Math.max(0, rowCount - 1);
    const cardSlotH = (listH - totalCardGap) / rowCount;
    const cardContentH = cardSlotH * GROUPS_CARD_HEIGHT_RATIO;
    const cardInnerH = Math.max(0, cardContentH - GROUPS_CARD_PAD_Y * 2);

    letterW = Math.max(4, Math.floor(cardW * GROUPS_LETTER_WIDTH_RATIO));
    const flagsTrackW = Math.max(0, cardW - letterW - 4);
    const flagByHeight = cardInnerH * GROUPS_FLAG_SCALE;
    const flagByWidth =
      ((flagsTrackW - GROUPS_FLAG_GAP_PX * (GROUPS_FLAGS_PER_ROW - 1)) / GROUPS_FLAGS_PER_ROW) *
      GROUPS_FLAG_SCALE;
    flagSize = Math.max(
      MIN_GROUPS_FLAG_PX,
      Math.floor(Math.min(flagByHeight, flagByWidth) * fit)
    );
    letterFs = Math.max(5, Math.floor(flagSize * 0.48));

    calendar.style.setProperty("--tm-cal-groups-pad", `${GROUPS_EDGE_INSET_PX}px`);
    calendar.style.setProperty("--tm-cal-groups-letter-fs", `${letterFs}px`);
    calendar.style.setProperty("--tm-cal-groups-letter-w", `${letterW}px`);
    calendar.style.setProperty("--tm-cal-groups-flag", `${flagSize}px`);
    calendar.style.setProperty("--tm-cal-groups-flag-gap", `${GROUPS_FLAG_GAP_PX}px`);
    calendar.style.setProperty("--tm-cal-groups-col-gap", `${GROUPS_COL_GAP_PX}px`);
    calendar.style.setProperty("--tm-cal-group-card-gap", `${GROUPS_CARD_GAP_PX}px`);
    calendar.style.setProperty("--tm-cal-group-card-py", `${GROUPS_CARD_PAD_Y}px`);
    void panel.offsetHeight;

    const list = panel.querySelector<HTMLElement>(".tm-cal-groups-list");
    const cards = panel.querySelectorAll<HTMLElement>(".tm-cal-group-card");
    const cardsOverflow = Array.from(cards).some((card) => elementOverflows(card));
    if (!list || (!elementOverflows(list) && !cardsOverflow)) break;
    fit *= 0.9;
  }
}

function resetPredictionLabelMetrics(root: ParentNode): void {
  for (const label of root.querySelectorAll<HTMLElement>(".tm-cal-prediction")) {
    label.style.removeProperty("font-size");
    label.style.removeProperty("max-width");
  }
}

/** Escala cada pronóstico al máximo tamaño que cabe entre las banderas sin truncar. */
function fitPredictionLabel(label: HTMLElement): void {
  const flags = label.closest<HTMLElement>(".tm-cal-flags");
  if (!flags) return;

  const flagsW = flags.clientWidth;
  const flagsH = flags.clientHeight;
  if (flagsW <= 0 || flagsH <= 0) return;

  const flagBadge = flags.querySelector<HTMLElement>(".tm-cal-flag");
  const flagSize = flagBadge?.offsetWidth ?? Math.min(flagsH, flagsW * 0.18);

  const leftBound = flagsW * 0.1 + flagSize * 0.55;
  const rightBound = flagsW * 0.9 - flagSize * 0.55;
  const availW = Math.max(0, Math.floor(rightBound - leftBound - 2));

  label.style.maxWidth = `${availW}px`;
  label.style.overflow = "visible";
  label.style.textOverflow = "clip";

  let fs = Math.max(MIN_PREDICTION_FS_PX, Math.floor(flagsH * MAX_PREDICTION_FS_RATIO));

  while (fs >= MIN_PREDICTION_FS_PX) {
    label.style.fontSize = `${fs}px`;
    void label.offsetWidth;
    if (label.scrollWidth <= availW + OVERFLOW_TOLERANCE_PX) break;
    fs -= 1;
  }

  label.style.fontSize = `${Math.max(MIN_PREDICTION_FS_PX, fs)}px`;
}

function syncPredictionLabelMetrics(grid: HTMLElement): void {
  for (const label of grid.querySelectorAll<HTMLElement>(".tm-cal-prediction")) {
    fitPredictionLabel(label);
  }
}

function readCssVarPx(host: HTMLElement, varName: string, fallback: number): number {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.height = `var(${varName})`;
  host.appendChild(probe);
  const height = probe.offsetHeight;
  host.removeChild(probe);
  return height > 0 ? height : fallback;
}

/** Mide la fila más alta del grid y la aplica a todas las semanas. */
function syncUniformRowHeight(
  calendar: HTMLElement,
  grid: HTMLElement,
  rowCount: number
): number {
  const minRow = "var(--tm-cal-row-min-height)";
  grid.style.gridTemplateRows = `repeat(${rowCount}, minmax(${minRow}, auto))`;
  void grid.offsetHeight;

  const rowHeightsByTop = new Map<number, number>();

  for (const child of grid.children) {
    if (!(child instanceof HTMLElement)) continue;
    rowHeightsByTop.set(
      child.offsetTop,
      Math.max(rowHeightsByTop.get(child.offsetTop) ?? 0, child.scrollHeight)
    );
  }

  grid.style.removeProperty("gridTemplateRows");

  const measuredMax = rowHeightsByTop.size > 0 ? Math.max(...rowHeightsByTop.values()) : 0;
  const minRowPx = readCssVarPx(calendar, "--tm-cal-row-min-height", 104);
  const uniform = Math.max(minRowPx, measuredMax);

  calendar.style.setProperty("--tm-cal-row-height", `${uniform}px`);
  return uniform;
}

function runCalendarMetricsPass(calendar: HTMLElement, grid: HTMLElement): number {
  return syncMatchCardMetrics(calendar, grid);
}

export type CalendarLayoutResult = {
  rowHeight: number;
  uiScale: number;
  matchCardHeight: number;
};

/** Filas con altura uniforme (la de la semana más alta); scroll en `.tm-app-main`. */
export function fitCalendarLayout(
  calendar: HTMLElement,
  grid: HTMLElement,
  rowCount: number
): CalendarLayoutResult | null {
  if (rowCount <= 0) return null;

  calendar.style.setProperty("--tm-cal-weeks", String(rowCount));
  calendar.style.setProperty("--tm-cal-ui-scale", "1");
  calendar.style.removeProperty("--tm-cal-row-height");
  void grid.offsetHeight;

  runCalendarMetricsPass(calendar, grid);
  syncGroupsPanelMetrics(calendar, grid);
  syncPredictionLabelMetrics(grid);

  const rowHeight = syncUniformRowHeight(calendar, grid, rowCount);
  void grid.offsetHeight;

  const matchCardHeight = runCalendarMetricsPass(calendar, grid);
  syncGroupsPanelMetrics(calendar, grid);
  syncPredictionLabelMetrics(grid);

  return { rowHeight, uiScale: 1, matchCardHeight };
}

export function resetCalendarLayout(calendar: HTMLElement): void {
  calendar.style.removeProperty("--tm-cal-ui-scale");
  calendar.style.removeProperty("--tm-cal-row-height");
  calendar.style.removeProperty("--tm-cal-match-gap");
  calendar.style.removeProperty("--tm-cal-match-card-h");
  calendar.style.removeProperty("--tm-cal-groups-pad");
  calendar.style.removeProperty("--tm-cal-groups-letter-fs");
  calendar.style.removeProperty("--tm-cal-groups-letter-w");
  calendar.style.removeProperty("--tm-cal-groups-flag");
  calendar.style.removeProperty("--tm-cal-groups-flag-gap");
  calendar.style.removeProperty("--tm-cal-groups-col-gap");
  calendar.style.removeProperty("--tm-cal-group-card-gap");
  calendar.style.removeProperty("--tm-cal-group-card-py");
  resetPredictionLabelMetrics(calendar);
}
