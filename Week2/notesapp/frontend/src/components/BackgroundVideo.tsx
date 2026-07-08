import { useEffect, useRef } from 'react';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4';

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // start fading out when this many seconds remain

// Full-screen looping background video with a custom JavaScript fade system
// (no CSS transitions): fade in on load/loop, fade out near the end, and a
// seamless reset on `ended`. Each new fade cancels any running frame and
// resumes from the current opacity so fades never snap.
export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);
  const fadedInRef = useRef(false);
  const resettingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentOpacity = () => parseFloat(video.style.opacity || '0') || 0;

    const animateOpacity = (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const from = currentOpacity();
      const delta = target - from;
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min((now - start) / FADE_MS, 1);
        video.style.opacity = String(from + delta * t);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const handleFadeIn = () => {
      // loadeddata and play can both fire for the same play cycle; only the
      // first should kick off the fade-in so we don't restart it twice.
      if (fadedInRef.current) return;
      fadedInRef.current = true;
      fadingOutRef.current = false;
      animateOpacity(1);
    };

    const resetLoop = () => {
      // Guard against `ended` and the timeupdate fallback both firing (or
      // timeupdate firing repeatedly) before currentTime has been reset.
      if (resettingRef.current) return;
      resettingRef.current = true;
      video.style.opacity = '0';
      fadedInRef.current = false;
      fadingOutRef.current = false;
      setTimeout(() => {
        video.currentTime = 0;
        void video.play();
        resettingRef.current = false;
        handleFadeIn();
      }, 100);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_LEAD && !fadingOutRef.current) {
        fadingOutRef.current = true;
        animateOpacity(0);
      }
      // Robustness: if `ended` is missed, a near-zero remaining time still
      // triggers the seamless reset so the hero can't get stuck at opacity 0.
      if (remaining <= 0.03) {
        resetLoop();
      }
    };

    const handleEnded = () => {
      resetLoop();
    };

    video.style.opacity = '0';
    video.addEventListener('loadeddata', handleFadeIn);
    video.addEventListener('play', handleFadeIn);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      video.removeEventListener('loadeddata', handleFadeIn);
      video.removeEventListener('play', handleFadeIn);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full translate-y-[17%] object-cover"
      src={VIDEO_SRC}
      autoPlay
      muted
      playsInline
      style={{ opacity: 0 }}
    />
  );
}
