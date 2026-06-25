import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees after every test so they don't leak into the next one.
afterEach(() => {
  cleanup();
});
