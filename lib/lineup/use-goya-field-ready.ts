"use client";

import { useCallback, useState } from "react";

/** Cache de sesión: el asset del campo es único para toda la app. */
let goyaFieldLoaded = false;

export function useGoyaFieldReady() {
  const [ready, setReady] = useState(goyaFieldLoaded);

  const markReady = useCallback(() => {
    if (!goyaFieldLoaded) {
      goyaFieldLoaded = true;
    }
    setReady(true);
  }, []);

  return { fieldReady: ready, markFieldReady: markReady };
}
