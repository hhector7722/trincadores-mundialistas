"use client";
import { useEffect, useState } from "react";

export function TabBarDebug() {
  const [value, setValue] = useState("...");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue("--tm-tabbar-height") || "vacío");
  }, []);
  return (
    <div className="fixed top-0 left-0 z-50 bg-black text-white text-xs p-2">
      tabbar: {value}
    </div>
  );
}
