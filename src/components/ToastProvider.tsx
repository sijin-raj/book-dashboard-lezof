"use client";

import { useEffect, useState } from "react";

import { TOAST_EVENT, ToastPayload, ToastVariant } from "@/lib/toast";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

const DEFAULT_DURATION = 4000;

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (payload: ToastPayload) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = payload.duration ?? DEFAULT_DURATION;
    const toast: ToastItem = {
      id,
      message: payload.message,
      variant: payload.variant ?? "info",
      duration,
    };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, duration);
  };

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      addToast(detail);
    };
    window.addEventListener(TOAST_EVENT, handleToast as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast as EventListener);
    };
  }, []);

  return (
    <>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
