"use client";

import { useEffect, useMemo, useState } from "react";

import { LOADER_EVENT, LoaderPayload } from "@/lib/loader";

export default function LoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeCount, setActiveCount] = useState(0);
  const isActive = useMemo(() => activeCount > 0, [activeCount]);

  useEffect(() => {
    const handleLoader = (event: Event) => {
      const detail = (event as CustomEvent<LoaderPayload>).detail;
      if (!detail) return;
      setActiveCount((prev) =>
        detail.active ? prev + 1 : Math.max(0, prev - 1)
      );
    };
    window.addEventListener(LOADER_EVENT, handleLoader as EventListener);
    return () => {
      window.removeEventListener(LOADER_EVENT, handleLoader as EventListener);
    };
  }, []);

  return (
    <>
      {children}
      {isActive ? (
        <div className="dashboard-loader" role="status" aria-live="polite">
          <div className="dashboard-loader-spinner" />
        </div>
      ) : null}
    </>
  );
}
