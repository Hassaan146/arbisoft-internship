import { useEffect } from 'react';

/**
 * Add the `visible` class to an element once it scrolls into view (one-shot).
 * The CSS transition on `.visible` does the actual reveal animation.
 * `threshold` is the fraction on-screen that triggers it (0.15 = ~15%).
 */
export function useScrollReveal(elementRef, threshold = 0.15) {
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [elementRef, threshold]);
}
