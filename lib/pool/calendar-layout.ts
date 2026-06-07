const MIN_UI_SCALE = 0.15;
const MAX_UI_SCALE = 2.75;
const SCALE_SEARCH_ITERATIONS = 14;
const OVERFLOW_TOLERANCE_PX = 1;
const MATCH_CARD_GAP_PX = 4;
const MIN_MATCH_CARD_HEIGHT_PX = 22;
const GROUPS_EDGE_INSET_PX = 2;
const GROUPS_FLAGS_PER_ROW = 4;
const GROUPS_LIST_COLUMNS = 2;
const GROUPS_COL_GAP_PX = 3;
const GROUPS_FLAG_GAP_PX = 1;
const GROUPS_CARD_GAP_PX = 3;
const GROUPS_CARD_PAD_Y = 1;
const GROUPS_LETTER_WIDTH_RATIO = 0.1;
const GROUPS_SIZE_FIT = 0.98;
const GROUPS_FLAG_SCALE = 0.96;
const GROUPS_CARD_HEIGHT_RATIO = 0.88;
const MIN_GROUPS_FLAG_PX = 7;
const MIN_PREDICTION_FS_PX = 4;
const MAX_PREDICTION_FS_RATIO = 0.62;
const ACCESS_DOCK_GRID_GAP_PX = 3;
const MIN_ACCESS_BTN_HEIGHT_PX = 14;
const ACCESS_DOCK_HEIGHT_RATIO = 0.26;
const MIN_ACCESS_DOCK_HEIGHT_PX = 34;
const ACCESS_DOCK_ROWS = 4;
const SIDEBAR_BODY_GAP_PX = 6;

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
      ".tm-cal-day-num, .tm-cal-match-list, .tm-cal-match-card, .tm-cal-sidebar-slot, .tm-cal-sidebar-card, .tm-cal-groups-panel, .tm-cal-groups-list, .tm-cal-group-card, .tm-cal-prediction, .tm-cal-sidebar-access-dock, .tm-cal-sidebar-access-btn"
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

