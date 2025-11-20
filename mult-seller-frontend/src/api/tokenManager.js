/**
 * TokenManager - Singleton class to manage client OAuth2 tokens
 * Prevents duplicate token requests and handles token lifecycle
 */
class TokenManager {
  constructor() {
    this.tokenPromise = null;
    this.isInitialized = false;
  }

  /**
   * Get client token - returns existing valid token or fetches new one
   * Prevents duplicate concurrent requests
   */
  async getClientToken() {
    // If we already have a valid token in localStorage, return it
    const existingToken = localStorage.getItem("client_token");
    const expiresAt = localStorage.getItem("client_token_expires_at");

    if (existingToken && expiresAt) {
      const now = Date.now();
      const expiry = parseInt(expiresAt, 10);

      // Check if token is still valid (with 5 minute buffer)
      if (expiry > now + 5 * 60 * 1000) {
        console.log("✅ TokenManager: Reusing existing client token");
        return existingToken;
      } else {
        console.log("⏰ TokenManager: Token expired, fetching new one");
      }
    }

    // If a token fetch is already in progress, wait for it
    if (this.tokenPromise) {
      console.log("⏳ TokenManager: Token fetch in progress, waiting...");
      return await this.tokenPromise;
    }

    // Start new token fetch
    console.log("🚀 TokenManager: Fetching new client token");
    this.tokenPromise = this.fetchNewToken();

    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      // Clear the promise so future calls can fetch again if needed
      this.tokenPromise = null;
    }
  }

  /**
   * Fetch a new token from the OAuth2 endpoint
   */
  async fetchNewToken() {
    try {
      const clientCredentials = {
        client_id: process.env.REACT_APP_CLIENT_ID || "shopping_oauth_client",
        client_secret:
          process.env.REACT_APP_CLIENT_SECRET || "shopping_oauth_secret",
        grant_type: "client_credentials",
      };

      const response = await fetch(
        "https://multi-store-api.cloudgoup.com/api/rest/oauth2/token/client_credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(clientCredentials),
        }
      );

      const data = await response.json();

      // Check for success - note: OAuth2 "password grant not supported" error is expected in Network tab
      // This is normal - backend only supports client_credentials, not password grant
      if (
        response.ok &&
        data.success === 1 &&
        data.data &&
        data.data.access_token
      ) {
        const token = data.data.access_token;
        const expiresIn = data.data.expires_in || 3600; // Default 1 hour
        const expiresAt = Date.now() + expiresIn * 1000;

        // Store token and expiration
        localStorage.setItem("client_token", token);
        localStorage.setItem("client_token_expires_at", expiresAt.toString());

        console.log(
          "✅ TokenManager: New client token obtained and stored",
          token.substring(0, 20) + "..."
        );

        this.isInitialized = true;
        return token;
      } else {
        // Only log to console, don't throw - OAuth2 errors are expected
        console.log("⚠️ TokenManager: OAuth2 response:", data);
        // If we got here but have an error, it might be the "password grant not supported" message
        // This is expected and can be ignored - just return null
        return null;
      }
    } catch (error) {
      // Only log to console, don't show to user
      console.log("⚠️ TokenManager: Token fetch error:", error.message);
      return null;
    }
  }

  /**
   * Check if current token should be refreshed
   */
  shouldRefreshToken() {
    const expiresAt = localStorage.getItem("client_token_expires_at");
    if (!expiresAt) return true;

    const now = Date.now();
    const expiry = parseInt(expiresAt, 10);

    // Refresh if token expires in less than 5 minutes
    return expiry <= now + 5 * 60 * 1000;
  }

  /**
   * Clear stored token
   */
  clearToken() {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_token_expires_at");
    this.tokenPromise = null;
    this.isInitialized = false;
    console.log("🗑️ TokenManager: Token cleared");
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
