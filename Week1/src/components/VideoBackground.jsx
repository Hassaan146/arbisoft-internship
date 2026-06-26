import { useRef } from 'react';
import { VIDEO_URL } from '../videoSource.js';
import { useAutoplayVideo } from '../hooks/index.js';

/**
 * The cinematic flower clip, autoplaying on a loop behind the glass pages so the
 * whole app shares one continuous, moving background.
 */
export default function VideoBackground() {
  const ref = useRef(null);
  useAutoplayVideo(ref);

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
        src={VIDEO_URL}
      />
    </div>
  );
}
