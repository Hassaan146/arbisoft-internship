import { useEffect, useRef } from 'react';
import { VIDEO_URL } from '../videoSource.js';

/**
 * The same cinematic flower clip as the landing, gently looping behind the
 * glass pages so the whole app shares one continuous background.
 * Pauses for users who prefer reduced motion.
 */
export default function VideoBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      v.removeAttribute('autoplay');
      v.pause();
    }
  }, []);

  return (
    <div className="scene-bg" aria-hidden="true">
      <video
        ref={ref}
        className="bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        src={VIDEO_URL}
      />
    </div>
  );
}
