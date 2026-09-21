import { areaFromPath } from '~/utils/session'

// Some requests go through BaseService.apiRequest, many older ones call $fetch directly. Wrapping
// the global $fetch once means every call to the API gets the same "your session ended" handling.
export default defineNuxtPlugin(() => {
  const apiBase = useRuntimeConfig().public.apiBaseURL as string
  const original = globalThis.$fetch

  globalThis.$fetch = original.create({
    onResponseError({ options, response }) {
      if (response.status === 401 && options.baseURL === apiBase) {
        void endExpiredSession(areaFromPath(useRoute().path))
      }
    },
  }) as typeof $fetch
})
