// Cliente para la API de FastAPI (Railway en producción, localhost:8000 en desarrollo).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "chocofruit_token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

type PydanticError = { loc: (string | number)[]; msg: string };

function parseError(status: number, data: unknown): ApiError {
  const detail = (data as { detail?: unknown })?.detail;
  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const e of detail as PydanticError[]) {
      const key = e.loc.filter((p) => p !== "body").join(".");
      fields[key] = e.msg.replace(/^Value error, /, "");
    }
    return new ApiError(status, "Revisa los campos marcados", fields);
  }
  if (typeof detail === "string") return new ApiError(status, detail);
  if (status === 0) return new ApiError(0, "No hay conexión con el servidor");
  return new ApiError(status, `Error ${status}`);
}

/** Se dispara cuando el token expira, para que el panel vuelva al login. */
export const SESION_EXPIRADA = "chocofruit:sesion-expirada";

export async function api<T = unknown>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = init;
  const token = auth ? tokenStore.get() : null;
  const esForm = body instanceof URLSearchParams || body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      body: body === undefined ? undefined : esForm ? (body as BodyInit) : JSON.stringify(body),
      headers: {
        ...(body !== undefined && !esForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(0, "No hay conexión con el servidor");
  }

  if (res.status === 401 && token) {
    tokenStore.clear();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(SESION_EXPIRADA));
  }
  if (!res.ok) throw parseError(res.status, await res.json().catch(() => null));
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** Arma un querystring ignorando valores vacíos. */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
