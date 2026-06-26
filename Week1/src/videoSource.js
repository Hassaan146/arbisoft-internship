// The exact cinematic flower clip from the reference design — used as the
// autoplaying background on the landing page and behind the glass pages.
export const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';

/**
 * Reliably autoplay a muted, looping background video.
 *
 * Background videos are surprisingly fragile: React doesn't dependably reflect
 * the `muted` attribute, a single play() during commit can lose the autoplay
 * race, and browsers pause media in hidden tabs. This helper:
 *   - forces muted (property + attribute) so muted-autoplay is allowed,
 *   - retries play() on a few timers and on the media-ready events,
 *   - resumes when the tab becomes visible again,
 *   - falls back to the user's first interaction if autoplay is blocked.
 * Honours prefers-reduced-motion by leaving the video paused.
 *
 * Returns a cleanup function.
 */
export function autoplayLoop(video) {
  if (!video) return () => {};

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.loop = true;

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

  const timers = [
    setTimeout(kick, 0),
    setTimeout(kick, 300),
    setTimeout(kick, 1000),
  ];

  const mediaEvents = ['loadeddata', 'canplay', 'canplaythrough'];
  mediaEvents.forEach((e) => video.addEventListener(e, kick));

  const interactions = [
    'pointerdown',
    'touchstart',
    'keydown',
    'click',
    'scroll',
    'wheel',
  ];
  const onInteract = () => kick();
  interactions.forEach((e) =>
    window.addEventListener(e, onInteract, { passive: true })
  );

  const onVisible = () => {
    if (document.visibilityState === 'visible') kick();
  };
  document.addEventListener('visibilitychange', onVisible);

  kick();

  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
    mediaEvents.forEach((e) => video.removeEventListener(e, kick));
    interactions.forEach((e) => window.removeEventListener(e, onInteract));
    document.removeEventListener('visibilitychange', onVisible);
  };
}