/** Reserva la franja inferior L-M-X para los botones de acceso (4 filas, ancho completo). */
function syncSidebarAccessDockMetrics(calendar: HTMLElement, grid: HTMLElement): void {
  const slot = grid.querySelector<HTMLElement>(".tm-cal-sidebar-slot");
  if (!slot) {
    calendar.style.removeProperty("--tm-cal-sidebar-access-dock-h");
    calendar.style.removeProperty("--tm-cal-sidebar-body-gap");
    calendar.style.removeProperty("--tm-cal-sidebar-access-grid-gap");
    calendar.style.removeProperty("--tm-cal-sidebar-access-btn-min-h");
    calendar.style.removeProperty("--tm-cal-sidebar-access-btn-fs");
    calendar.style.removeProperty("--tm-cal-sidebar-access-btn-px");
    return;
  }

  const dayNum = slot.querySelector<HTMLElement>(".tm-cal-day-num");
  const dayNumH = dayNum?.offsetHeight ?? 0;
  const bodyH = Math.max(
    0,
    slot.clientHeight - dayNumH - SIDEBAR_BODY_GAP_PX
  );
  const dockH = Math.max(
    MIN_ACCESS_DOCK_HEIGHT_PX,
    Math.floor(bodyH * ACCESS_DOCK_HEIGHT_RATIO)
  );
  const rowH = Math.max(
    12,
    Math.floor(
      (dockH - ACCESS_DOCK_GRID_GAP_PX * Math.max(0, ACCESS_DOCK_ROWS - 1)) / ACCESS_DOCK_ROWS
    )
  );
  const btnMinH = Math.max(MIN_ACCESS_BTN_HEIGHT_PX, Math.floor(rowH * 0.92));
  const btnFs = Math.max(8, Math.min(11, Math.floor(btnMinH * 0.52)));
  const btnPadX = Math.max(8, Math.floor(btnMinH * 0.45));

  calendar.style.setProperty("--tm-cal-sidebar-access-dock-h", `${dockH}px`);
  calendar.style.setProperty("--tm-cal-sidebar-body-gap", `${SIDEBAR_BODY_GAP_PX}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-grid-gap", `${ACCESS_DOCK_GRID_GAP_PX}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-btn-min-h", `${btnMinH}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-btn-fs", `${btnFs}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-btn-px", `${btnPadX}px`);
}

/** Ajusta la card de grupos a la altura real del contenido (sin relleno inferior). */
function syncSidebarCardMetrics(calendar: HTMLElement, grid: HTMLElement): void {
  const slot = grid.querySelector<HTMLElement>(".tm-cal-sidebar-slot");
  const card = slot?.querySelector<HTMLElement>(".tm-cal-sidebar-card");
  const section = slot?.querySelector<HTMLElement>(".tm-cal-groups-section");
  const title = slot?.querySelector<HTMLElement>(".tm-cal-groups-title");
  const list = slot?.querySelector<HTMLElement>(".tm-cal-groups-list");
  if (!slot || !card || !section) {
    calendar.style.removeProperty("--tm-cal-sidebar-card-h");
    calendar.style.removeProperty("--tm-cal-sidebar-card-edge-pad");
    return;
  }

  void section.offsetHeight;
  const cardRect = card.getBoundingClientRect();
  const firstGroup = list?.querySelector<HTMLElement>(".tm-cal-group-card");
  const groupCards = list?.querySelectorAll<HTMLElement>(".tm-cal-group-card");
  const lastGroup = groupCards?.[groupCards.length - 1];

  const topInset = firstGroup
    ? Math.max(0, Math.round(firstGroup.getBoundingClientRect().top - cardRect.top))
    : (title?.offsetHeight ?? 0);

  const contentBottom = lastGroup
    ? lastGroup.getBoundingClientRect().bottom
    : cardRect.top + (title?.offsetHeight ?? 0) + (list?.offsetHeight ?? 0);

  const cardH = Math.ceil(contentBottom - cardRect.top + topInset);
  calendar.style.setProperty("--tm-cal-sidebar-card-edge-pad", `${topInset}px`);
  calendar.style.setProperty("--tm-cal-sidebar-card-h", `${cardH}px`);
}

/** Escala título, letras y banderas del panel GRUPOS al tamaño de la celda fusionada. */
function syncGroupsPanelMetrics(calendar: HTMLElement, grid: HTMLElement): void {
  const panel =
    grid.querySelector<HTMLElement>(".tm-cal-sidebar-slot .tm-cal-groups-panel") ??
    grid.querySelector<HTMLElement>(".tm-cal-groups-section .tm-cal-groups-panel") ??
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
  let innerH = Math.max(0, panel.clientHeight - GROUPS_EDGE_INSET_PX * 2);

  const sidebarSlot = panel.closest<HTMLElement>(".tm-cal-sidebar-slot");
  if (sidebarSlot) {
    const body = sidebarSlot.querySelector<HTMLElement>(".tm-cal-sidebar-body");
    const title = sidebarSlot.querySelector<HTMLElement>(".tm-cal-groups-title");
    const dockH = Number.parseFloat(
      calendar.style.getPropertyValue("--tm-cal-sidebar-access-dock-h")
    );
    const resolvedDockH = Number.isFinite(dockH) && dockH > 0 ? dockH : MIN_ACCESS_DOCK_HEIGHT_PX;
    const titleH = title?.offsetHeight ?? 0;
    const topInsetReserve = titleH + GROUPS_EDGE_INSET_PX * 2;
    const maxPanelH = Math.max(
      0,
      (body?.clientHeight ?? 0) -
        resolvedDockH -
        SIDEBAR_BODY_GAP_PX -
        topInsetReserve
    );
    innerH = Math.max(0, maxPanelH - GROUPS_EDGE_INSET_PX * 2);
  } else {
    innerH = Math.max(0, panel.clientHeight - GROUPS_EDGE_INSET_PX * 2);
  }

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

export type CalendarLayoutResult = {
  rowHeight: number;
  uiScale: number;
  matchCardHeight: number;
  gridHeight: number;
};

/** Ancla el cuerpo del calendario al borde inferior del layout (justo encima de la TabBar). */
export function syncCalendarGridHeight(
  calendar: HTMLElement,
  grid: HTMLElement,
  layoutRoot: HTMLElement
): number {
  const layoutRect = layoutRoot.getBoundingClientRect();
  const calendarRect = calendar.getBoundingClientRect();
  const header = calendar.querySelector<HTMLElement>(".tm-cal-header");
  const weekdays = calendar.querySelector<HTMLElement>(".tm-cal-weekdays");
  const chromeHeight = (header?.offsetHeight ?? 0) + (weekdays?.offsetHeight ?? 0);
  const available = Math.floor(layoutRect.bottom - calendarRect.top - chromeHeight);
  const height = Math.max(0, available);

  grid.style.height = `${height}px`;
  grid.style.flex = "0 0 auto";

  return height;
}

export function resetCalendarGridHeight(grid: HTMLElement): void {
  grid.style.removeProperty("height");
  grid.style.removeProperty("flex");
}

/** Filas iguales vía CSS grid 1fr; tarjetas compartidas según el día más cargado. */
export function fitCalendarLayout(
  calendar: HTMLElement,
  grid: HTMLElement,
  rowCount: number,
  layoutRoot?: HTMLElement | null
): CalendarLayoutResult | null {
  if (rowCount <= 0) return null;

  calendar.style.setProperty("--tm-cal-weeks", String(rowCount));

  const gridHeight =
    layoutRoot != null ? syncCalendarGridHeight(calendar, grid, layoutRoot) : grid.clientHeight;

  void grid.offsetHeight;

  let uiScale = searchMaxScale(calendar, grid);

  while (uiScale > MIN_UI_SCALE && gridHasOverflow(grid)) {
    uiScale = Math.max(MIN_UI_SCALE, uiScale * 0.94);
    calendar.style.setProperty("--tm-cal-ui-scale", uiScale.toFixed(4));
    void calendar.offsetHeight;
  }

  let matchCardHeight = syncMatchCardMetrics(calendar, grid);
  syncSidebarAccessDockMetrics(calendar, grid);
  syncGroupsPanelMetrics(calendar, grid);
  syncSidebarCardMetrics(calendar, grid);
  syncPredictionLabelMetrics(grid);

  for (let pass = 0; pass < 6 && gridHasOverflow(grid); pass++) {
    uiScale = Math.max(MIN_UI_SCALE, uiScale * 0.94);
    calendar.style.setProperty("--tm-cal-ui-scale", uiScale.toFixed(4));
    void calendar.offsetHeight;
    matchCardHeight = syncMatchCardMetrics(calendar, grid);
    syncSidebarAccessDockMetrics(calendar, grid);
    syncGroupsPanelMetrics(calendar, grid);
    syncSidebarCardMetrics(calendar, grid);
    syncPredictionLabelMetrics(grid);
  }

  const rowHeight = grid.clientHeight > 0 ? grid.clientHeight / rowCount : 0;
  return { rowHeight, uiScale, matchCardHeight, gridHeight: grid.clientHeight || gridHeight };
}

export function resetCalendarLayout(calendar: HTMLElement, grid?: HTMLElement | null): void {
  calendar.style.removeProperty("--tm-cal-ui-scale");
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
  calendar.style.removeProperty("--tm-cal-sidebar-access-dock-h");
  calendar.style.removeProperty("--tm-cal-sidebar-body-gap");
  calendar.style.removeProperty("--tm-cal-sidebar-access-grid-gap");
  calendar.style.removeProperty("--tm-cal-sidebar-access-btn-min-h");
  calendar.style.removeProperty("--tm-cal-sidebar-access-btn-fs");
  calendar.style.removeProperty("--tm-cal-sidebar-access-btn-px");
  calendar.style.removeProperty("--tm-cal-sidebar-card-h");
  calendar.style.removeProperty("--tm-cal-sidebar-card-edge-pad");
  resetPredictionLabelMetrics(calendar);
  if (grid) resetCalendarGridHeight(grid);
}
