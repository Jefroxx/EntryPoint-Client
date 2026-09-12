import { BaseService } from "../BaseService";

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

interface RawLoginResponse {
  access_token: string;
  token_type: string;
  user: LoginUser;
}

export class AuthService extends BaseService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const runtimeConfig = useRuntimeConfig();

    try {
      const response = await $fetch<RawLoginResponse>("/login", {
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

      // AuthController::login returns { user, access_token, token_type } —
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

  async logout(): Promise<void> {
    const runtimeConfig = useRuntimeConfig();

    await $fetch("/logout", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
    // Cookie cleanup is left to the caller (matches login() being pure I/O
    // with no storage side effects) — see Login.vue / layout sign-out.
  }
}

export const authService = new AuthService();
