import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mantiene pending=true tras un cambio de pathname hasta que `children` se actualice
 * y se pinte (evita que el spinner desaparezca antes que el contenido).
 */
export function useNavigationContentPending(
  pathname: string,
  routerTransitionPending: boolean,
  children: ReactNode
): boolean {
  const [contentPending, setContentPending] = useState(false);
  const prevPathRef = useRef(pathname);
  const childrenUpdatedRef = useRef(true);

  useLayoutEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;
    childrenUpdatedRef.current = false;
    setContentPending(true);
  }, [pathname]);

  useEffect(() => {
    if (!contentPending) return;
    childrenUpdatedRef.current = true;
  }, [children, contentPending]);

  useEffect(() => {
    if (!contentPending) return;
    if (routerTransitionPending) return;
    if (!childrenUpdatedRef.current) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) setContentPending(false);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [contentPending, routerTransitionPending, children]);

  return contentPending;
}
