'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';

/**
 * KineticGrid Component
 * Background grid interaktif berkinerja tinggi (60 FPS, Canvas 2D).
 * Titik grid akan membesar, menyala, dan bergeser menjauh secara magnetik (repulsion)
 * saat didekati kursor mouse. Menggunakan LERP untuk inersia gerak yang super mulus.
 */
export default function KineticGrid() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Grid spacing & particle parameters
    const spacing = 42;
    const baseRadius = 1;
    const maxRadius = 2.2;
    const baseOpacity = 0.15;
    const maxOpacity = 0.65;
    const mouseRadius = 160; // radius interaksi magnetik
    const maxDisplacement = 8; // jarak dorongan titik

    // Mouse positions (target and current for lerp inertia)
    let mouse = { x: -1000, y: -1000, active: false };
    let smoothMouse = { x: -1000, y: -1000 };

    // Set canvas dimensions with high-DPI support
    const resizeCanvas = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse globally so the grid stays reactive even when hovering over buttons/cards
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleMouseEnter = () => {
      mouse.active = true;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Grid points initialization list (coordinates are fixed grid intersections)
    // We compute positions dynamically in the loop to support infinite canvas resizing safely.
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse coordinates LERP (Inertia effect)
      if (mouse.active) {
        if (smoothMouse.x === -1000) {
          smoothMouse.x = mouse.x;
          smoothMouse.y = mouse.y;
        } else {
          smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
          smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
        }
      } else {
        // Slowly drift away smooth mouse when inactive
        smoothMouse.x += (-1000 - smoothMouse.x) * 0.08;
        smoothMouse.y += (-1000 - smoothMouse.y) * 0.08;
      }

      // Draw Aura Glow behind grid (Radial Gradient)
      if (smoothMouse.x > -500) {
        const isDark = theme === 'dark';
        const glowColor = isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.07)';
        const radialGlow = ctx.createRadialGradient(
          smoothMouse.x, smoothMouse.y, 0,
          smoothMouse.x, smoothMouse.y, mouseRadius
        );
        radialGlow.addColorStop(0, glowColor);
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Determine drawing colors based on active theme
      const isDarkTheme = theme === 'dark';
      // Light Mode uses Slate-700 / Indigo-600 feeling; Dark Mode uses Indigo neon feeling
      const colorPrefix = isDarkTheme ? '99, 102, 241' : '79, 70, 229';

      // Draw Grid Particles
      // Calculate active columns and rows based on current canvas size
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const baseX = c * spacing;
          const baseY = r * spacing;

          // Physics: calculate distance between particle base position and smooth kursor
          const dx = smoothMouse.x - baseX;
          const dy = smoothMouse.y - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let posX = baseX;
          let posY = baseY;
          let radius = baseRadius;
          let opacity = baseOpacity;

          if (dist < mouseRadius) {
            // Magnet / Repulsion formula
            const force = (mouseRadius - dist) / mouseRadius; // 0 to 1
            const angle = Math.atan2(dy, dx);

            // Shift position slightly away from kursor
            posX = baseX - Math.cos(angle) * maxDisplacement * force;
            posY = baseY - Math.sin(angle) * maxDisplacement * force;

            // Scale radius and increase brightness
            radius = baseRadius + (maxRadius - baseRadius) * force;
            opacity = baseOpacity + (maxOpacity - baseOpacity) * force;
          }

          // Draw the grid dot
          ctx.beginPath();
          ctx.arc(posX, posY, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colorPrefix}, ${opacity})`;
          ctx.fill();
        }
      }

      // Request next frame
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup listeners and animation frames on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-300"
    />
  );
}
