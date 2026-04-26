import { useEffect, useRef } from 'react';

/**
 * Subtle glitch art interference lines.
 * Occasionally flashes a thin horizontal scan-line across the screen.
 * Very low frequency — feels like an old CRT monitor or film artifact.
 */
export default function GlitchEffect() {
  const lineRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const schedule = () => {
      // Random interval between 8-25 seconds
      const delay = 8000 + Math.random() * 17000;
      timerRef.current = setTimeout(() => {
        const el = lineRef.current;
        if (!el) { schedule(); return; }

        // Random vertical position
        const y = Math.random() * 100;
        // Random height (1-3px)
        const height = 1 + Math.random() * 2;
        // Random color tint
        const tints = [
          'rgba(232, 98, 26, 0.15)',
          'rgba(196, 149, 106, 0.2)',
          'rgba(255, 255, 255, 0.08)',
          'rgba(100, 200, 255, 0.1)',
        ];
        const color = tints[Math.floor(Math.random() * tints.length)];

        el.style.top = `${y}%`;
        el.style.height = `${height}px`;
        el.style.background = color;
        el.style.boxShadow = `0 0 ${4 + Math.random() * 6}px ${color}`;

        // Trigger animation
        el.style.animation = 'none';
        el.offsetHeight; // force reflow
        el.style.animation = 'glitch-flash 0.15s ease-out forwards';

        schedule();
      }, delay);
    };

    schedule();
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      ref={lineRef}
      className="fixed left-0 right-0 pointer-events-none z-[9997]"
      style={{
        opacity: 0,
        willChange: 'opacity, transform',
      }}
      aria-hidden="true"
    />
  );
}
