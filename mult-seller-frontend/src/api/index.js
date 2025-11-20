import axios from "axios";
import toast from "react-hot-toast";

// Resolve base URL for live server
const resolveBaseURL = () => {
  // 1) Prefer explicit env var
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && typeof envUrl === "string") {
    return envUrl.replace(/\/$/, "");
  }

  // 2) Use live server URL as default
  return "https://multi-store-api.cloudgoup.com/api/rest";
};

// Create axios instance with default configuration
const api = axios.create({
  baseURL: resolveBaseURL(),

  // Default headers for all requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Request timeout (30 seconds)
  timeout: 30000,
});

// Request interceptor - runs before each request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or sessionStorage (if available)
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    const clientToken = localStorage.getItem("client_token");
    const urlString = typeof config.url === "string" ? config.url : "";
    const isTokenRequest = urlString.includes("/oauth2/token");

    // Add authorization header if token exists
    if (!isTokenRequest && token) {
      const tokenInfo = getTokenInfo(token);
      config.headers.Authorization = `Bearer ${token}`;
      console.log("API Request: Using auth_token for", config.url);
      console.log("Token details:", {
        ...tokenInfo,
        timestamp: new Date().toISOString(),
      });

      if (!tokenInfo.valid) {
        console.warn("API Request: Invalid token format detected!", tokenInfo);
      }

      if (tokenInfo.expired) {
        console.warn("API Request: Token appears to be expired!", {
          exp: tokenInfo.exp,
          current: Date.now() / 1000,
          expired: tokenInfo.expired,
        });
      }
    } else if (!isTokenRequest && clientToken) {
      const clientTokenInfo = getTokenInfo(clientToken);
      config.headers.Authorization = `Bearer ${clientToken}`;
      console.log("API Request: Using client_token for", config.url);
      console.log("Client token details:", {
        ...clientTokenInfo,
        timestamp: new Date().toISOString(),
      });
    } else if (!isTokenRequest) {
      console.warn("API Request: No token available for", config.url);
      console.log("Storage check:", {
        localStorageAuth: !!localStorage.getItem("auth_token"),
        sessionStorageAuth: !!sessionStorage.getItem("auth_token"),
        localStorageClient: !!localStorage.getItem("client_token"),
        timestamp: new Date().toISOString(),
      });
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        headers: config.headers,
        hasAuthToken: !!token,
        hasClientToken: !!clientToken,
      });
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - runs after each response
api.interceptors.response.use(
  (response) => {
    // Reset any auth failure counter on successful responses
    try {
      sessionStorage.removeItem("auth_failure_count");
    } catch (e) {}
    // Log response in development
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        status: response.status,
        data: response.data,
        url: response.config.url,
      });
    }

    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Silently ignore OAuth2 token endpoint errors (password grant not supported)
      const urlString =
        typeof error.config?.url === "string" ? error.config.url : "";
      if (urlString.includes("/oauth2/token")) {
        // Don't log or show toast for OAuth2 errors - backend doesn't support password grant
        return Promise.reject(error);
      }

      // Handle specific HTTP status codes
      // Use a tolerant refresh strategy to avoid clearing auth on transient 401/403 during page reloads.
      // Track a short-lived refresh counter in sessionStorage. Only clear auth if we exceed a threshold
      // of consecutive auth failures, or if not currently in a refresh scenario.
      const refreshFlag = sessionStorage.getItem("is_refreshing") === "true";
      const refreshCountKey = "auth_failure_count";
      const maxFailuresBeforeClear = 2; // allow up to this many consecutive failures during refresh

      const incrementFailureCount = () => {
        try {
          const raw = sessionStorage.getItem(refreshCountKey) || "0";
          const count = parseInt(raw, 10) || 0;
          sessionStorage.setItem(refreshCountKey, String(count + 1));
        } catch (e) {
          // ignore storage errors
        }
      };

      const resetFailureCount = () => {
        try {
          sessionStorage.removeItem(refreshCountKey);
        } catch (e) {}
      };

      switch (status) {
        case 401:
          // Unauthorized
          if (refreshFlag) {
            console.log(
              "401 received during app refresh - incrementing failure counter"
            );
            incrementFailureCount();
            const current =
              parseInt(sessionStorage.getItem(refreshCountKey) || "0", 10) || 0;
            if (current > maxFailuresBeforeClear) {
              console.log(
                "Auth failures exceeded threshold during refresh - clearing auth"
              );
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user");
              toast.error("Session expired. Please login again.");
              resetFailureCount();
            } else {
              console.log(
                "Deferring auth clear until refresh completes. Failure count:",
                current
              );
            }
          } else {
            // Not a refresh scenario - clear auth immediately
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
            toast.error("Session expired. Please login again.");
          }
          break;

        case 403:
          // Forbidden - check if it's due to missing auth token
          console.log("403 Forbidden error:", data);
          console.log("403 Request details:", {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            timestamp: new Date().toISOString(),
          });

          if (
            data.error &&
            Array.isArray(data.error) &&
            data.error.includes("User is not logged in")
          ) {
            console.log(
              '403 due to "User is not logged in" - token may be expired or invalid'
            );

            if (refreshFlag) {
              console.log("403 during refresh - incrementing failure counter");
              incrementFailureCount();
              const current =
                parseInt(sessionStorage.getItem(refreshCountKey) || "0", 10) ||
                0;
              if (current > maxFailuresBeforeClear) {
                console.log(
                  "Auth failures exceeded threshold during refresh - clearing auth"
                );
                localStorage.removeItem("auth_token");
                localStorage.removeItem("user");
                toast.error(
                  "Authentication issue detected. Please log in again."
                );
                resetFailureCount();
              } else {
                console.log(
                  "Deferring auth clear until refresh completes. Failure count:",
                  current
                );
                toast.error(
                  "Authentication issue detected. Please refresh the page or log in again."
                );
              }
            } else {
              toast.error(
                "Authentication issue detected. Please refresh the page or log in again."
              );
            }
          } else {
            toast.error(
              "Access denied. You don't have permission to perform this action."
            );
          }
          break;

        case 404:
          // Not found
          toast.error("Requested resource not found.");
          break;

        case 422:
          // Validation errors
          if (data.errors) {
            // Handle Laravel validation errors
            const errorMessages = Object.values(data.errors).flat();
            errorMessages.forEach((message) => toast.error(message));
          } else {
            toast.error(data.message || "Validation failed.");
          }
          break;

        case 500:
          // Server error
          toast.error("Server error. Please try again later.");
          break;

        default:
          // Other errors
          toast.error(data.message || `Request failed with status ${status}`);
      }

      // Don't log OAuth2 token errors (already filtered above but extra safety)
      if (!urlString.includes("/oauth2/token")) {
        console.error("API Error Response:", {
          status,
          data,
          url: error.config?.url,
        });
      }
    } else if (error.request) {
      // Network error - request was made but no response received
      console.error("Network Error:", error.request);
      toast.error("Network error. Please check your internet connection.");
    } else {
      // Something else happened
      console.error("Error:", error.message);
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

// Helper functions for common API operations

/**
 * Make a GET request
 * @param {string} url - The endpoint URL
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response
 */
export const get = (url, config = {}) => api.get(url, config);

/**
 * Make a POST request
 * @param {string} url - The endpoint URL
 * @param {object} data - Request data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response
 */
export const post = (url, data = {}, config = {}) =>
  api.post(url, data, config);

/**
 * Make a PUT request
 * @param {string} url - The endpoint URL
 * @param {object} data - Request data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response
 */
export const put = (url, data = {}, config = {}) => api.put(url, data, config);

/**
 * Make a PATCH request
 * @param {string} url - The endpoint URL
 * @param {object} data - Request data
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response
 */
export const patch = (url, data = {}, config = {}) =>
  api.patch(url, data, config);

/**
 * Make a DELETE request
 * @param {string} url - The endpoint URL
 * @param {object} config - Additional axios config
 * @returns {Promise} Axios response
 */
export const del = (url, config = {}) => api.delete(url, config);

/**
 * Upload file with progress tracking
 * @param {string} url - The endpoint URL
 * @param {FormData} formData - Form data containing file
 * @param {function} onProgress - Progress callback function
 * @returns {Promise} Axios response
 */
export const upload = (url, formData, onProgress) => {
  return api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("auth_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("auth_token");
    delete api.defaults.headers.common["Authorization"];
  }
};

/**
 * Clear authentication token
 */
export const clearAuthToken = () => {
  setAuthToken(null);
};

/**
 * Get current authentication token
 * @returns {string|null} Current token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

/**
 * Validate if token appears to be a valid format
 * @param {string} token - Token to validate
 * @returns {boolean} True if token appears valid
 */
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== "string") return false;

  // Basic validation - token should be at least 20 characters
  if (token.length < 20) return false;

  // Check if it looks like a JWT (has dots) or access token (hex-like)
  const isJWT = token.includes(".") && token.split(".").length === 3;
  const isAccessToken = /^[a-f0-9]+$/i.test(token);

  return isJWT || isAccessToken;
};

/**
 * Get token info for debugging
 * @param {string} token - Token to analyze
 * @returns {object} Token information
 */
export const getTokenInfo = (token) => {
  if (!token) return { valid: false, type: "none", length: 0 };

  const info = {
    valid: isValidTokenFormat(token),
    type: "unknown",
    length: token.length,
    start: token.substring(0, 10),
    end: token.substring(token.length - 10),
  };

  if (token.includes(".")) {
    info.type = "JWT";
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        info.exp = payload.exp;
        info.iat = payload.iat;
        info.expired = payload.exp ? Date.now() / 1000 > payload.exp : false;
      }
    } catch (e) {
      info.type = "JWT (malformed)";
    }
  } else if (/^[a-f0-9]+$/i.test(token)) {
    info.type = "Access Token";
  }

  return info;
};

// Export the configured axios instance
export default api;

// Export all HTTP methods for convenience
export { api };
