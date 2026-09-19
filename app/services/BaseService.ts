import { SESSION_COOKIES, areaFromPath, type Area } from '~/utils/session'

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, unknown>;
  body?: unknown;
}

let endingSession = false

/**
 * A 401 means the token is dead (it was revoked, or the database was reset). Instead of leaving
 * every page silently empty, end that session and send the person to their own sign-in.
 */
async function endExpiredSession(area: Area) {
  if (!import.meta.client || endingSession) return

  endingSession = true
  try {
    const back = useRoute().fullPath
    useAuthSession(area).signOut()
    await navigateTo({ path: area === 'student' ? '/login' : '/librarian/login', query: { redirect: back, expired: '1' } })
  } finally {
    endingSession = false
  }
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
    const area = this.area()

    return $fetch<T>(path, {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: options.method ?? "GET",
      query: options.query,
      body: options.body as Record<string, unknown> | undefined,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
      onResponseError: ({ response }) => {
        if (response.status === 401) void endExpiredSession(area)
      },
    })
  }
}
