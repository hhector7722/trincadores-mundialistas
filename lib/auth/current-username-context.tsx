"use client";

import { createContext, useContext, type ReactNode } from "react";

const CurrentUsernameContext = createContext<string | null>(null);

export function CurrentUsernameProvider({
  username,
  children,
}: {
  username: string | null;
  children: ReactNode;
}) {
  return (
    <CurrentUsernameContext.Provider value={username}>
      {children}
    </CurrentUsernameContext.Provider>
  );
}

export function useCurrentUsername(): string | null {
  return useContext(CurrentUsernameContext);
}
