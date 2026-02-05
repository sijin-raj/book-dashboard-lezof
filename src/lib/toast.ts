export type ToastVariant = "success" | "error" | "info";

export type ToastPayload = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

export const TOAST_EVENT = "dashboard:toast";

export function emitToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }));
}
