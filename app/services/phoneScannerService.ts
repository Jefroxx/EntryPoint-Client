import { BaseService } from "~/services/BaseService";

export interface PhonePairing {
  code: string;
  expiresAt: string;
  /** The address the server is reached on (its PORTAL_URL: the real domain when hosted): where the phone has to go. */
  portalUrl?: string;
}

export interface PhoneScan {
  code: string;
  /** Unix time the phone sent it. */
  at: number;
}

export interface PhoneScansResponse {
  scans: PhoneScan[];
  phoneConnected: boolean;
}

/** Who is asking for the phone's scans: a Checkout / Start Session window comes before the Station. */
export type PhoneConsumer = "desk" | "station";

export interface PhoneSession {
  token: string;
  expiresAt: string;
  name: string;
}

/** The desk's side: ask for a QR code, read what the phone scanned, disconnect the phones. */
class PhoneScannerServiceClass extends BaseService {
  /** A one-time code for the QR (valid for ten minutes, works once). */
  createPairing() {
    return this.apiRequest<PhonePairing>("/librarian/phone-pairing", { method: "POST" });
  }

  /**
   * Takes the barcodes the phone has sent since the last ask (each one is given to exactly one asker) and says whether
   * a phone is connected.
   */
  scans(as: PhoneConsumer) {
    return this.apiRequest<PhoneScansResponse>("/librarian/phone-scans", { query: { as } });
  }

  disconnect() {
    return this.apiRequest<{ message: string }>("/librarian/phone-pairing", { method: "DELETE" });
  }
}

export const phoneScannerService = new PhoneScannerServiceClass();

/**
 * The phone's side. These calls carry the phone's own limited token (kept on the phone, not in the cookies the rest
 * of the app uses), so they don't go through BaseService, which would send the signed-in librarian's cookie token.
 */
export function phoneApi() {
  const base = useRuntimeConfig().public.apiBaseURL as string;
  const headers = (token?: string): Record<string, string> => ({ Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) });

  return {
    claim: (code: string) => $fetch<PhoneSession>("/phone-scanner/claim", { baseURL: base, method: "POST", body: { code }, headers: headers() }),
    ping: (token: string) => $fetch<{ name: string }>("/phone-scanner/ping", { baseURL: base, headers: headers(token) }),
    send: (token: string, code: string) => $fetch<{ seq: number }>("/phone-scanner/scan", { baseURL: base, method: "POST", body: { code }, headers: headers(token) }),
    leave: (token: string) => $fetch("/phone-scanner", { baseURL: base, method: "DELETE", headers: headers(token) }),
  };
}
