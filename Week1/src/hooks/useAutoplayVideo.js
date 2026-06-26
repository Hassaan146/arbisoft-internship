import { useEffect, useState, useCallback } from 'react';
import { autoplayLoop } from '../videoSource.js';

/**
 * Drive a muted background `<video>` (by ref) so it autoplays and loops.
 * Wraps the imperative `autoplayLoop` helper and, when `detectBlocked` is on,
 * exposes a `blocked` flag + manual `play()` for the rare browser that refuses
 * muted autoplay.
 */
export function useAutoplayVideo(videoRef, { detectBlocked = false } = {}) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const stop = autoplayLoop(video);
    if (!detectBlocked) return stop;

    const onPlaying = () => setBlocked(false);
    video.addEventListener('playing', onPlaying);
    // 1400ms: long enough for autoplay to settle before showing a manual hint.
    const timer = setTimeout(() => {
      if (video.paused) setBlocked(true);
    }, 1400);

    return () => {
      video.removeEventListener('playing', onPlaying);
      clearTimeout(timer);
      stop();
    };
  }, [videoRef, detectBlocked]);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
    setBlocked(false);
  }, [videoRef]);

  return { blocked, play };
}
