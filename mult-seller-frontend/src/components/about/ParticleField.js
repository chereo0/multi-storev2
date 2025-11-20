import React, { useRef, useEffect } from "react";

// Lightweight particle system using canvas; GSAP drives the particle movement for smoothness
const ParticleField = ({ density = 120 }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Determine size using layout size (client bounding rect). Do NOT assign to clientWidth (read-only).
    const rect = canvas.getBoundingClientRect();
    let width = Math.max(rect.width || 0, window.innerWidth);
    let height = Math.max(
      rect.height || 0,
      Math.max(window.innerHeight * 0.5, 400)
    );
    // Set canvas drawing buffer size
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);

    let particles = [];

    const createParticles = (count) => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.8 + 0.6,
          a: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.6,
        });
      }
    };

    createParticles(density);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // background subtle radial gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "rgba(10,12,26,0.15)");
      grad.addColorStop(1, "rgba(18,10,45,0.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // draw particles and connecting arcs
      for (let p of particles) {
        // move in spiral
        p.a += 0.002 * p.speed;
        p.x += Math.cos(p.a) * p.speed;
        p.y += Math.sin(p.a) * p.speed * 0.6;

        // wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // glow
        ctx.beginPath();
        ctx.fillStyle = "rgba(0,212,255,0.9)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      draw();
      animRef.current = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      const r = canvas.getBoundingClientRect();
      width = Math.max(r.width || 0, window.innerWidth);
      height = Math.max(r.height || 0, Math.max(window.innerHeight * 0.5, 400));
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      createParticles(density);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [density]);

  return (
    <div className="absolute inset-0 -z-10">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default ParticleField;
