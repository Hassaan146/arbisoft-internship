import { useEffect } from 'react';

/**
 * Render a drifting white particle field on a full-viewport canvas (by ref).
 * Density is one particle per ~12,000 px² of viewport; particles wrap at edges.
 */
export function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let particles = [];
    let raf = 0;

    const seed = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      seed();
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}
