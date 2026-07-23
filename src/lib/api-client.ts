/**
 * Thin API client — wraps fetch with base URL, auth header injection,
 * and automatic token refresh on 401.
 *
 * Task 34.1 — Requirements: 24.2, 24.4
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

// ---------------------------------------------------------------------------
// Token storage (in-memory only — never localStorage)
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ---------------------------------------------------------------------------
// Refresh callback — set by auth context to avoid circular imports
// ---------------------------------------------------------------------------
let _refreshFn: (() => Promise<string | null>) | null = null;

export function setRefreshFn(fn: () => Promise<string | null>): void {
  _refreshFn = fn;
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------
export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  // On 401, attempt one token refresh then retry
  if (response.status === 401 && _refreshFn) {
    const newToken = await _refreshFn();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw Object.assign(new Error(error.detail ?? "Request failed"), {
      status: response.status,
      data: error,
    });
  }

  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------
export const get = <T>(path: string) => request<T>(path, { method: "GET" });
export const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const del = <T>(path: string) => request<T>(path, { method: "DELETE" });
