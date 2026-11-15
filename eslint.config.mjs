// ABOUTME: ESLint flat config for the site: Next.js's core-web-vitals rules.
// ABOUTME: Run with `npm run lint`; Next.js 16 no longer has a `next lint` command.

import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
    ...nextVitals,
]);

export default eslintConfig;
