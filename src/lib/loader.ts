export const LOADER_EVENT = "dashboard:loader";

export type LoaderPayload = {
  active: boolean;
};

export function emitLoader(active: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LoaderPayload>(LOADER_EVENT, { detail: { active } })
  );
}
