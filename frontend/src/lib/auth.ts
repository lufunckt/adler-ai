import { baseUrl } from "../api/config";

export type AuthMode = "api" | "demo";

export type AuthenticatedUser = {
  email: string;
  id: string;
  name: string;
};

export type AuthSession = {
  mode: AuthMode;
  token: string | null;
  user: AuthenticatedUser;
};

type ApiAuthResponse = {
  token: string;
  user: {
    created_at: string;
    email: string;
    id: number;
    name: string;
  };
};

type ApiUserResponse = {
  created_at: string;
  email: string;
  id: number;
  name: string;
};

const AUTH_SESSION_KEY = "adler.auth.session.v1";

export const DEMO_CREDENTIALS = {
  email: "clinica.demo@adler.ai",
  password: "AdlerClinicDemo2026!"
} as const;

const DEMO_SESSION: AuthSession = {
  mode: "demo",
  token: null,
  user: {
    id: "demo-erico",
    name: "Equipe Adler Demo",
    email: DEMO_CREDENTIALS.email
  }
};

function hasApiBaseUrl() {
  return Boolean(baseUrl);
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readStoredSession() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (!canUseStorage()) {
    return;
  }

  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function buildUser(payload: ApiUserResponse): AuthenticatedUser {
  return {
    id: String(payload.id),
    name: payload.name,
    email: payload.email
  };
}

async function requestJson<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = response.statusText || "Request failed";
    try {
      const payload = await response.json();
      message = payload.detail ?? JSON.stringify(payload);
    } catch {
      message = await response.text();
    }
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

export function loadStoredSession() {
  return readStoredSession();
}

export function getAuthToken() {
  const session = readStoredSession();
  return session?.mode === "api" ? session.token : null;
}

export async function restoreSession() {
  const session = readStoredSession();
  if (!session) {
    return null;
  }

  if (session.mode === "demo") {
    return session;
  }

  if (!session.token) {
    writeStoredSession(null);
    return null;
  }

  try {
    const user = await requestJson<ApiUserResponse>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    const nextSession: AuthSession = {
      mode: "api",
      token: session.token,
      user: buildUser(user)
    };
    writeStoredSession(nextSession);
    return nextSession;
  } catch {
    writeStoredSession(null);
    return null;
  }
}

export async function loginWithCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const isSharedDemoAccount =
    normalizedEmail === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password;

  if (isSharedDemoAccount && !hasApiBaseUrl()) {
    writeStoredSession(DEMO_SESSION);
    return DEMO_SESSION;
  }

  try {
    const payload = await requestJson<ApiAuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: normalizedEmail,
        password
      })
    });

    const session: AuthSession = {
      mode: "api",
      token: payload.token,
      user: buildUser(payload.user)
    };
    writeStoredSession(session);
    return session;
  } catch (error) {
    if (isSharedDemoAccount) {
      writeStoredSession(DEMO_SESSION);
      return DEMO_SESSION;
    }
    throw error;
  }
}

export async function registerWithCredentials(
  name: string,
  email: string,
  password: string
) {
  const payload = await requestJson<ApiAuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    })
  });

  const session: AuthSession = {
    mode: "api",
    token: payload.token,
    user: buildUser(payload.user)
  };
  writeStoredSession(session);
  return session;
}

export async function logoutSession() {
  const session = readStoredSession();
  writeStoredSession(null);

  if (!session || session.mode !== "api" || !session.token) {
    return;
  }

  try {
    await requestJson<{ status: string }>("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });
  } catch {
    // Logout is best-effort because the local session is already cleared.
  }
}
