// packages
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// i18n
import i18n from './src/i18n';

// @testing-library/react's own auto-cleanup only registers when it finds a
// global `afterEach` (e.g. `test.globals: true`); this project imports test
// APIs explicitly instead, so register cleanup here to keep tests isolated.
afterEach(cleanup);

// Tests query English copy; pin the language regardless of the host locale or a
// test that switched it.
await i18n.changeLanguage('en');
afterEach(async (): Promise<void> => {
  await i18n.changeLanguage('en');
});
