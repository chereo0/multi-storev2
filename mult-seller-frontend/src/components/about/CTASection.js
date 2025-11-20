import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { gsap } from "gsap";

const CTASection = () => {
  const ref = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll(".cta-item"), {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.to(el.querySelector(".wave"), {
        xPercent: -20,
        duration: 8,
        ease: "none",
        repeat: -1,
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-24"
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, rgba(234,224,213,0.35), rgba(198,172,143,0.15))",
      }}
    >
      <div
        className="absolute inset-0 wave opacity-40 blur-3xl"
        style={{ filter: "blur(60px)", background: "linear-gradient(90deg, #eae0d5, #c6ac8f)" }}
      />
      <div className="relative max-w-4xl mx-auto text-center z-10">
        <h2
          className="text-4xl font-extrabold cta-item"
          style={{ color: isDarkMode ? "#eae0d5" : "#5e503f" }}
        >
          Ready to Explore?
        </h2>
        <p
          className="mt-4 text-lg cta-item"
          style={{ color: isDarkMode ? "#eae0d5" : "rgba(94,80,63,0.85)" }}
        >
          Your Adventure Begins Here
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            className="cta-item hover:scale-105 px-6 py-3 rounded-full font-semibold shadow-lg"
            style={{ background: "#c6ac8f", color: "#2d261f", boxShadow: "0 20px 40px rgba(198,172,143,0.35)" }}
          >
            Enquire a consultant
          </button>
          <button
            className="cta-item hover:scale-105 px-6 py-3 rounded-full font-semibold bg-transparent"
            style={{ border: "1px solid #5e503f", color: "#5e503f" }}
          >
            Start Shopping Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
