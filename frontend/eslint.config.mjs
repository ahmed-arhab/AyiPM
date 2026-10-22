import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Node scripts outside the app (see package.json "start") are CommonJS, so they load modules with require().
    files: ['**/*.cjs', 'scripts/**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // Replaces eslint-config-next's default ignores, so its entries are repeated here.
  globalIgnores([
    // Build and test output
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    // Generated from the backend's OpenAPI spec; regenerate it instead of editing it.
    'src/types/api.generated.ts',
  ]),
]);

export default eslintConfig;
