import { BaseService } from "../BaseService";
import { SESSION_COOKIES, areaFromPath, type Area } from "~/utils/session";

export interface LoginUser {
  userID: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "librarian" | "student";
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: LoginUser;
}

export interface RegisterPayload {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email: string;
  password: string;
  password_confirmation: string;
  phoneNumber?: string;
  birthDate?: string;
  address?: string;
  studentIDNumber: string;
  academicProgram?: string;
}

interface RawLoginResponse {
  access_token: string;
  token_type: string;
  user: LoginUser;
}

export class AuthService extends BaseService {
  /** Student portal sign-in — the server rejects librarian accounts here. */
  login(email: string, password: string): Promise<LoginResponse> {
    return this.requestLogin("/login", email, password);
  }

  /** Librarian portal sign-in — the server rejects student accounts here. */
  librarianLogin(email: string, password: string): Promise<LoginResponse> {
    return this.requestLogin("/librarian/login", email, password);
  }

  private async requestLogin(path: string, email: string, password: string): Promise<LoginResponse> {
    const runtimeConfig = useRuntimeConfig();

    try {
      const response = await $fetch<RawLoginResponse>(path, {
        baseURL: runtimeConfig.public.apiBaseURL,
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: {
          email,
          password,
        },
      });

      // AuthController returns { user, access_token, token_type } —
      // normalized here to the { token, tokenType, user } shape this app uses.
      return {
        token: response.access_token,
        tokenType: response.token_type,
        user: response.user,
      };
    } catch (error: any) {
      // No `response` object at all means the request never reached the
      // server (backend down, wrong URL, offline, CORS block) — a
      // connectivity failure, not an HTTP error response. Never surface
      // the raw fetch-internals message for this case.
      if (!error?.response) {
        throw new Error(
          "Unable to reach the server. Please check your connection or try again later.",
        );
      }

      const status = error.response.status;
      const message =
        error?.response?._data?.message ||
        error?.data?.message ||
        error?.message;

      switch (status) {
        case 400:
        case 401:
        case 404:
        case 422:
        case 429:
          throw new Error(message || "Validation or Request Error");
        case 500:
          throw new Error(
            "Server error. Please try again or contact the administrator.",
          );
        default:
          throw new Error(message || "Something went wrong. Please try again.");
      }
    }
  }

  /**
   * Public student self-registration. The account is created as `pending` and
   * cannot sign in until a librarian approves it. Errors are rethrown untouched
   * so callers can read the 422 field errors (see utils/errors.ts).
   */
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const runtimeConfig = useRuntimeConfig();

    return await $fetch<{ message: string }>("/register", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: payload,
    });
  }

  /** Revokes the token of one session (default: the area of the current page). */
  async logout(area: Area = areaFromPath(useRoute().path)): Promise<void> {
    const runtimeConfig = useRuntimeConfig();
    const token = useCookie<string | null>(SESSION_COOKIES[area].token).value;

    await $fetch("/logout", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    // Cookie cleanup is left to the caller (matches login() being pure I/O
    // with no storage side effects) — see Login.vue / layout sign-out.
  }
}

export const authService = new AuthService();
