import { SESSION_COOKIES, areaFromPath } from '~/utils/session'

/**
 * Any answer of 401 to a request that carried this window's own sign-in means that sign-in is dead (it was revoked,
 * the account signed in somewhere else, the database was reset). The person is then sent to the sign-in page, with the
 * reason, instead of sitting on a page where every request fails.
 *
 * This hooks window.fetch, like the page loader does, and not $fetch: Nuxt's auto-imported $fetch is a copy of
 * globalThis.$fetch taken before plugins run, so wrapping the global never reached the services' calls (an earlier
 * version of this plugin did that, and a revoked sign-in simply stayed on screen). ofetch calls window.fetch on every
 * request, so this sees all of them, whether they go through BaseService or call $fetch directly.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const apiBase = useRuntimeConfig().public.apiBaseURL as string
  const route = useRoute()
  const tokens = {
    student: useCookie<string | null>(SESSION_COOKIES.student.token),
    librarian: useCookie<string | null>(SESSION_COOKIES.librarian.token),
  }
  const nativeFetch = window.fetch.bind(window)

  /** The bearer token a request carried, however its headers were given. */
  function bearerOf(input: RequestInfo | URL, init?: RequestInit): string | null {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    return headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || null
  }

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await nativeFetch(input, init)

    if (response.status === 401) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const area = areaFromPath(route.path)
      const token = bearerOf(input, init)

      // Only this window's own live sign-in counts: a 401 for some other token (the other portal's, a best-effort
      // logout of an abandoned session) is none of this page's business.
      if (url.startsWith(apiBase) && token && token === tokens[area].value) {
        const reason = await response.clone().json().then((body) => body?.reason as string | undefined).catch(() => undefined)
        void nuxtApp.runWithContext(() => endExpiredSession(area, reason))
      }
    }

    return response
  }
})
