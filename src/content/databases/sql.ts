// engine
import type { Question } from '../../engine/question';

const shop = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL);
INSERT INTO customers VALUES (1, 'Ana', 'CO'), (2, 'Luis', 'CO'), (3, 'Mia', 'US'), (4, 'Tom', 'US');
INSERT INTO orders VALUES
  (1, 1, 120.0, '2026-09-01'), (2, 1, 80.0, '2026-09-03'), (3, 2, 40.0, '2026-09-02'),
  (4, 3, 300.0, '2026-09-04'), (5, 3, 20.0, '2026-09-05');
`;

export const questions: Question[] = [
  {
    id: 'sql-total-per-customer-with-zero',
    domain: 'databases',
    subject: 'sql',
    topic: 'joins',
    level: 'mid',
    kind: 'sql',
    prompt: 'Return every customer name with their total order amount, **including customers with no orders** (as 0). Columns: `name`, `spent`. Order by `spent` descending, then `name`.',
    schema: shop,
    answer: `SELECT c.name, COALESCE(SUM(o.total), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY spent DESC, c.name`,
    expectedRows: [['Mia', 320], ['Ana', 200], ['Luis', 40], ['Tom', 0]],
    ordered: true,
    tags: ['left-join', 'coalesce', 'group-by'],
    source: 'topic-list',
    explanation: 'An inner join would drop Tom. `COALESCE` turns the `NULL` sum into 0. Grouping by the primary key keeps the query valid under strict `GROUP BY` rules in Postgres and MySQL `ONLY_FULL_GROUP_BY`.',
  },
  {
    id: 'sql-countries-over-threshold',
    domain: 'databases',
    subject: 'sql',
    topic: 'aggregation',
    level: 'junior',
    kind: 'sql',
    prompt: 'Return the countries whose customers spent more than 150 in total. Columns: `country`, `spent`. Any order.',
    schema: shop,
    answer: `SELECT c.country, SUM(o.total) AS spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.country
HAVING SUM(o.total) > 150`,
    expectedRows: [['CO', 240], ['US', 320]],
    tags: ['having', 'group-by'],
    source: 'topic-list',
    explanation: '`WHERE` filters rows before aggregation; `HAVING` filters groups after it. Putting the condition in `WHERE` would be a syntax error because the aggregate does not exist yet.',
  },
];
