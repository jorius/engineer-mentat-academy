// packages
import { describe, expect, it } from 'vitest';

// engine
import { createSqlRunner } from './runSql';
import { loadSqlInNode } from './nodeLoader';

const schema = `
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, total REAL);
INSERT INTO orders VALUES (1, 'ana', 10.5), (2, 'ana', 4.5), (3, 'luis', 7);
`;

describe('createSqlRunner', () => {
  const run = createSqlRunner(loadSqlInNode);

  it('returns columns and rows for a grouped query', async () => {
    const result = await run(schema, 'SELECT customer, SUM(total) AS spent FROM orders GROUP BY customer ORDER BY customer');
    expect(result.status).toBe('ok');
    expect(result.columns).toEqual(['customer', 'spent']);
    expect(result.rows).toEqual([['ana', 15], ['luis', 7]]);
  });

  it('returns an empty result for a query with no rows', async () => {
    const result = await run(schema, 'SELECT * FROM orders WHERE total > 100');
    expect(result).toEqual({ status: 'ok', columns: [], rows: [] });
  });

  it('reports a SQL error', async () => {
    const result = await run(schema, 'SELECT nope FROM orders');
    expect(result.status).toBe('error');
    expect(result.error).toMatch(/no such column/);
  });

  it('uses a fresh database per run', async () => {
    await run(schema, "INSERT INTO orders VALUES (9, 'x', 1)");
    const result = await run(schema, 'SELECT COUNT(*) FROM orders');
    expect(result.rows).toEqual([[3]]);
  });

  it('reports a loader failure as an error result and retries on the next run', async () => {
    let calls = 0;
    const flaky = createSqlRunner(async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('wasm unavailable');
      }
      return loadSqlInNode();
    });
    const first = await flaky('CREATE TABLE t(a INT);', 'SELECT 1');
    expect(first).toEqual({ status: 'error', columns: [], rows: [], error: 'wasm unavailable' });
    const second = await flaky('CREATE TABLE t(a INT);', 'SELECT 1');
    expect(second.status).toBe('ok');
    expect(calls).toBe(2);
  });
});
