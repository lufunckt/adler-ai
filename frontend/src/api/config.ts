export const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const isLocalBrowser =
  typeof window === "undefined" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

export const baseUrl = configuredBaseUrl
  ? configuredBaseUrl.replace(/\/$/, "")
  : isLocalBrowser
    ? "http://127.0.0.1:8000"
    : "";
