import React from "react";
import { useTheme } from "../context/ThemeContext";
// Use the global Navbar (same as Home) for consistent navigation across pages
import AboutHero from "../components/about/AboutHero";
import MissionSection from "../components/about/MissionSection";
import JourneyTimeline from "../components/about/JourneyTimeline";
import FeatureCards from "../components/about/FeatureCards";
import CTASection from "../components/about/CTASection";

// Simple About page container - theme is controlled via ModernHeader (prop drilling)
const AboutPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className="about-page min-h-screen"
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
      }}
    >
      <main>
        <AboutHero />
        <MissionSection />
        <JourneyTimeline />
        <FeatureCards />
        <CTASection />
      </main>
    </div>
  );
};

export default AboutPage;
