"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingCenter } from "@/components/ui/spinner";

type NavigationLoadingContextValue = {
  navigate: (href: string) => void;
  navigateTab: (href: string) => void;
  setNavigating: (active: boolean) => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null);

function isSameAppPath(currentPath: string, nextHref: string) {
  try {
    const next = new URL(nextHref, window.location.href);
    const current = new URL(currentPath, window.location.href);
    return (
      next.origin === current.origin &&
      next.pathname + next.search + next.hash === current.pathname + current.search + current.hash
    );
  } catch {
    return false;
  }
}

function shouldStartNavigation(currentPath: string, anchor: HTMLAnchorElement) {
  if (anchor.getAttribute("target") === "_blank") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    return !isSameAppPath(currentPath, url.pathname + url.search + url.hash);
  } catch {
    return false;
  }
}

export function useAppNavigation() {
  const context = useContext(NavigationLoadingContext);
  const router = useRouter();

  return {
    navigate: context?.navigate ?? ((href: string) => router.push(href)),
    navigateTab: context?.navigateTab ?? ((href: string) => router.push(href)),
    setNavigating: context?.setNavigating ?? (() => undefined),
  };
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [isPending, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      if (isSameAppPath(pathnameRef.current, href)) return;
      setNavigating(true);
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const navigateTab = useCallback(
    (href: string) => {
      if (isSameAppPath(pathnameRef.current, href)) return;
      router.replace(href, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    pathnameRef.current = pathname;
    setNavigating(false);
  }, [pathname]);

  const handleCaptureClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!shouldStartNavigation(pathnameRef.current, anchor)) return;

    setNavigating(true);
  }, []);

  /* Solo navegación por enlace fuera de tabs; sin overlay para evitar flash visual. */
  const showOverlay = false;

  return (
    <NavigationLoadingContext.Provider value={{ navigate, navigateTab, setNavigating }}>
      <div className="contents" onClickCapture={handleCaptureClick}>
        {children}
      </div>
      {showOverlay ? (
        <div className="tm-nav-loading-overlay" aria-busy="true" aria-live="polite">
          <LoadingCenter />
        </div>
      ) : null}
    </NavigationLoadingContext.Provider>
  );
}
