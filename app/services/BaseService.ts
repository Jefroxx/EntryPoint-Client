import { SESSION_COOKIES, areaFromPath, type Area } from '~/utils/session'

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, unknown>;
  body?: unknown;
}

export abstract class BaseService {
  /**
   * Whose token a request carries. Services that belong to one area say so; shared ones
   * (notifications, logout) follow the page you are on, so a student tab and a librarian
   * tab each send their own token even when both are signed in.
   */
  protected area(): Area {
    return areaFromPath(useRoute().path)
  }

  protected authHeaders(): Record<string, string> {
    const token = useCookie<string | null>(SESSION_COOKIES[this.area()].token).value
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  protected apiRequest<T>(path: string, options: RequestOptions = {}) {
    const runtimeConfig = useRuntimeConfig()
    return $fetch<T>(path, {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: options.method ?? "GET",
      query: options.query,
      body: options.body as Record<string, unknown> | undefined,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    })
  }
}
