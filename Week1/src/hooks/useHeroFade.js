import { useEffect } from 'react';

/**
 * Fade an element to transparent over the first 30% of viewport height of
 * scroll, so the hero dissolves as the user scrolls past it.
 */
export function useHeroFade(elementRef) {
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return undefined;

    const onScroll = () => {
      el.style.opacity = Math.max(
        0,
        1 - window.scrollY / (window.innerHeight * 0.3)
      );
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [elementRef]);
}
