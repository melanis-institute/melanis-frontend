import { readStorageJson } from "@shared/lib/storage";

const SESSION_KEY = "melanis_auth_session_v1";

interface StoredSession {
  accessToken: string;
}

interface ApiErrorBody {
  detail: string;
  error_code: string;
}

export interface ApiError {
  status: number;
  error_code: string;
  detail: string;
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "error_code" in err
  );
}

export { isApiError };

function readToken(): string | null {
  const session = readStorageJson<StoredSession | null>(SESSION_KEY, null);
  return session?.accessToken ?? null;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  buildUrl(path: string, params?: Record<string, string | number | boolean | null | undefined>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private handleError(status: number, body: ApiErrorBody): never {
    throw {
      status,
      error_code: body.error_code ?? "UNKNOWN_ERROR",
      detail: body.detail ?? "Unknown error",
    } satisfies ApiError;
  }

  private buildHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(extra);
    headers.set("Content-Type", "application/json");
    const token = readToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText, error_code: "UNKNOWN_ERROR" })) as ApiErrorBody;
      this.handleError(res.status, body);
    }
    return res.json() as Promise<T>;
  }

  async getText(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<string> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({
        detail: res.statusText,
        error_code: "UNKNOWN_ERROR",
      }))) as ApiErrorBody;
      this.handleError(res.status, body);
    }
    return res.text();
  }

  async post<T>(path: string, body?: unknown, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "POST",
      headers: this.buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText, error_code: "UNKNOWN_ERROR" })) as ApiErrorBody;
      this.handleError(res.status, errBody);
    }
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, body?: unknown, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "PATCH",
      headers: this.buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText, error_code: "UNKNOWN_ERROR" })) as ApiErrorBody;
      this.handleError(res.status, errBody);
    }
    return res.json() as Promise<T>;
  }

  async delete<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.buildHeaders(),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText, error_code: "UNKNOWN_ERROR" })) as ApiErrorBody;
      this.handleError(res.status, errBody);
    }
    return res.json() as Promise<T>;
  }
}

export function createApiClient(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
