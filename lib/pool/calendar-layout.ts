import { readMainContentBottom } from "@/lib/layout/viewport-chrome";

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
const GROUPS_FLAG_GAP_PX = 3;
const GROUPS_CARD_GAP_PX = 3;
const GROUPS_CARD_PAD_Y = 1;
const GROUPS_LETTER_WIDTH_RATIO = 0.1;
const GROUPS_SIZE_FIT = 0.98;
const GROUPS_FLAG_SCALE = 0.96;
const GROUPS_CARD_HEIGHT_RATIO = 1;
const MIN_GROUPS_FLAG_PX = 7;
const MIN_PREDICTION_FS_PX = 4;
const MAX_PREDICTION_FS_RATIO = 0.62;
const ACCESS_DOCK_GRID_GAP_PX = 9;
const ACCESS_DOCK_COLS = 1;
const ACCESS_DOCK_ROWS = 1;
const ACCESS_DOCK_GRID_WIDTH_RATIO = 0.92;
const ACCESS_DOCK_LONGEST_LABEL = "GUÍA CALENDARIO";
const ACCESS_CARD_INSET_PX = 4;
const ACCESS_CARD_EXTRA_VPAD_PX = 2;
const ACCESS_BTN_PAD_Y_PX = 2;
const ACCESS_BTN_LINE_HEIGHT = 1.1;
const MAX_ACCESS_BTN_FS_PX = 13;
const ACCESS_BTN_ROW_HEIGHT_RATIO = 0.46;
const ACCESS_BTN_PAD_Y_RATIO = 0.14;
const ACCESS_DOCK_GAP_SCALE_RATIO = 0.1;
const MAX_ACCESS_DOCK_GRID_GAP_PX = 12;
const SIDEBAR_BODY_GAP_PX = 6;
const SIDEBAR_CARD_BOTTOM_PAD_PX = 6;

/** Partido que marca el final inferior de la card lateral del calendario. */
export const CALENDAR_SIDEBAR_CARD_ANCHOR = {
  day: 14,
  kickoffHour: "22:00",
  groupCode: "F",
} as const;

export const SIDEBAR_CARD_ANCHOR_ATTR = "data-sidebar-card-anchor";

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
      ".tm-cal-day-num, .tm-cal-match-list, .tm-cal-match-card, .tm-cal-sidebar-slot, .tm-cal-sidebar-card, .tm-cal-groups-block, .tm-cal-groups-panel, .tm-cal-groups-list, .tm-cal-group-card, .tm-cal-prediction, .tm-cal-guide-access, .tm-cal-guide-btn, .tm-cal-sidebar-access-dock, .tm-cal-sidebar-access-btn"
    );
    for (const node of inner) {
      if (node instanceof HTMLElement && elementOverflows(node)) return true;
    }
  }
  return false;
}

function searchMaxScale(calendar: HTMLElement, grid: HTMLElement): number {
  const isAutoRows = calendar.classList.contains("tm-porra-calendar--auto-rows");
  let lo = MIN_UI_SCALE;
  let hi = isAutoRows ? 1.0 : MAX_UI_SCALE; // No escalar hacia arriba si no hay límite vertical
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

  // Usar siempre al menos 4 partidos (el máximo del torneo en fase de grupos)
  // para que las tarjetas de Julio (con menos partidos) sean idénticas a las de Junio.
  const layoutMatchCount = Math.max(4, matchCount);
  const totalGap = MATCH_CARD_GAP_PX * Math.max(0, layoutMatchCount - 1);
  const cardHeight = Math.max(
    MIN_MATCH_CARD_HEIGHT_PX,
    Math.floor((listHeight - totalGap) / layoutMatchCount)
  );

  calendar.style.setProperty("--tm-cal-match-card-h", `${cardHeight}px`);
  return cardHeight;
}

function measureAccessLabelWidth(text: string, fontSizePx: number): number {
  if (typeof document === "undefined") {
    return text.length * fontSizePx * 0.55;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return text.length * fontSizePx * 0.55;
  }

  ctx.font = `700 ${fontSizePx}px system-ui, -apple-system, sans-serif`;
  return ctx.measureText(text).width;
}

