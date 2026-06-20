import { isFullscreenPath } from "@/lib/layout/app-shell-paths";
import { getMainTabSectionIndex, isExactMainTabRoot } from "@/lib/layout/main-tabs";

export type PageNavDirection = "push" | "pop" | "tab" | "none";

/** Subpágina con stack (no raíz de pestaña ni fullscreen). */
export function isStackSubpage(pathname: string): boolean {
  if (isFullscreenPath(pathname)) return false;
  return !isExactMainTabRoot(pathname);
}

export function resolvePageNavDirection(
  stack: string[],
  nextPath: string
): { direction: PageNavDirection; nextStack: string[] } {
  if (stack.length === 0) {
    return { direction: "none", nextStack: [nextPath] };
  }

  const current = stack[stack.length - 1]!;
  if (nextPath === current) {
    return { direction: "none", nextStack: stack };
  }

  const prevSection = getMainTabSectionIndex(current);
  const nextSection = getMainTabSectionIndex(nextPath);
  if (
    prevSection != null &&
    nextSection != null &&
    prevSection !== nextSection &&
    isExactMainTabRoot(nextPath)
  ) {
    return { direction: "tab", nextStack: [nextPath] };
  }

  const existingIdx = stack.lastIndexOf(nextPath);
  if (existingIdx >= 0 && existingIdx < stack.length - 1) {
    return { direction: "pop", nextStack: stack.slice(0, existingIdx + 1) };
  }

  return { direction: "push", nextStack: [...stack, nextPath] };
}
