import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees after every test so they don't leak into the next one.
afterEach(() => {
  cleanup();
});

// jsdom implements neither media playback nor canvas rendering. Stub them so
// components that mount the background <video> / particle <canvas> render
// quietly during tests instead of emitting "Not implemented" noise.
window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLCanvasElement.prototype.getContext = () => null;

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {},
  });
}

// jsdom has no IntersectionObserver — the landing's scroll-reveal hook needs it.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