function fitAccessButtonFontSize(cellW: number, padX: number): number {
  const minFs = 7;
  const maxFs = 11;
  const availableW = Math.max(0, cellW - padX * 2);

  for (let fs = maxFs; fs >= minFs; fs--) {
    if (measureAccessLabelWidth(ACCESS_DOCK_LONGEST_LABEL, fs) <= availableW) {
      return fs;
    }
  }

  return minFs;
}

function accessButtonVisualHeight(fontSizePx: number, padYPx = ACCESS_BTN_PAD_Y_PX): number {
  return Math.ceil(fontSizePx * ACCESS_BTN_LINE_HEIGHT + padYPx * 2);
}

function resolveAccessDockButtonMetrics(
  cellW: number,
  rowH: number
): { btnFs: number; btnPadX: number; btnPy: number; gridGap: number } {
  const btnPadX = Math.max(3, Math.min(10, Math.floor(cellW * 0.08)));
  const gridGap = Math.min(
    MAX_ACCESS_DOCK_GRID_GAP_PX,
    Math.max(ACCESS_DOCK_GRID_GAP_PX, Math.floor(rowH * ACCESS_DOCK_GAP_SCALE_RATIO))
  );
  let btnFs = Math.min(
    MAX_ACCESS_BTN_FS_PX,
    Math.max(7, Math.floor(rowH * ACCESS_BTN_ROW_HEIGHT_RATIO))
  );
  btnFs = Math.min(btnFs, fitAccessButtonFontSize(cellW, btnPadX));
  const btnPy = Math.max(ACCESS_BTN_PAD_Y_PX, Math.floor(rowH * ACCESS_BTN_PAD_Y_RATIO));
  return { btnFs, btnPadX, btnPy, gridGap };
}

function computeAccessDockHeight(
  btnFs: number,
  btnPy: number,
  gridGap: number
): number {
  const btnVisualH = accessButtonVisualHeight(btnFs, btnPy);
  const gridH =
    btnVisualH * ACCESS_DOCK_ROWS + gridGap * Math.max(0, ACCESS_DOCK_ROWS - 1);
  return ACCESS_CARD_INSET_PX * 2 + ACCESS_CARD_EXTRA_VPAD_PX * 2 + gridH;
}

