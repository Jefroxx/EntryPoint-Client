export abstract class BaseService {
  protected authHeaders(): Record<string, string> {
    const token = useCookie<string | null>('_token').value
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}
