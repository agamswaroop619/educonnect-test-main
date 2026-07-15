import { useEffect, useRef, useState } from "react";

/**
 * Counts from 0 up to `target` over `duration` ms using an easeOut curve.
 * Returns the current display value (integer).
 */
export function useCountUp(target: number, duration = 1200, start = true): number {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;

    startedAt.current = null;
    setCurrent(0);

    function tick(now: number) {
      if (startedAt.current === null) startedAt.current = now;
      const elapsed = now - startedAt.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    }

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, start]);

  return current;
}

/**
 * Returns a ref and a boolean `inView`.
 * Once the element has entered the viewport it stays true (fire-once).
 */
export function useInView<T extends Element>(options?: IntersectionObserverInit): {
  ref: React.RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
