import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Date helpers work in the machine's time zone. Pin one with daylight saving time so results are the same everywhere
// and the DST tests cross a real change. Set here, before the test workers start, so they inherit it.
process.env.TZ = 'America/New_York';

export default defineConfig({
  resolve: {
    // Same mapping as `paths` in tsconfig.json.
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
