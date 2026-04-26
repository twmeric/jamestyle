import { useEffect, useRef, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  timestamp: number;
}

let rippleId = 0;

export default function TouchRipple() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);

  const addRipple = useCallback((x: number, y: number) => {
    const size = Math.max(40, Math.min(120, window.innerWidth * 0.15));
    ripplesRef.current.push({
      id: ++rippleId,
      x,
      y,
      size,
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Skip if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"], input, textarea, select')) {
        return;
      }
      addRipple(e.clientX, e.clientY);
    };

    // Also handle touch for mobile
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"], input, textarea, select')) {
        return;
      }
      const touch = e.touches[0];
      if (touch) addRipple(touch.clientX, touch.clientY);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Render loop
    const animate = () => {
      const now = Date.now();
      ripplesRef.current = ripplesRef.current.filter((r) => now - r.timestamp < 700);

      if (container) {
        const activeIds = new Set(ripplesRef.current.map((r) => r.id));
        // Remove expired ripple elements
        container.querySelectorAll('[data-ripple]').forEach((el) => {
          if (!activeIds.has(Number((el as HTMLElement).dataset.ripple))) {
            el.remove();
          }
        });

        // Add new ripple elements
        ripplesRef.current.forEach((r) => {
          const existing = container.querySelector(`[data-ripple="${r.id}"]`);
          if (!existing) {
            const el = document.createElement('div');
            el.dataset.ripple = String(r.id);
            el.style.cssText = `
              position: fixed;
              left: ${r.x}px;
              top: ${r.y}px;
              width: ${r.size}px;
              height: ${r.size}px;
              margin-left: -${r.size / 2}px;
              margin-top: -${r.size / 2}px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(196,149,106,0.15) 0%, rgba(196,149,106,0) 70%);
              pointer-events: none;
              z-index: 9999;
              animation: ripple-expand 0.7s ease-out forwards;
            `;
            container.appendChild(el);
          }
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
      cancelAnimationFrame(rafRef.current);
    };
  }, [addRipple]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
      aria-hidden="true"
    />
  );
}
