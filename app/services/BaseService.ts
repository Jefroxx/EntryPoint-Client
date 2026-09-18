export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, unknown>;
  body?: unknown;
}

export abstract class BaseService {
  protected authHeaders(): Record<string, string> {
    const token = useCookie<string | null>('_token').value
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
