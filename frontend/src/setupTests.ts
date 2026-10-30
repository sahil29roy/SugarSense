import '@testing-library/jest-dom/vitest';

// Stub window.scrollTo for JSDOM
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
