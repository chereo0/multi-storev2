import React, { createContext, useContext, useState, useEffect } from "react";
import { registerUser, loginUser, logoutUser, getProfile } from "../api/services";
import { setAuthToken, clearAuthToken, api } from "../api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);
  const isGuest = !!(user && user.isGuest);

  // Token validation function
  const validateToken = async (token) => {
    try {
      console.log("AuthContext: Validating token...");

      // Use the configured axios instance for token validation
      const response = await api.get("/account/address");

      console.log("AuthContext: Token validation response:", response.status);
      setTokenValid(true);
    } catch (error) {
      console.log("AuthContext: Token validation error:", error);

      if (error.response) {
        const status = error.response.status;
        console.log(
          "AuthContext: Token validation failed with status:",
          status
        );

        if (status === 401 || status === 403) {
          console.log("AuthContext: Token is invalid, clearing auth");
          setTokenValid(false);
          clearAuth();
        } else {
          // Don't clear auth for other errors, just mark as unvalidated
          setTokenValid(false);
        }
      } else {
        // Network error or other issues
        console.log("AuthContext: Token validation network error");
        setTokenValid(false);
      }
    }
  };

  // Clear auth function
  const clearAuth = () => {
    console.log("AuthContext: Clearing all auth data...");
    setUser(null);
    setTokenValid(true); // Reset to true since we're not validating

    // Clear all possible user and token keys from both storages
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("token");

    clearAuthToken();
    console.log("AuthContext: Auth data cleared");
  };

  useEffect(() => {
    // Check if user is logged in on app start
    console.log("AuthContext: Initializing...");

    // Mark this as a refresh scenario to prevent logout
    sessionStorage.setItem("is_refreshing", "true");
    setTimeout(() => {
      sessionStorage.removeItem("is_refreshing");
    }, 5000); // Remove flag after 5 seconds to allow token restoration

    // Check refresh counter to prevent excessive refreshes (disabled for now)
    // const refreshCount = parseInt(sessionStorage.getItem('refresh_count') || '0');
    // const lastRefreshTime = parseInt(sessionStorage.getItem('last_refresh_time') || '0');
    // const currentTime = Date.now();

    // Reset counter if more than 5 minutes have passed
    // if (currentTime - lastRefreshTime > 5 * 60 * 1000) {
    //   sessionStorage.setItem('refresh_count', '0');
    //   sessionStorage.setItem('last_refresh_time', currentTime.toString());
    // } else {
    //   const newCount = refreshCount + 1;
    //   sessionStorage.setItem('refresh_count', newCount.toString());
    //   sessionStorage.setItem('last_refresh_time', currentTime.toString());
    //
    //   // If too many refreshes, clear auth to prevent issues
    //   if (newCount > 10) {
    //     console.log('AuthContext: Too many refreshes detected, clearing auth');
    //     clearAuth();
    //     return;
    //   }
    // }

    // Check localStorage first
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("auth_token");
    const oldToken = localStorage.getItem("token");

    // Check sessionStorage as backup (survives hard refresh)
    const sessionUser = sessionStorage.getItem("user");
    const sessionToken = sessionStorage.getItem("auth_token");

    console.log("AuthContext: localStorage user:", savedUser);
    console.log("AuthContext: localStorage token:", savedToken);
    console.log("AuthContext: sessionStorage user:", sessionUser);
    console.log("AuthContext: sessionStorage token:", sessionToken);

    // Prioritize localStorage, fallback to sessionStorage
    const userToUse = savedUser || sessionUser;
    const tokenToUse = savedToken || oldToken || sessionToken;

    if (userToUse) {
      try {
        const parsedUser = JSON.parse(userToUse);
        console.log("AuthContext: Setting user:", parsedUser);
        setUser(parsedUser);

        // If we got user from sessionStorage but not localStorage, restore to localStorage
        if (!savedUser && sessionUser) {
          localStorage.setItem("user", sessionUser);
          console.log(
            "AuthContext: Restored user to localStorage from sessionStorage"
          );
        }
      } catch (error) {
        console.error("AuthContext: Error parsing saved user:", error);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
      }
    }

    if (tokenToUse) {
      console.log("AuthContext: Setting auth token:", tokenToUse);
      console.log("AuthContext: Token details:", {
        tokenLength: tokenToUse.length,
        tokenStart: tokenToUse.substring(0, 10) + "...",
        tokenEnd: "..." + tokenToUse.substring(tokenToUse.length - 10),
        source: savedToken
          ? "localStorage"
          : oldToken
          ? "localStorage (old key)"
          : "sessionStorage",
        timestamp: new Date().toISOString(),
      });
      setAuthToken(tokenToUse);

      // Restore token to localStorage if it was only in sessionStorage
      if (!savedToken && !oldToken && sessionToken) {
        localStorage.setItem("auth_token", sessionToken);
        console.log(
          "AuthContext: Restored token to localStorage from sessionStorage"
        );
      }

      // If we used the old token location, move it to the new location
      if (!savedToken && oldToken) {
        localStorage.setItem("auth_token", oldToken);
        localStorage.removeItem("token");
        console.log("AuthContext: Moved token from old to new location");
      }

      // Skip token validation on refresh to prevent logout issues
      // validateToken(tokenToUse).catch(error => {
      //   console.log('AuthContext: Token validation failed, but continuing with token:', error);
      //   // Don't clear auth immediately, let the user try to use the app
      //   setTokenValid(false);
      // });

      // Set token as valid by default to prevent logout on refresh
      console.log(
        "AuthContext: Skipping token validation on refresh, assuming valid"
      );
      setTokenValid(true);
    } else {
      console.log("AuthContext: No token found, clearing auth");
      console.log("AuthContext: Storage state:", {
        localStorageUser: !!savedUser,
        localStorageAuthToken: !!savedToken,
        localStorageOldToken: !!oldToken,
        sessionStorageUser: !!sessionUser,
        sessionStorageAuthToken: !!sessionToken,
        timestamp: new Date().toISOString(),
      });
      clearAuthToken();
    }

    console.log("AuthContext: Initialization complete");
    setLoading(false);
  }, []);

  const login = async (userDataOrEmail, password) => {
    try {
      // If userDataOrEmail is an object, it's user data from OTP verification
      if (typeof userDataOrEmail === "object") {
        const userData = { ...userDataOrEmail };
        
        if (userData.token) {
          // Store token FIRST in both localStorage and sessionStorage
          localStorage.setItem("auth_token", userData.token);
          sessionStorage.setItem("auth_token", userData.token);
          setAuthToken(userData.token);
          console.log("AuthContext: Token stored from OTP verification");
        }

        // Set user state
        setUser(userData);

        // Store user data in both localStorage and sessionStorage
        const userDataString = JSON.stringify(userData);
        localStorage.setItem("user", userDataString);
        sessionStorage.setItem("user", userDataString);

        console.log("AuthContext: OTP verification complete. User and token stored:", {
          hasUser: !!userData,
          hasToken: !!userData.token,
          userId: userData.id,
          userEmail: userData.email
        });

        return { success: true };
      }

      // Otherwise, it's email/password login - use actual API
      console.log("AuthContext: Attempting login with:", userDataOrEmail);
      const result = await loginUser(userDataOrEmail, password);
      console.log("AuthContext: Login API result:", result);

      if (result.success) {
        // Prefer normalized fields returned by services.loginUser
        const normalizedUser = result.user || result.data?.user || null;
        const normalizedToken =
          result.token ||
          result.auth_token ||
          result.data?.auth_token ||
          result.data?.token ||
          result.data?.access_token ||
          result.access_token ||
          null;

        // Extract user data from API response with robust fallbacks
        const userData = {
          id:
            normalizedUser?.id ||
            result.data?.id ||
            normalizedUser?.user_id ||
            normalizedUser?.customer_id ||
            null,
          email: normalizedUser?.email || userDataOrEmail,
          name:
            normalizedUser?.name ||
            `${normalizedUser?.firstname || ""} ${
              normalizedUser?.lastname || ""
            }`.trim() ||
            result.data?.user?.name ||
            "User",
          firstname: normalizedUser?.firstname || result.data?.user?.firstname,
          lastname: normalizedUser?.lastname || result.data?.user?.lastname,
          username: normalizedUser?.username || result.data?.user?.username,
          telephone: normalizedUser?.telephone || result.data?.user?.telephone,
          avatar:
            normalizedUser?.avatar ||
            result.data?.user?.avatar ||
            "https://via.placeholder.com/40",
          token: normalizedToken,
        };

        // Store auth token FIRST before setting user - check multiple possible token fields
        const token =
          normalizedToken ||
          userData.token ||
          userData.access_token ||
          result.data?.auth_token ||
          result.auth_token;
        console.log("AuthContext: Looking for token in:", {
          "userData.token": userData.token,
          "userData.access_token": userData.access_token,
          "result.token": result.token,
          "result.access_token": result.access_token,
          "result.auth_token": result.auth_token,
          "result.data?.token": result.data?.token,
          "result.data?.access_token": result.data?.access_token,
          "result.data?.auth_token": result.data?.auth_token,
          "Full result.data object": result.data,
        });

        if (token) {
          console.log("AuthContext: Storing auth token:", token);
          // Store token in both localStorage and sessionStorage
          localStorage.setItem("auth_token", token);
          sessionStorage.setItem("auth_token", token);
          setAuthToken(token);
          
          // Update userData to include token
          userData.token = token;
        } else {
          console.log(
            "AuthContext: No token in login response, but login successful"
          );
          console.log("AuthContext: Available fields:", Object.keys(result));
          console.log("AuthContext: Full result object:", result);
          console.log("AuthContext: Full result.data object:", result.data);
          console.log(
            "AuthContext: Proceeding without auth token - using client token for API calls"
          );
          // Don't clear auth token - let API functions use client token as fallback
        }

        // Set user AFTER token is stored and added to userData
        setUser(userData);

        // Store user data in both localStorage and sessionStorage
        const userDataString = JSON.stringify(userData);
        localStorage.setItem("user", userDataString);
        sessionStorage.setItem("user", userDataString);

        console.log("AuthContext: Login complete. User and token stored:", {
          hasUser: !!userData,
          hasToken: !!token,
          userId: userData.id,
          userEmail: userData.email
        });

        // After storing token, if the user id is missing, try to hydrate from /account
        try {
          if (!userData.id && token) {
            const profile = await getProfile();
            if (profile?.success && profile.data) {
              const p = profile.data;
              const hydrated = {
                id: p.id || p.user_id || p.customer_id || userData.id,
                name:
                  p.name ||
                  [p.firstname, p.lastname].filter(Boolean).join(" ") ||
                  userData.name,
                email: p.email || userData.email,
                firstname: p.firstname ?? userData.firstname,
                lastname: p.lastname ?? userData.lastname,
                username: p.username ?? userData.username,
                telephone: p.telephone ?? userData.telephone,
                avatar: p.avatar || userData.avatar,
              };
              updateUser(hydrated);
              console.log("AuthContext: Hydrated user from profile:", hydrated);
            }
          }
        } catch (e) {
          console.warn("AuthContext: Failed to hydrate profile:", e?.message || e);
        }

        return { success: true };
      } else {
        return { success: false, error: result.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during login",
      };
    }
  };

  const signup = async (userData) => {
    try {
      // Align with backend requirement: include confirm field
      const payload = {
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.username,
        email: userData.email,
        telephone: userData.telephone,
        fax: userData.fax || "",
        password: userData.password,
        confirm: userData.password,
      };

      console.log("Sending signup payload:", payload);
      const result = await registerUser(payload);
      console.log("Signup result:", result);

      // Check if registration was successful (handle both success: true and success: 1)
      if (result && (result.success === true || result.success === 1)) {
        // Don't set user yet - wait for OTP verification
        // Return success with user data for OTP verification
        return {
          success: true,
          user: {
            id: result.user?.id || result.data?.id || result.data?.user?.id,
            firstname: userData.firstname,
            lastname: userData.lastname,
            username: userData.username,
            email: userData.email,
            telephone: userData.telephone,
            fax: userData.fax,
          },
        };
      }

      // Handle validation errors
      if (result.errors) {
        const errorMessages = Object.values(result.errors).flat();
        return { success: false, error: errorMessages.join(", ") };
      }

      // If backend returns a message or errors
      return {
        success: false,
        error:
          result?.message ||
          result?.error ||
          "Registration failed. Please check the console for details.",
      };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during signup",
      };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (_) {}
    clearAuth();
  };

  const continueAsGuest = () => {
    const guestUser = {
      id: "guest",
      name: "Guest",
      email: null,
      avatar: "https://via.placeholder.com/40",
      isGuest: true,
    };

    setUser(guestUser);
    localStorage.setItem("user", JSON.stringify(guestUser));
    clearAuthToken();
  };

  // Update user in-memory and persist to storage
  const updateUser = (updates = {}) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(updates || {}) };
      try {
        localStorage.setItem("user", JSON.stringify(next));
        sessionStorage.setItem("user", JSON.stringify(next));
      } catch (e) {
        console.warn("AuthContext: failed to persist user update", e);
      }
      return next;
    });
  };

  const value = {
    user,
    isGuest,
    login,
    signup,
    logout,
    continueAsGuest,
    updateUser,
    loading,
    tokenValid,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
