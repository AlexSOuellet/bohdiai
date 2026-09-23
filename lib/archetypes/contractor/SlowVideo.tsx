'use client';

/**
 * Job footage plays slowed — a calm, almost slow-motion read of the work
 * instead of shaky phone-speed video. Browsers have no attribute for playback
 * speed, so it's set on the element once it can play.
 */
import { forwardRef, useCallback, type ComponentPropsWithoutRef } from 'react';

export const PLAYBACK_RATE = 0.6;

type Props = Omit<ComponentPropsWithoutRef<'video'>, 'onLoadedMetadata'>;

export const SlowVideo = forwardRef<HTMLVideoElement, Props>(function SlowVideo(props, outer) {
  const setRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el !== null) {
        el.defaultPlaybackRate = PLAYBACK_RATE;
        el.playbackRate = PLAYBACK_RATE;
      }
      if (typeof outer === 'function') outer(el);
      else if (outer !== null) outer.current = el;
    },
    [outer],
  );
  return (
    <video
      {...props}
      ref={setRef}
      onLoadedMetadata={(e) => {
        e.currentTarget.playbackRate = PLAYBACK_RATE;
      }}
    />
  );
});
