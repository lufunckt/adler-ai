export const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const isLocalBrowser =
  typeof window === "undefined" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// Na publicação, se VITE_API_BASE_URL não estiver definido, usamos caminhos relativos
// para permitir que o backend sirva o frontend se necessário, ou falhamos graciosamente.
export const baseUrl = configuredBaseUrl
  ? configuredBaseUrl.replace(/\/$/, "")
  : isLocalBrowser
    ? "http://127.0.0.1:8000"
    : window.location.origin; // Assume o mesmo domínio se não configurado