/** Reserva la franja inferior L-M-X para el botón de acceso. */
function syncSidebarAccessDockMetrics(
  calendar: HTMLElement,
  grid: HTMLElement,
  targetDockH?: number
): number {
  const slot = grid.querySelector<HTMLElement>(".tm-cal-sidebar-slot");
  if (!slot) {
    calendar.style.removeProperty("--tm-cal-sidebar-access-dock-h");
    calendar.style.removeProperty("--tm-cal-sidebar-body-gap");
    calendar.style.removeProperty("--tm-cal-sidebar-access-pad");
    calendar.style.removeProperty("--tm-cal-sidebar-access-grid-gap");
    calendar.style.removeProperty("--tm-cal-sidebar-access-btn-py");
    calendar.style.removeProperty("--tm-cal-sidebar-access-btn-fs");
    calendar.style.removeProperty("--tm-cal-sidebar-access-btn-px");
    calendar.style.removeProperty("--tm-cal-sidebar-access-grid-w");
    return 0;
  }

  const slotWidth = slot.clientWidth;
  const innerW = Math.max(0, slotWidth - ACCESS_CARD_INSET_PX * 2);
  const gridW = Math.max(0, Math.floor(innerW * ACCESS_DOCK_GRID_WIDTH_RATIO));
  const cellW = Math.max(
    0,
    Math.floor(
      (gridW - ACCESS_DOCK_GRID_GAP_PX * Math.max(0, ACCESS_DOCK_COLS - 1)) /
        ACCESS_DOCK_COLS
    )
  );

  let btnFs: number;
  let btnPadX: number;
  let btnPy: number;
  let gridGap: number;
  let dockH: number;

  if (targetDockH != null && targetDockH > 0) {
    const innerH = Math.max(
      0,
      targetDockH - ACCESS_CARD_INSET_PX * 2 - ACCESS_CARD_EXTRA_VPAD_PX * 2
    );
    const rowH = Math.max(
      0,
      (innerH - ACCESS_DOCK_GRID_GAP_PX * Math.max(0, ACCESS_DOCK_ROWS - 1)) /
        ACCESS_DOCK_ROWS
    );
    ({ btnFs, btnPadX, btnPy, gridGap } = resolveAccessDockButtonMetrics(cellW, rowH));
    dockH = computeAccessDockHeight(btnFs, btnPy, gridGap);
  } else {
    btnPadX = Math.max(3, Math.min(8, Math.floor(cellW * 0.08)));
    btnFs = fitAccessButtonFontSize(cellW, btnPadX);
    btnPy = ACCESS_BTN_PAD_Y_PX;
    gridGap = ACCESS_DOCK_GRID_GAP_PX;
    dockH = computeAccessDockHeight(btnFs, btnPy, gridGap);
  }

  calendar.style.setProperty("--tm-cal-sidebar-access-dock-h", `${dockH}px`);
  calendar.style.setProperty("--tm-cal-sidebar-body-gap", `${SIDEBAR_BODY_GAP_PX}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-pad", `${ACCESS_CARD_INSET_PX}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-grid-gap", `${gridGap}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-btn-py", `${btnPy}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-btn-fs", `${btnFs}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-btn-px", `${btnPadX}px`);
  calendar.style.setProperty("--tm-cal-sidebar-access-grid-w", `${gridW}px`);

  void slot.offsetHeight;
  const buttons = slot.querySelectorAll<HTMLElement>(
    ".tm-cal-sidebar-access-btn, .tm-cal-guide-btn"
  );
  while (btnFs > 7 && buttons.length > 0) {
    let clipped = false;
    for (const btn of buttons) {
      if (elementOverflows(btn)) {
        clipped = true;
        break;
      }
    }
    if (!clipped) break;
    btnFs -= 1;
    calendar.style.setProperty("--tm-cal-sidebar-access-btn-fs", `${btnFs}px`);
    void slot.offsetHeight;
  }

  return dockH;
}

/** Alinea la card con el inicio de las tarjetas de partido (sin centrado vertical). */
function syncSidebarAccessSpacing(calendar: HTMLElement, grid: HTMLElement): void {
  const slot = grid.querySelector<HTMLElement>(".tm-cal-sidebar-slot");
  if (!slot) {
    calendar.style.removeProperty("--tm-cal-sidebar-card-offset-top");
    calendar.style.removeProperty("--tm-cal-sidebar-card-offset-bottom");
    return;
  }

  calendar.style.setProperty("--tm-cal-sidebar-card-offset-top", "0px");
  calendar.style.setProperty("--tm-cal-sidebar-card-offset-bottom", "0px");
}

/** Reserva mínima para guía + acceso bajo el panel de grupos. */
function getMinSidebarFooterReserve(): number {
  const cellW = 48;
  const { btnFs, btnPadX, btnPy, gridGap } = resolveAccessDockButtonMetrics(cellW, 18);
  void btnPadX;
  const dockH = computeAccessDockHeight(btnFs, btnPy, gridGap);
  return dockH * 2;
}

function findSidebarAnchorMatchCard(grid: HTMLElement): HTMLElement | null {
  return grid.querySelector<HTMLElement>(`.tm-cal-match-card[${SIDEBAR_CARD_ANCHOR_ATTR}]`);
}

function measureSidebarAnchorMatchBottom(grid: HTMLElement): number | null {
  const anchor = findSidebarAnchorMatchCard(grid);
  if (!anchor) return null;
  return anchor.getBoundingClientRect().bottom;
}

/** Altura de la card alineada con el partido ancla (día 14, 22:00, grupo F). */
function syncSidebarCardMetrics(calendar: HTMLElement, grid: HTMLElement): void {
  const slot = grid.querySelector<HTMLElement>(".tm-cal-sidebar-slot");
  const body = slot?.querySelector<HTMLElement>(".tm-cal-sidebar-body");

  if (!slot || !body) {
    calendar.style.removeProperty("--tm-cal-sidebar-card-h");
    calendar.style.removeProperty("--tm-cal-sidebar-card-bottom-pad");
    return;
  }

  calendar.style.setProperty("--tm-cal-sidebar-card-bottom-pad", `${SIDEBAR_CARD_BOTTOM_PAD_PX}px`);

  let cardHeight = body.clientHeight;
  const refBottom = measureSidebarAnchorMatchBottom(grid);
  if (refBottom != null) {
    const bodyTop = body.getBoundingClientRect().top;
    const alignedHeight = Math.floor(refBottom - bodyTop);
    if (alignedHeight > 0) {
      cardHeight = Math.min(body.clientHeight, alignedHeight);
    }
  }

  calendar.style.setProperty("--tm-cal-sidebar-card-h", `${cardHeight}px`);
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
    const groupsBlock = sidebarSlot.querySelector<HTMLElement>(".tm-cal-groups-block");
    if (groupsBlock && groupsBlock.clientHeight > 0) {
      innerH = Math.max(0, groupsBlock.clientHeight - GROUPS_EDGE_INSET_PX * 2);
    } else {
      const body = sidebarSlot.querySelector<HTMLElement>(".tm-cal-sidebar-body");
      const title = sidebarSlot.querySelector<HTMLElement>(".tm-cal-groups-title");
      const minDockReserve = getMinSidebarFooterReserve();
      const titleH = title?.offsetHeight ?? 0;
      const card = sidebarSlot.querySelector<HTMLElement>(".tm-cal-sidebar-card");
      const cardH = card?.clientHeight ?? body?.clientHeight ?? 0;
      const maxPanelH = Math.max(
        0,
        cardH - minDockReserve - titleH - SIDEBAR_CARD_BOTTOM_PAD_PX
      );
      innerH = Math.max(0, maxPanelH - GROUPS_EDGE_INSET_PX * 2);
    }
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

export function resetPredictionLabelMetrics(root: ParentNode): void {
  for (const label of root.querySelectorAll<HTMLElement>(".tm-cal-prediction")) {
    label.style.removeProperty("font-size");
    label.style.removeProperty("max-width");
  }
}

/** Escala cada pronóstico al máximo tamaño que cabe entre las banderas sin truncar. */
export function fitPredictionLabel(label: HTMLElement): void {
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

/** Deja que el grid ocupe el espacio restante del calendario vía flex. */
function prepareCalendarGridFlex(grid: HTMLElement): void {
  grid.style.removeProperty("height");
  grid.style.flex = "1 1 0%";
  grid.style.minHeight = "0";
}

/** Deja que el grid llene el calendario vía flex; devuelve altura medida para el escalado. */
export function syncCalendarGridHeight(
  calendar: HTMLElement,
  grid: HTMLElement,
  layoutRoot: HTMLElement
): number {
  void layoutRoot;
  calendar.style.flex = "1 1 0%";
  calendar.style.minHeight = "0";
  prepareCalendarGridFlex(grid);
  void calendar.offsetHeight;
  void grid.offsetHeight;

  const header = calendar.querySelector<HTMLElement>(".tm-cal-header");
  const weekdays = calendar.querySelector<HTMLElement>(".tm-cal-weekdays");
  const chromeHeight = (header?.offsetHeight ?? 0) + (weekdays?.offsetHeight ?? 0);

  let height = Math.max(0, calendar.clientHeight - chromeHeight);

  if (height <= 0) {
    const contentBottom = readMainContentBottom();
    const gridTop = grid.getBoundingClientRect().top;
    height = Math.max(0, Math.floor(contentBottom - gridTop));
  }

  grid.style.removeProperty("height");
  grid.style.flex = "1 1 0%";
  grid.style.minHeight = "0";
  void grid.offsetHeight;

  return grid.clientHeight || height;
}

export function resetCalendarGridHeight(grid: HTMLElement, layoutRoot?: HTMLElement | null): void {
  void layoutRoot;
  grid.style.removeProperty("height");
  grid.style.removeProperty("flex");
  grid.style.removeProperty("min-height");
}

/** Filas iguales vía CSS grid 1fr; tarjetas compartidas según el día más cargado. */
export function fitCalendarLayout(
  calendar: HTMLElement,
  grid: HTMLElement,
  rowCount: number,
  layoutRoot?: HTMLElement | null
): CalendarLayoutResult | null {
  if (rowCount <= 0) return null;

  const isAutoRows = calendar.classList.contains("tm-porra-calendar--auto-rows");
  const simulateJune = isAutoRows && layoutRoot != null;
  const siblingsToHide: HTMLElement[] = [];

  if (simulateJune) {
    calendar.classList.remove("tm-porra-calendar--auto-rows");
    calendar.classList.remove("shrink-0");
    calendar.classList.add("flex-1");

    let sibling = calendar.nextElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLElement && sibling.style.display !== "none") {
        siblingsToHide.push(sibling);
        sibling.style.display = "none";
      }
      sibling = sibling.nextElementSibling;
    }
    sibling = calendar.previousElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLElement && sibling.style.display !== "none") {
        siblingsToHide.push(sibling);
        sibling.style.display = "none";
      }
      sibling = sibling.previousElementSibling;
    }
  }

  const effectiveRowCount = simulateJune ? 5 : rowCount;
  calendar.style.setProperty("--tm-cal-weeks", String(effectiveRowCount));

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
  syncSidebarAccessSpacing(calendar, grid);
  syncSidebarCardMetrics(calendar, grid);
  syncGroupsPanelMetrics(calendar, grid);
  syncSidebarAccessDockMetrics(calendar, grid);
  syncGroupsPanelMetrics(calendar, grid);
  syncPredictionLabelMetrics(grid);

  for (let pass = 0; pass < 6 && gridHasOverflow(grid); pass++) {
    uiScale = Math.max(MIN_UI_SCALE, uiScale * 0.94);
    calendar.style.setProperty("--tm-cal-ui-scale", uiScale.toFixed(4));
    void calendar.offsetHeight;
    matchCardHeight = syncMatchCardMetrics(calendar, grid);
    syncSidebarAccessSpacing(calendar, grid);
    syncSidebarCardMetrics(calendar, grid);
    syncGroupsPanelMetrics(calendar, grid);
    syncSidebarAccessDockMetrics(calendar, grid);
    syncGroupsPanelMetrics(calendar, grid);
    syncPredictionLabelMetrics(grid);
  }

  if (simulateJune) {
    calendar.classList.add("tm-porra-calendar--auto-rows");
    calendar.classList.add("shrink-0");
    calendar.classList.remove("flex-1");
    calendar.style.setProperty("--tm-cal-weeks", String(rowCount));
    
    for (const sibling of siblingsToHide) {
      sibling.style.display = "";
    }
    void calendar.offsetHeight;
  }

  const rowHeight = grid.clientHeight > 0 ? grid.clientHeight / rowCount : 0;
  return { rowHeight, uiScale, matchCardHeight, gridHeight: grid.clientHeight || gridHeight };
}

