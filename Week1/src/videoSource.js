// The exact cinematic flower clip from the reference design — used as the
// autoplaying background on the landing page and behind the glass pages.
export const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';

/**
 * Reliably autoplay a muted, looping background video.
 *
 * React doesn't dependably reflect the `muted` attribute onto the element, so
 * the browser's initial autoplay decision (made at insertion) can block it, and
 * a single play() during React's commit loses the race. We force `muted`, then
 * retry play() on a deferred tick and on the media-ready events. Honours
 * prefers-reduced-motion by leaving the video paused.
 *
 * Returns a cleanup function.
 */
export function autoplayLoop(video) {
  if (!video) return () => {};

  video.muted = true;
  video.defaultMuted = true;

  const reduce =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    video.pause();
    return () => {};
  }

  let cancelled = false;
  const kick = () => {
    if (cancelled) return;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  const t0 = setTimeout(kick, 0);
  const t1 = setTimeout(kick, 350);
  video.addEventListener('canplay', kick);
  video.addEventListener('loadeddata', kick);

  // Safety net: if a browser's autoplay policy blocks muted autoplay, start
  // playback on the user's first interaction.
  const interactions = [
    'pointerdown',
    'keydown',
    'touchstart',
    'wheel',
    'scroll',
  ];
  const onInteract = () => {
    kick();
    interactions.forEach((ev) => window.removeEventListener(ev, onInteract));
  };
  interactions.forEach((ev) =>
    window.addEventListener(ev, onInteract, { once: true, passive: true })
  );

  kick();

  return () => {
    cancelled = true;
    clearTimeout(t0);
    clearTimeout(t1);
    video.removeEventListener('canplay', kick);
    video.removeEventListener('loadeddata', kick);
    interactions.forEach((ev) => window.removeEventListener(ev, onInteract));
  };
}
