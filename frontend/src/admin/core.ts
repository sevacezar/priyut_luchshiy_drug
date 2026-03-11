import type {
  AuthProvider,
  BaseRecord,
  CrudFilter,
  CrudFilters,
  CrudSort,
  CrudSorting,
  DataProvider,
} from "@refinedev/core";
import { API_BASE_URL } from "@/config";

const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const USER_KEY = "admin_user";

export interface AdminIdentity {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface AdminUser extends AdminIdentity {
  created_at: string;
  updated_at: string;
}

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AdminIdentity;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

function readStorage<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function writeStorage(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredIdentity() {
  return readStorage<AdminIdentity>(USER_KEY);
}

function persistSession(payload: LoginResponse | { access_token: string; refresh_token: string; user?: AdminIdentity }) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
  if (payload.user) {
    writeStorage(USER_KEY, payload.user);
  }
}

export function clearSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function extractErrorMessage(rawText: string, fallback: string) {
  if (!rawText.trim()) return fallback;

  try {
    const parsed = JSON.parse(rawText) as { detail?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail.trim();
    }
  } catch {
    // Plain text response.
  }

  return rawText.trim();
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: { retryWithRefresh?: boolean; auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && options.retryWithRefresh !== false && getRefreshToken()) {
    const refreshed = await refreshSession().catch(() => false);
    if (refreshed) {
      return requestJson<T>(path, init, { ...options, retryWithRefresh: false });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      extractErrorMessage(text, `Request failed with status ${response.status}`),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return false;
  }

  const response = await requestJson<RefreshResponse>(
    "/api/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
    { auth: false, retryWithRefresh: false },
  );

  persistSession(response);
  return true;
}

export async function fetchCurrentIdentity() {
  const user = await requestJson<AdminIdentity>("/api/auth/me");
  if (!user.is_admin) {
    clearSession();
    throw new Error("Недостаточно прав для доступа к админке");
  }
  writeStorage(USER_KEY, user);
  return user;
}

export const authProvider: AuthProvider = {
  login: async (params: { email: string; password: string }) => {
    let response: LoginResponse;
    try {
      response = await requestJson<LoginResponse>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: params.email,
            password: params.password,
          }),
        },
        { auth: false, retryWithRefresh: false },
      );
    } catch (cause) {
      const error = cause as ApiError;
      let message = "Не удалось выполнить вход";

      if (error.statusCode === 401) {
        message = "Неверная почта или пароль";
      } else if (error.statusCode === 403) {
        message = "Доступ запрещен";
      } else if (error.statusCode === 400) {
        message = error.message || "Проверьте корректность введенных данных";
      } else if (error.message) {
        message = error.message;
      }

      return {
        success: false,
        error: {
          message,
          name: "LoginError",
        },
      };
    }

    if (!response.user.is_admin) {
      clearSession();
      return {
        success: false,
        error: {
          message: "Доступ разрешен только администраторам",
          name: "Forbidden",
        },
      };
    }

    persistSession(response);
    return {
      success: true,
      redirectTo: "/admin/pets",
    };
  },
  logout: async () => {
    clearSession();
    return {
      success: true,
      redirectTo: "/admin/login",
    };
  },
  check: async () => {
    try {
      if (!getAccessToken() && !getRefreshToken()) {
        return { authenticated: false, redirectTo: "/admin/login" };
      }

      await fetchCurrentIdentity();
      return { authenticated: true };
    } catch {
      clearSession();
      return { authenticated: false, redirectTo: "/admin/login" };
    }
  },
  getIdentity: async () => {
    const stored = getStoredIdentity();
    if (stored) {
      return stored;
    }
    return fetchCurrentIdentity();
  },
  onError: async (error: Error) => {
    if ((error as ApiError).statusCode === 401) {
      clearSession();
      return {
        logout: true,
        redirectTo: "/admin/login",
      };
    }
    return { error };
  },
};

function filterValue(filters: CrudFilters, field: string) {
  return filters.find(
    (filter): filter is CrudFilter & { field: string; value: unknown } =>
      "field" in filter && filter.field === field,
  )?.value;
}

function sorterValue(sorters: CrudSorting | undefined) {
  const first = sorters?.[0] as CrudSort | undefined;
  if (!first) return undefined;
  return `${first.order === "desc" ? "-" : ""}${first.field}`;
}

function buildQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
      return;
    }
    search.set(key, String(value));
  });
  return search.toString();
}

function mapListParams(resource: string, params: { pagination?: { current?: number; pageSize?: number }; filters?: CrudFilters; sorters?: CrudSorting }) {
  const current = params.pagination?.current ?? 1;
  const pageSize = params.pagination?.pageSize ?? 10;
  const query: Record<string, unknown> = {
    skip: (current - 1) * pageSize,
    limit: pageSize,
    order_by: sorterValue(params.sorters),
  };

  if (resource === "users") {
    query.search_query = filterValue(params.filters ?? [], "search_query");
    query.is_admin = filterValue(params.filters ?? [], "is_admin");
    query.is_active = filterValue(params.filters ?? [], "is_active");
  }

  if (resource === "pets") {
    query.search_query = filterValue(params.filters ?? [], "search_query");
    query.status = filterValue(params.filters ?? [], "status");
    query.animal_type = filterValue(params.filters ?? [], "animal_type");
    query.gender = filterValue(params.filters ?? [], "gender");
    query.groups = filterValue(params.filters ?? [], "groups");
  }

  return query;
}

export const dataProvider: DataProvider = {
  getApiUrl: () => API_BASE_URL,
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["getList"]>[0],
  ) => {
    const query = buildQuery(mapListParams(params.resource, params));
    const response = await requestJson<{ items: TData[]; total_count: number }>(
      `/api/${params.resource}${query ? `?${query}` : ""}`,
    );
    return {
      data: response.items,
      total: response.total_count,
    };
  },
  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["getOne"]>[0],
  ) => {
    const response = await requestJson<TData>(`/api/${params.resource}/${params.id}`);
    return { data: response };
  },
  create: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["create"]>[0],
  ) => {
    const response = await requestJson<TData>(`/api/${params.resource}`, {
      method: "POST",
      body: JSON.stringify(params.variables),
    });
    return { data: response };
  },
  update: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["update"]>[0],
  ) => {
    const response = await requestJson<TData>(`/api/${params.resource}/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify(params.variables),
    });
    return { data: response };
  },
  deleteOne: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["deleteOne"]>[0],
  ) => {
    await requestJson<void>(`/api/${params.resource}/${params.id}`, {
      method: "DELETE",
    });
    return { data: { id: params.id } as TData };
  },
};
