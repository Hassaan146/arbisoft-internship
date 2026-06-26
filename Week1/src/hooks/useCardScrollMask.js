import { useEffect } from 'react';

/**
 * Scroll-driven "wipe in" for the fixed cards.
 *
 * As the user scrolls through the trigger zone, the container fades in/out and
 * the grid is revealed behind a moving CSS mask (vertical on mobile, horizontal
 * on desktop). Takes refs to the cards container and the trigger spacer.
 */
export function useCardScrollMask(containerRef, triggerRef) {
  useEffect(() => {
    const container = containerRef.current;
    const trigger = triggerRef.current;
    const grid = container?.querySelector('.grid');
    if (!container || !trigger || !grid) return undefined;

    let raf = 0;

    const tick = () => {
      const rect = trigger.getBoundingClientRect();
      const triggerTop = rect.top + window.scrollY;
      const triggerHeight = rect.height;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      const start = triggerTop - vh * 0.5;
      const end = triggerTop + triggerHeight - vh * 0.3;
      const range = end - start;

      let progress = range > 0 ? (scrollY - start) / range : 0;
      progress = Math.max(0, Math.min(1, progress));

      // Stay active slightly outside the reveal window so the fade has room.
      const isActive = scrollY >= start - vh * 0.2 && scrollY <= end + vh * 0.3;
      const fadeIn = Math.min(
        1,
        Math.max(0, (scrollY - (start - vh * 0.2)) / (vh * 0.2))
      );
      const fadeOut = Math.min(
        1,
        Math.max(0, (end + vh * 0.3 - scrollY) / (vh * 0.3))
      );
      const opacity = isActive ? Math.min(fadeIn, fadeOut) : 0;

      container.style.opacity = opacity;
      container.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

      // Overshoot to 130% so the last card fully clears the mask's soft edge.
      const revealPct = progress * 130;
      const isMobile = window.innerWidth < 768;
      const dir = isMobile ? 'to bottom' : 'to right';
      const softEdge = isMobile ? 20 : 15;
      const mask = `linear-gradient(${dir}, black ${revealPct}%, transparent ${revealPct + softEdge}%)`;
      grid.style.maskImage = mask;
      grid.style.webkitMaskImage = mask;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [containerRef, triggerRef]);
}
