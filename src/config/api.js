const API_BASE_URL = "https://cadna-backend-kpgj.onrender.com";

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  VERIFY_2FA_LOGIN: "/api/auth/verify-2fa-login",
  SETUP_2FA: "/api/auth/setup-2fa",
  VERIFY_2FA_ENABLE: "/api/auth/verify-2fa-enable",
  REFRESH_TOKEN: "/api/auth/refresh",
  ME: "/api/auth/me",
  PROFILE: "/api/user/profile",
  UPDATE_PROFILE: "/api/user/profile",

  // Exam endpoints
  EXAMS: "/api/exams",
  ENROLLED_EXAMS: "/api/user/enrolled-exams",
  EXAM_BY_LINK: (examLink) => `/api/exams/link/${examLink}`,
  EXAM_DETAILS: (examId) => `/api/exams/${examId}`,
  EXAM_WITH_ANSWERS: (examId) => `/api/exams/${examId}/with-answers`, // NEW ENDPOINT

  // Exam session endpoints
  EXAM_SESSION: (sessionId) => `/api/exam-sessions/${sessionId}`,
  START_EXAM: (examId) => `/api/exam-sessions/start/${examId}`,
  SUBMIT_ANSWER: (sessionId) => `/api/exam-sessions/${sessionId}/answer`,
  SUBMIT_EXAM: (sessionId) => `/api/exam-sessions/${sessionId}/submit`,
  AUTO_SUBMIT_EXAM: (sessionId) =>
    `/api/exam-sessions/${sessionId}/auto-submit`,
  FLAG_ACTIVITY: (sessionId) => `/api/exam-sessions/${sessionId}/flag-activity`,

  // Results endpoints
  RESULTS: "/api/results",
  // Results by exam ID endpoint
  RESULT_BY_EXAM: (examId) => `/api/results/${examId}`,
};

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    // Validate endpoint to prevent SSRF - only allow specific API paths
    if (
      !endpoint ||
      typeof endpoint !== "string" ||
      !endpoint.startsWith("/api/")
    ) {
      throw new Error("Invalid endpoint format");
    }

    // Additional validation for allowed endpoints
    const allowedPaths = [
      "/api/auth/",
      "/api/user/",
      "/api/users/",
      "/api/exams",
      "/api/exam-sessions/",
      "/api/results",
    ];
    const isAllowed = allowedPaths.some((path) => endpoint.startsWith(path));
    if (!isAllowed) {
      throw new Error("Endpoint not allowed");
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("authToken");

    const config = {
      mode: "cors",
      credentials: "same-origin",
      // timeout will be handled manually with AbortController
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest", // CSRF protection
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401 && endpoint !== "/api/auth/refresh") {
            // Clear invalid token and redirect to login
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/signin";
            return;
          }

          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.message && typeof errorData.message === "string") {
              // Sanitize error message to prevent XSS
              errorMessage = errorData.message.replace(/[<>"'&]/g, "");
            }
          } catch (parseError) {
            console.warn("Failed to parse error response:", parseError.message);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        console.error(
          `API Request failed (attempt ${attempt}/${maxRetries}):`,
          {
            endpoint,
            method: config.method || "GET",
            status: error.status,
            message: error.message,
          },
        );

        if (attempt === maxRetries) break;
        if (error.name === "AbortError") break; // Don't retry timeouts

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
      }
    }

    if (lastError.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    if (lastError.name === "TypeError" && lastError.message.includes("fetch")) {
      throw new Error(
        "Network error. Please check your connection and try again.",
      );
    }
    throw lastError;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
