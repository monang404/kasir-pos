import { defineConfig } from 'vitest/config';

// Test frontend disentralisasi di tests/frontend/ (mirror terhadap frontend/src/),
// bukan di frontend/src/**/*.test.tsx — lihat tests/frontend/README.md.
export default defineConfig({
  test: {
    include: ['../tests/frontend/**/*.{test,spec}.{ts,tsx}'],
  },
});
