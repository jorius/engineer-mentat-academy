// packages
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// @testing-library/react's own auto-cleanup only registers when it finds a
// global `afterEach` (e.g. `test.globals: true`); this project imports test
// APIs explicitly instead, so register cleanup here to keep tests isolated.
afterEach(cleanup);
