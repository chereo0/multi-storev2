import React, { useState, useEffect } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import ThreeScene from "../../components/ThreeScene";

import "../../styles/animations.css";

const AuthPage = () => {
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);

  const [formInteraction, setFormInteraction] = useState(0);

  // Login form state

  const [loginData, setLoginData] = useState({
    email: "",

    password: "",
  });

  // Signup form state

  const [signupData, setSignupData] = useState({
    firstname: "",

    lastname: "",

    username: "",

    email: "",

    password: "",

    confirmPassword: "",

    telephone: "",

    fax: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [mounted, setMounted] = useState(false);

  const { login, signup, continueAsGuest } = useAuth();
  const { isDarkMode } = useTheme();

  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Handle URL parameter for tab switching

    const tab = searchParams.get("tab");

    if (tab === "signup") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,

      [e.target.name]: e.target.value,
    });

    setFormInteraction((prev) => Math.min(prev + 1, 10));
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,

      [e.target.name]: e.target.value,
    });

    setFormInteraction((prev) => Math.min(prev + 1, 10));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      const result = await login(loginData.email, loginData.password);

      if (result.success) {
        navigate("/home");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setError("");

    // Basic validation

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");

      setLoading(false);

      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long");

      setLoading(false);

      return;
    }

    try {
      const result = await signup({
        firstname: signupData.firstname,

        lastname: signupData.lastname,

        username: signupData.username,

        email: signupData.email,

        telephone: `+961${signupData.telephone}`,

        fax: signupData.fax,

        password: signupData.password,
      });

      if (result.success) {
        navigate("/verify-otp", {
          state: {
            userData: {
              id: result.user?.id,

              firstname: signupData.firstname,

              lastname: signupData.lastname,

              username: signupData.username,

              email: signupData.email,

              telephone: `+961${signupData.telephone}`,
            },
          },
        });
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError("An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    if (typeof continueAsGuest === "function") {
      continueAsGuest();

      navigate("/home");
    } else {
      const guestUser = {
        id: "guest",
        name: "Guest",
        email: null,
        avatar: "https://via.placeholder.com/40",
        isGuest: true,
      };

      localStorage.setItem("user", JSON.stringify(guestUser));

      navigate("/home");

      setTimeout(() => {
        if (!window.location.pathname.includes("/home")) {
          window.location.href = "/home";
        }
      }, 0);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative transition-colors duration-300 ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}
      style={{
        backgroundImage: isDarkMode
          ? `linear-gradient(rgba(10,14,39,0.85), rgba(10,14,39,0.9)), url(/Gemini_Generated_Image_enzgvmenzgvmenzg.png)`
          : `linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.5)), url(/Gemini_Generated_Image_enzgvmenzgvmenzg.png)`,

        backgroundSize: "cover",

        backgroundPosition: "center",

        backgroundRepeat: "no-repeat",

        backgroundColor: isDarkMode ? "#0A0E27" : "#f8fafc",
      }}
    >
      {/* 3D Animated Background */}

      <ThreeScene formInteraction={formInteraction} />

      {/* Main Auth Container */}

      <div
        className={`max-w-6xl w-full transition-all duration-1000 ${
          mounted
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        <div
          className={`relative rounded-3xl p-8 overflow-hidden transition-colors duration-300 ${
            isDarkMode
              ? "bg-white/3 backdrop-blur-md"
              : "bg-white/80 backdrop-blur-md"
          }`}
          style={{
            border: "1px solid rgba(0, 229, 255, 0.3)",

            boxShadow:
              "0 0 50px rgba(0, 229, 255, 0.2), inset 0 0 50px rgba(255, 0, 255, 0.1)",
          }}
        >
          {/* Tab Switcher */}

          <div className="flex mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-6 text-lg font-semibold transition-all duration-300 ${
                isLogin ? "text-white" : "text-[#B0B8C1] hover:text-[#00E5FF]"
              }`}
              style={{
                background: isLogin
                  ? "linear-gradient(90deg, #00E5FF, #FF00FF)"
                  : "transparent",

                borderRadius: isLogin ? "12px 0 0 12px" : "12px 0 0 12px",
              }}
            >
              LOGIN
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-6 text-lg font-semibold transition-all duration-300 ${
                !isLogin ? "text-white" : "text-[#B0B8C1] hover:text-[#FF00FF]"
              }`}
              style={{
                background: !isLogin
                  ? "linear-gradient(90deg, #FF00FF, #00E5FF)"
                  : "transparent",

                borderRadius: !isLogin ? "0 12px 12px 0" : "0 12px 12px 0",
              }}
            >
              SIGN UP
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login Panel */}

            <div
              className={`transition-all duration-500 ${
                isLogin
                  ? "opacity-100 translate-x-0"
                  : "opacity-50 translate-x-[-20px]"
              }`}
            >
              <div className="text-center mb-6">
                <h2
                  className="text-3xl font-bold text-white mb-3"
                  style={{ textShadow: "0 0 20px rgba(0, 229, 255, 0.5)" }}
                >
                  SECURE LOGIN
                </h2>

                <p className="text-[#B0B8C1]">Access your multiverse account</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-[#B0B8C1] mb-2"
                  >
                    Username or Email
                  </label>

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#00E5FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 transition-all duration-300"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-[#B0B8C1] mb-2"
                  >
                    Password
                  </label>

                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#00E5FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 transition-all duration-300"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#00E5FF] focus:ring-[#00E5FF] border-[#00E5FF]/30 rounded bg-white/10"
                  />

                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-[#B0B8C1]"
                  >
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(90deg, #00E5FF, #00E5FF80)",

                    boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
                  }}
                >
                  {loading ? "Signing in..." : "SECURE LOGIN"}
                </button>
              </form>
            </div>

            {/* Signup Panel */}

            <div
              className={`transition-all duration-500 ${
                !isLogin
                  ? "opacity-100 translate-x-0"
                  : "opacity-50 translate-x-[20px]"
              }`}
            >
              <div className="text-center mb-6">
                <h2
                  className="text-3xl font-bold text-white mb-3"
                  style={{ textShadow: "0 0 20px rgba(255, 0, 255, 0.5)" }}
                >
                  CREATE ACCOUNT
                </h2>

                <p className="text-[#B0B8C1]">Join the multiverse community</p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="signup-firstname"
                      className="block text-sm font-medium text-[#B0B8C1] mb-2"
                    >
                      First Name
                    </label>

                    <input
                      id="signup-firstname"
                      name="firstname"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                      placeholder="First name"
                      value={signupData.firstname}
                      onChange={handleSignupChange}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-lastname"
                      className="block text-sm font-medium text-[#B0B8C1] mb-2"
                    >
                      Last Name
                    </label>

                    <input
                      id="signup-lastname"
                      name="lastname"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                      placeholder="Last name"
                      value={signupData.lastname}
                      onChange={handleSignupChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-username"
                    className="block text-sm font-medium text-[#B0B8C1] mb-2"
                  >
                    Username
                  </label>

                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                    placeholder="Choose a username"
                    value={signupData.username}
                    onChange={handleSignupChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-[#B0B8C1] mb-2"
                  >
                    Email Address
                  </label>

                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-telephone"
                    className="block text-sm font-medium text-[#B0B8C1] mb-2"
                  >
                    Phone Number
                  </label>

                  <div className="flex">
                    <div className="flex-shrink-0 px-4 py-3 rounded-l-xl bg-white/10 border border-[#FF00FF]/30 border-r-0 text-white text-sm font-medium">
                      +961
                    </div>

                    <input
                      id="signup-telephone"
                      name="telephone"
                      type="tel"
                      required
                      className="flex-1 px-4 py-3 rounded-r-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                      placeholder="Enter your phone number"
                      value={signupData.telephone}
                      onChange={handleSignupChange}
                      pattern="[0-9]{7,8}"
                      title="Please enter a valid Lebanese phone number (7-8 digits)"
                    />
                  </div>

                  <p className="mt-1 text-xs text-[#B0B8C1]">
                    Lebanese phone number (7-8 digits after +961)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-sm font-medium text-[#B0B8C1] mb-2"
                    >
                      Password
                    </label>

                    <input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                      placeholder="Create password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="block text-sm font-medium text-[#B0B8C1] mb-2"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-[#FF00FF]/30 text-white placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF00FF] focus:ring-2 focus:ring-[#FF00FF]/20 transition-all duration-300"
                      placeholder="Confirm password"
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(90deg, #FF00FF, #FF00FF80)",

                    boxShadow: "0 0 20px rgba(255, 0, 255, 0.3)",
                  }}
                >
                  {loading ? "Creating account..." : "CREATE ACCOUNT"}
                </button>

                {/* Login button placed below signup with spacing */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/auth?tab=login')}
                    className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 border bg-transparent hover:scale-[1.01]"
                    style={{
                      borderColor: isDarkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
                      color: isDarkMode ? "#E5E7EB" : "#374151",
                      background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    }}
                  >
                    Already have an account? Login
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Error Display */}

          {error && (
            <div
              className="mt-6 p-4 rounded-xl text-center"
              style={{
                background: "rgba(220, 38, 38, 0.1)",

                border: "1px solid rgba(220, 38, 38, 0.3)",

                color: "#FF6B6B",
              }}
            >
              <div className="font-medium">{error}</div>
            </div>
          )}

          {/* Guest Continue */}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleGuestContinue}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]"
              style={{
                border: isDarkMode ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(0,0,0,0.15)",
                color: isDarkMode ? "#E5E7EB" : "#374151",
                background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              }}
            >
              Continue as Guest
            </button>
            <p className="mt-4 text-xs text-[#B0B8C1]">
              By continuing you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
