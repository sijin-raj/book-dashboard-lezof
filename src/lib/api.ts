import { getToken } from "./auth";
import { emitToast } from "./toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const authToken = token ?? getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const text = await response.text();
    const preview = text.slice(0, 120);
    emitToast({
      message: "Unexpected response from server.",
      variant: "error",
    });
    throw new Error(
      `Expected JSON but received HTML/text. Check API base URL. Preview: ${preview}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Request failed";
    emitToast({ message, variant: "error" });
    throw new Error(message);
  }

  return data as T;
}
