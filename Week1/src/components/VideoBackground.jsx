import { useEffect, useRef } from 'react';
import { VIDEO_URL, autoplayLoop } from '../videoSource.js';

/**
 * The cinematic flower clip, autoplaying on a loop behind the glass pages so the
 * whole app shares one continuous, moving background.
 */
export default function VideoBackground() {
  const ref = useRef(null);

  useEffect(() => autoplayLoop(ref.current), []);

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
