import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MissionSection = () => {
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftRef.current, {
        x: -80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: leftRef.current, start: "top 80%" },
      });

      gsap.from(rightRef.current, {
        x: 80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: rightRef.current, start: "top 80%" },
      });
    });

    return () => ctx.revert();
  }, []);

  const { isDarkMode } = useTheme();

  return (
    <section
      className="max-w-7xl mx-auto px-6 py-20"
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, rgba(234,224,213,0.15), rgba(198,172,143,0.08))",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div
          ref={leftRef}
          className="p-8 rounded-2xl"
          style={{
            background: isDarkMode
              ? "rgba(255,255,255,0.06)"
              : "linear-gradient(135deg, #eae0d5, #c6ac8f)",
            border: "1px solid rgba(198,172,143,0.35)",
          }}
        >
          <div
            className="font-semibold mb-2"
            style={{ color: isDarkMode ? "#eae0d5" : "#5e503f" }}
          >
            Our Mission
          </div>
          <h3 className="text-3xl font-bold mb-4">
            Our Mission: Empowering Creators
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            We provide tools, exposure, and infrastructure so creators can reach
            audiences across galaxies. We believe in fairness, open networks,
            and composable commerce.
          </p>
        </div>

        <div
          ref={rightRef}
          className="p-8 rounded-2xl backdrop-blur"
          style={{
            background: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
            border: "1px solid rgba(198,172,143,0.35)",
          }}
        >
          <div className="font-semibold mb-2" style={{ color: isDarkMode ? "#eae0d5" : "#5e503f" }}>Our Mission</div>
          <h3 className="text-3xl font-bold mb-4">
            Our Mission: Enriching Experiences
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            We build delightful experiences that adapt to each user's context,
            making discovery simple and delightful, even across realities.
          </p>

          {/* Tech illustration placeholder */}
          <div
            className="w-full h-48 rounded-lg flex items-center justify-center"
            style={{
              background: isDarkMode
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #eae0d5, #c6ac8f)",
              border: "1px solid rgba(198,172,143,0.35)",
            }}
          >
            {/* Simple SVG representing connected hex nodes */}
            <svg
              width="220"
              height="120"
              viewBox="0 0 220 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0" stopColor="#c6ac8f" />
                  <stop offset="1" stopColor="#5e503f" />
                </linearGradient>
              </defs>
              <g stroke="url(#g)" strokeWidth="2" strokeLinecap="round">
                <circle cx="40" cy="60" r="10" fill="#c6ac8f" />
                <circle cx="110" cy="30" r="10" fill="#5e503f" />
                <circle cx="180" cy="60" r="10" fill="#eae0d5" />
                <path d="M50 60 L100 40 L170 60" strokeOpacity="0.7" />
                <path d="M110 40 L110 90" strokeOpacity="0.5" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