const GUIDE_PREVIEW_FALLBACK_CELL_WIDTH_PX = 52;
const GUIDE_PREVIEW_FALLBACK_CARD_HEIGHT_PX = 28;

type GuidePreviewMetrics = {
  matchCardH: string;
  uiScale: string | null;
  matchGap: string | null;
  previewW: string;
  sidebarHeadingFs: string;
};

function readGuidePreviewMetrics(): GuidePreviewMetrics {
  const liveCalendar = document.querySelector<HTMLElement>(
    ".tm-porra-calendar:not(.tm-cal-guide-preview)"
  );
  const liveComputed = liveCalendar ? getComputedStyle(liveCalendar) : null;

  const inlineCardH = liveCalendar?.style.getPropertyValue("--tm-cal-match-card-h").trim();
  const computedCardH = liveComputed?.getPropertyValue("--tm-cal-match-card-h").trim();
  const matchCardH = inlineCardH || computedCardH || `${GUIDE_PREVIEW_FALLBACK_CARD_HEIGHT_PX}px`;

  const refCell = liveCalendar?.querySelector<HTMLElement>(".tm-cal-cell--matches");
  const refCard = liveCalendar?.querySelector<HTMLElement>(".tm-cal-match-card");
  const cellWidth =
    refCard?.clientWidth ?? refCell?.clientWidth ?? GUIDE_PREVIEW_FALLBACK_CELL_WIDTH_PX;

  const liveHeadingFs = liveComputed?.getPropertyValue("--tm-cal-sidebar-heading-fs").trim();
  const sidebarHeadingFs =
    liveHeadingFs && refCell && Math.abs(refCell.clientWidth - cellWidth) < 2
      ? liveHeadingFs
      : `${Math.max(6, Math.min(8, cellWidth * 0.016))}px`;

  return {
    matchCardH,
    uiScale: liveComputed?.getPropertyValue("--tm-cal-ui-scale").trim() || null,
    matchGap: liveComputed?.getPropertyValue("--tm-cal-match-gap").trim() || null,
    previewW: `${cellWidth}px`,
    sidebarHeadingFs,
  };
}

