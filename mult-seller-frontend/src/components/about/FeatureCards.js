import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    title: "Why Choose Us?: Seamless Transactions",
    icon: "🎯",
    gradient: ["#eae0d5", "#c6ac8f"],
  },
  {
    title: "Vendor Empowerment: Global Reach",
    icon: "🌍",
    gradient: ["#c6ac8f", "#5e503f"],
  },
  {
    title: "Vendor Empowerment: Growth",
    icon: "📈",
    gradient: ["#eae0d5", "#5e503f"],
  },
  {
    title: "Curated Discovery: Curated Discovery",
    icon: "🔎",
    gradient: ["#c6ac8f", "#5e503f"],
  },
];

const FeatureCards = () => {
  const containerRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feature-card", {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
      });

      // hover effects
      document.querySelectorAll(".feature-card").forEach((el) => {
        el.addEventListener("mouseenter", () =>
          gsap.to(el, {
            y: -10,
            boxShadow: "0 30px 50px rgba(198,172,143,0.35)",
            duration: 0.35,
          })
        );
        el.addEventListener("mouseleave", () =>
          gsap.to(el, {
            y: 0,
            boxShadow: "0 10px 20px rgba(198,172,143,0.18)",
            duration: 0.35,
          })
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="max-w-6xl mx-auto px-6 py-20"
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, rgba(234,224,213,0.15), rgba(198,172,143,0.06))",
      }}
    >
      <h2
        className="text-3xl font-bold mb-8 text-center"
        style={{ color: isDarkMode ? "#eae0d5" : "#5e503f" }}
      >
        Platform Highlights
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className="feature-card rounded-2xl p-6 border transition-shadow duration-300 backdrop-blur"
            style={{
              willChange: "transform",
              backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
              border: "1px solid rgba(198,172,143,0.35)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                boxShadow: "0 10px 20px rgba(198,172,143,0.25)",
                border: "1px solid rgba(198,172,143,0.5)",
              }}
            >
              <div className="text-2xl">{c.icon}</div>
            </div>
            <h3 className="font-semibold mb-2">{c.title}</h3>
            <p className="text-sm text-gray-700">
              Trusted by sellers and buyers across galaxies. Fast payouts,
              transparent fees, and global reach.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
