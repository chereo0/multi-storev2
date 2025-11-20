import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Start with dark mode as default

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Apply theme classes to document root so CSS and non-context consumers can react
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("theme-dark", isDarkMode);
    document.documentElement.classList.toggle("theme-light", !isDarkMode);
    // smooth transition for colors
    document.documentElement.style.transition =
      "background-color 400ms, color 400ms";
  }, [isDarkMode]);

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      // Dark mode colors (current design)
      dark: {
        background: "from-cyan-400 via-blue-500 to-purple-600",
        backgroundSolid: "bg-gray-900",
        text: "text-white",
        textSecondary: "text-gray-300",
        textDark: "text-gray-800",
        headerBg: "bg-transparent",
        cardBg: "bg-gray-800",
        cardBorder: "border-gray-700",
        buttonPrimary: "from-cyan-400 to-purple-500",
        buttonSecondary: "bg-gray-700",
        hexagonBg: "bg-gray-800",
        hexagonBorder: "border-cyan-400",
        neonAccent: "text-cyan-400",
        shadow: "shadow-gray-900/50",
        overlay: "bg-gray-900/80",
      },
      // Light mode colors
      light: {
        background: "from-white via-blue-50 to-purple-50",
        backgroundSolid: "bg-white",
        text: "text-gray-900",
        textSecondary: "text-gray-600",
        textDark: "text-gray-800",
        headerBg: "bg-white/95 backdrop-blur-sm",
        cardBg: "bg-white",
        cardBorder: "border-gray-200",
        buttonPrimary: "from-cyan-400 to-purple-500",
        buttonSecondary: "bg-gray-100",
        hexagonBg: "bg-white",
        hexagonBorder: "border-cyan-400",
        neonAccent: "text-cyan-600",
        shadow: "shadow-gray-200/50",
        overlay: "bg-white/80",
      },
    },
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};