function applyGuidePreviewMetrics(previewCalendar: HTMLElement, metrics: GuidePreviewMetrics): void {
  previewCalendar.style.setProperty("--tm-cal-match-card-h", metrics.matchCardH);
  previewCalendar.style.setProperty("--tm-cal-guide-preview-w", metrics.previewW);
  previewCalendar.style.setProperty("--tm-cal-sidebar-heading-fs", metrics.sidebarHeadingFs);

  if (metrics.uiScale) {
    previewCalendar.style.setProperty("--tm-cal-ui-scale", metrics.uiScale);
  }
  if (metrics.matchGap) {
    previewCalendar.style.setProperty("--tm-cal-match-gap", metrics.matchGap);
  }

  resetPredictionLabelMetrics(previewCalendar);
  for (const label of previewCalendar.querySelectorAll<HTMLElement>(".tm-cal-prediction")) {
    fitPredictionLabel(label);
  }
}

/** Réplica en guía modal: copia métricas del calendario visible y ajusta pronósticos. */
export function syncCalendarGuidePreview(previewCalendar: HTMLElement): void {
  applyGuidePreviewMetrics(previewCalendar, readGuidePreviewMetrics());
}

/** Sincroniza todas las miniaturas de la guía (cada una necesita su propio fit de marcador). */
export function syncAllCalendarGuidePreviews(root: ParentNode): void {
  const metrics = readGuidePreviewMetrics();
  for (const preview of root.querySelectorAll<HTMLElement>(".tm-cal-guide-preview")) {
    applyGuidePreviewMetrics(preview, metrics);
  }
}

export function resetCalendarLayout(
  calendar: HTMLElement,
  grid?: HTMLElement | null,
  layoutRoot?: HTMLElement | null
): void {
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
  calendar.style.removeProperty("--tm-cal-sidebar-access-pad");
  calendar.style.removeProperty("--tm-cal-sidebar-access-grid-gap");
  calendar.style.removeProperty("--tm-cal-sidebar-access-btn-py");
  calendar.style.removeProperty("--tm-cal-sidebar-access-btn-fs");
  calendar.style.removeProperty("--tm-cal-sidebar-access-btn-px");
  calendar.style.removeProperty("--tm-cal-sidebar-access-grid-w");
  calendar.style.removeProperty("--tm-cal-sidebar-card-h");
  calendar.style.removeProperty("--tm-cal-sidebar-card-bottom-pad");
  calendar.style.removeProperty("--tm-cal-sidebar-card-offset-top");
  calendar.style.removeProperty("--tm-cal-sidebar-card-offset-bottom");
  resetPredictionLabelMetrics(calendar);
  if (grid) resetCalendarGridHeight(grid, layoutRoot);
}
