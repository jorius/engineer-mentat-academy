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

const org = `
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  dept_id INTEGER REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL
);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Legal');
INSERT INTO employees VALUES
  (1, 'Ada', 1, NULL, 200), (2, 'Ben', 1, 1, 150), (3, 'Cy', 1, 2, 160),
  (4, 'Dee', 2, 1, 130), (5, 'Eve', 2, 4, 130), (6, 'Finn', NULL, 4, 140),
  (7, 'Gus', 2, 4, 70);
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
  {
    id: 'sql-null-not-equal-trap',
    domain: 'databases',
    subject: 'sql',
    topic: 'fundamentals',
    level: 'junior',
    kind: 'sql',
    prompt:
      'Return the `name` of every employee who is **not** managed by Ada (`manager_id = 1`). An employee with no manager at all also counts as "not managed by Ada". Any order.',
    schema: org,
    answer: `SELECT name
FROM employees
WHERE manager_id IS NULL OR manager_id <> 1`,
    expectedRows: [['Ada'], ['Cy'], ['Eve'], ['Finn'], ['Gus']],
    tags: ['null', 'three-valued-logic'],
    source: 'topic-list',
    explanation:
      'SQL uses three-valued logic: `NULL <> 1` is `NULL` (unknown), not `true`, and `WHERE` keeps only rows where the predicate is `true`. So `WHERE manager_id <> 1` silently drops Ada. Handle the `NULL` explicitly with `IS NULL OR ...`, or use the null-safe operator of your engine: `IS NOT 1` in SQLite, `IS DISTINCT FROM 1` in Postgres, `NOT (manager_id <=> 1)` in MySQL.',
  },
  {
    id: 'sql-not-in-with-null-subquery',
    domain: 'databases',
    subject: 'sql',
    topic: 'fundamentals',
    level: 'senior',
    kind: 'sql',
    prompt:
      'Return the `name` of every employee who **manages nobody** (no other employee has them as `manager_id`). Any order. Watch out: one employee has a `NULL` `manager_id`.',
    schema: org,
    answer: `SELECT e.name
FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM employees r WHERE r.manager_id = e.id
)`,
    expectedRows: [['Cy'], ['Eve'], ['Finn'], ['Gus']],
    tags: ['not-in', 'not-exists', 'null', 'anti-join'],
    source: 'topic-list',
    explanation:
      'The tempting `WHERE id NOT IN (SELECT manager_id FROM employees)` returns **zero rows**. `x NOT IN (1, 2, 4, NULL)` expands to `x <> 1 AND x <> 2 AND x <> 4 AND x <> NULL`; the last term is unknown, so the whole predicate can never be `true`. `NOT EXISTS` (or `LEFT JOIN ... WHERE r.id IS NULL`) is null-safe and is also the form optimizers turn into an anti-join most reliably. If you must use `NOT IN`, filter the subquery with `WHERE manager_id IS NOT NULL`.\n\n**Say this out loud:** "I default to `NOT EXISTS` for anti-joins, because a single `NULL` in a `NOT IN` subquery makes the whole predicate unknown and the query returns nothing."',
  },
  {
    id: 'sql-employee-earns-more-than-manager',
    domain: 'databases',
    subject: 'sql',
    topic: 'joins',
    level: 'mid',
    kind: 'sql',
    prompt:
      'Return every employee who earns **strictly more** than their direct manager. Columns: `employee`, `manager` (both names). Any order.',
    schema: org,
    answer: `SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary`,
    expectedRows: [
      ['Cy', 'Ben'],
      ['Finn', 'Dee'],
    ],
    tags: ['self-join'],
    source: 'topic-list',
    explanation:
      'A self-join aliases the same table twice: `e` is the employee row and `m` is the manager row found through `e.manager_id`. An inner join is right here because an employee without a manager (Ada) cannot out-earn one. Eve earns exactly what Dee earns, so `>` excludes her; `>=` would be a different question. Note that Finn has no department, which does not matter because departments are not joined.',
  },
  {
    id: 'sql-headcount-count-variants',
    domain: 'databases',
    subject: 'sql',
    topic: 'aggregation',
    level: 'junior',
    kind: 'sql',
    prompt:
      'In one row, return: the number of employees (`employees`), the number of employees who have a manager (`with_manager`), and the number of distinct people who manage someone (`managers`).',
    schema: org,
    answer: `SELECT COUNT(*) AS employees,
       COUNT(manager_id) AS with_manager,
       COUNT(DISTINCT manager_id) AS managers
FROM employees`,
    expectedRows: [[7, 6, 3]],
    tags: ['count', 'distinct', 'null'],
    source: 'topic-list',
    explanation:
      '`COUNT(*)` counts rows. `COUNT(col)` counts rows where `col` is not `NULL`, so Ada is skipped. `COUNT(DISTINCT col)` also ignores `NULL` and collapses duplicates: the manager ids are 1, 2 and 4. Every aggregate except `COUNT(*)` ignores `NULL`s, which is also why `AVG(col)` is not the same as `SUM(col) / COUNT(*)`.',
  },
  {
    id: 'sql-payroll-share-integer-division',
    domain: 'databases',
    subject: 'sql',
    topic: 'aggregation',
    level: 'mid',
    kind: 'sql',
    prompt:
      'For every department that has at least one employee, return its share of the **whole company payroll** (including employees with no department) as a whole-number percentage, rounded down. Columns: `department`, `pct`. Any order. `salary` is an `INTEGER` column.',
    schema: org,
    answer: `SELECT d.name AS department,
       SUM(e.salary) * 100 / (SELECT SUM(salary) FROM employees) AS pct
FROM departments d
JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name`,
    expectedRows: [
      ['Engineering', 52],
      ['Sales', 33],
    ],
    tags: ['integer-division', 'scalar-subquery', 'group-by'],
    source: 'topic-list',
    explanation:
      'The payroll is 980. Engineering has 510 and Sales 330. In SQLite, Postgres and SQL Server, `INTEGER / INTEGER` is integer division, so `SUM(e.salary) / 980 * 100` gives `0 * 100 = 0` for both. Multiply first (`51000 / 980 = 52`), or cast one side to a real (`SUM(e.salary) * 100.0 / ...`) and truncate at the end. MySQL is the odd one out: its `/` always returns a decimal, and `DIV` is integer division. The scalar subquery gives the denominator without a second pass in application code.',
  },
  {
    id: 'sql-running-total-by-date',
    domain: 'databases',
    subject: 'sql',
    topic: 'aggregation',
    level: 'mid',
    kind: 'sql',
    prompt:
      'Return every order with a running total of revenue up to and including that order, in date order. Columns: `id`, `created_at`, `running_total`. Order by `created_at`. Dates are unique.',
    schema: shop,
    answer: `SELECT o.id, o.created_at,
       (SELECT SUM(p.total) FROM orders p WHERE p.created_at <= o.created_at) AS running_total
FROM orders o
ORDER BY o.created_at`,
    expectedRows: [
      [1, '2026-09-01', 120],
      [3, '2026-09-02', 160],
      [2, '2026-09-03', 240],
      [4, '2026-09-04', 540],
      [5, '2026-09-05', 560],
    ],
    ordered: true,
    tags: ['running-total', 'correlated-subquery', 'window-functions'],
    source: 'topic-list',
    explanation:
      'The correlated subquery sums every order dated on or before the current one. It works on any engine but is O(n²): each row rescans the table (an index on `created_at` makes each rescan a range scan, which helps but does not change the shape). With window functions (SQLite 3.25+, Postgres, MySQL 8) write `SUM(total) OVER (ORDER BY created_at)`, which computes it in one ordered pass. If dates could repeat, the default `RANGE` frame would give tied rows the same total; add a tiebreaker and `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` for a strict per-row total.',
  },
  {
    id: 'sql-salary-bands-case',
    domain: 'databases',
    subject: 'sql',
    topic: 'group-by',
    level: 'junior',
    kind: 'sql',
    prompt:
      'Bucket employees by salary: `low` (below 100), `mid` (100 to 149), `high` (150 and above). Return each band with its headcount. Columns: `band`, `headcount`. Any order.',
    schema: org,
    answer: `SELECT CASE
         WHEN salary < 100 THEN 'low'
         WHEN salary < 150 THEN 'mid'
         ELSE 'high'
       END AS band,
       COUNT(*) AS headcount
FROM employees
GROUP BY band`,
    expectedRows: [
      ['high', 3],
      ['mid', 3],
      ['low', 1],
    ],
    tags: ['case', 'bucketing'],
    source: 'topic-list',
    explanation:
      '`CASE` evaluates its `WHEN` branches top to bottom and stops at the first match, so the second branch only needs `< 150`. Grouping by the `CASE` expression (or its alias, which SQLite, Postgres and MySQL all allow in `GROUP BY`) turns a derived value into a group key. A band with no employees would simply be absent; to show it with 0 you would left-join from a list of bands.',
  },
  {
    id: 'sql-bare-column-group-by',
    domain: 'databases',
    subject: 'sql',
    topic: 'group-by',
    level: 'senior',
    kind: 'single',
    prompt:
      'A teammate wants the top earner per department and writes:\n\n```sql\nSELECT dept_id, name, MAX(salary)\nFROM employees\nGROUP BY dept_id;\n```\n\nWhat happens?',
    options: [
      { id: 'a', text: 'It is a syntax error on every mainstream engine because `name` is neither grouped nor aggregated.' },
      {
        id: 'b',
        text: 'SQLite runs it and returns the `name` from the row holding the max; Postgres rejects it; MySQL rejects it under the default `ONLY_FULL_GROUP_BY`.',
      },
      { id: 'c', text: 'Every engine runs it and returns the name from the first row of each group, so it is portable but unreliable.' },
      { id: 'd', text: 'It returns one row per employee, because `name` is in the select list and implicitly joins the grouping key.' },
    ],
    answer: 'b',
    tags: ['bare-columns', 'portability', 'greatest-n-per-group'],
    source: 'topic-list',
    explanation:
      'Standard SQL only allows columns in the select list that are grouped, aggregated, or functionally dependent on the group key (Postgres accepts non-grouped columns of a table whose primary key is grouped). SQLite has a documented special case: with a single `MIN()` or `MAX()`, bare columns come from the row that produced the extreme value; with ties, or with any other aggregate, the row is arbitrary. MySQL without `ONLY_FULL_GROUP_BY` returns an arbitrary value. The portable answer is a correlated subquery, a join to a grouped subquery, or `RANK()` over a partition.\n\n**Say this out loud:** "A bare column in a grouped query is non-portable and non-deterministic on ties; I solve greatest-per-group with a window function or a join back to the grouped max."',
  },
  {
    id: 'sql-top-earner-per-department-ties',
    domain: 'databases',
    subject: 'sql',
    topic: 'group-by',
    level: 'senior',
    kind: 'sql',
    prompt:
      'Return the highest-paid employee of each department. **If several people tie for the top salary, return all of them.** Skip employees with no department. Columns: `department`, `name`, `salary`. Order by `department`, then `name`.',
    schema: org,
    answer: `SELECT d.name AS department, e.name, e.salary
FROM employees e
JOIN departments d ON d.id = e.dept_id
WHERE e.salary = (
  SELECT MAX(x.salary) FROM employees x WHERE x.dept_id = e.dept_id
)
ORDER BY department, e.name`,
    expectedRows: [
      ['Engineering', 'Ada', 200],
      ['Sales', 'Dee', 130],
      ['Sales', 'Eve', 130],
    ],
    ordered: true,
    tags: ['greatest-n-per-group', 'correlated-subquery', 'window-functions', 'ties'],
    source: 'topic-list',
    explanation:
      'This is the greatest-n-per-group problem. Options: a correlated subquery against the per-department max (above), a join to `SELECT dept_id, MAX(salary) ... GROUP BY dept_id`, or `RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) = 1` in a subquery. The tie rule decides the function: `RANK`/`DENSE_RANK` keep both Dee and Eve, `ROW_NUMBER` picks one arbitrarily. A bare `name` next to `MAX(salary)` would also return only one of them. Finn has `dept_id NULL`, so the inner join drops him, and `x.dept_id = NULL` would never match anyway.\n\n**Say this out loud:** "First I ask how ties should behave, because that decides between `ROW_NUMBER` and `RANK`; then I pick a window function or a join to the grouped max."',
  },
  {
    id: 'sql-composite-index-leftmost-prefix',
    domain: 'databases',
    subject: 'sql',
    topic: 'indexing',
    level: 'senior',
    kind: 'multi',
    prompt:
      'The `orders` table has a B-tree index `CREATE INDEX ix_orders_cust_created ON orders (customer_id, created_at);`. Which queries can use it to **seek** into a narrow range, rather than scanning the whole table or the whole index? Select all that apply.',
    options: [
      { id: 'a', text: '`WHERE customer_id = 7`' },
      { id: 'b', text: "`WHERE customer_id = 7 AND created_at >= '2026-09-01'`" },
      { id: 'c', text: "`WHERE created_at >= '2026-09-01'`" },
      { id: 'd', text: '`WHERE customer_id = 7 ORDER BY created_at DESC LIMIT 10` (and it also avoids a sort)' },
      { id: 'e', text: "`WHERE customer_id > 7 AND created_at = '2026-09-01'` (seeks on both columns)" },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['composite-index', 'leftmost-prefix', 'explain'],
    source: 'topic-list',
    explanation:
      'A composite B-tree is sorted by `customer_id`, then by `created_at` within each customer. It can seek on any **leftmost prefix** of its columns: equality on `customer_id` (a), equality then a range on `created_at` (b). Within one customer the entries are already in `created_at` order, so (d) walks the index backwards and stops after 10 rows with no sort step. (c) skips the leading column, so there is no contiguous range to seek; some engines can do a skip scan, but only when the leading column has few distinct values. In (e) the range on the first column ends the seekable prefix: the engine seeks `customer_id > 7` and then checks `created_at` row by row. Rule of thumb: equality columns first, then the range or sort column.\n\n**Say this out loud:** "I order composite index columns as equality predicates first, then the range or `ORDER BY` column, because the index can only seek on a leftmost prefix and a range stops the prefix."',
  },
  {
    id: 'sql-like-leading-wildcard',
    domain: 'databases',
    subject: 'sql',
    topic: 'indexing',
    level: 'mid',
    kind: 'single',
    prompt:
      "`customers.email` has a B-tree index. Why does `WHERE email LIKE '%@example.com'` still scan every row, while `WHERE email LIKE 'ana%'` can use the index?",
    options: [
      { id: 'a', text: '`LIKE` never uses indexes; the second query is fast only because of the result cache.' },
      {
        id: 'b',
        text: 'A B-tree is ordered by the value from its first character, so a known prefix maps to one contiguous key range, while a leading wildcard gives no starting point to seek to.',
      },
      { id: 'c', text: 'The optimizer ignores indexes whenever the pattern contains a special character such as `@`.' },
      { id: 'd', text: 'Leading wildcards force a case-insensitive comparison, and case-insensitive comparisons disable indexes.' },
    ],
    answer: 'b',
    tags: ['like', 'sargable', 'b-tree', 'full-text'],
    source: 'topic-list',
    explanation:
      "`LIKE 'ana%'` is rewritten as the range `email >= 'ana' AND email < 'anb'`, a seek. `'%@example.com'` could start anywhere, so the engine must test every row (at best a full index scan). Fixes for suffix search: index a reversed copy of the column and search `LIKE reverse('%@example.com')` as a prefix, store the domain in its own indexed column, or use a trigram index (`pg_trgm` GIN in Postgres) or full-text search for infix matches. Engine caveats: prefix `LIKE` also needs a compatible collation (Postgres needs `text_pattern_ops` under a non-C locale; SQLite needs the index collation to match its case-insensitive `LIKE`).",
  },
  {
    id: 'sql-covering-index-tradeoffs',
    domain: 'databases',
    subject: 'sql',
    topic: 'indexing',
    level: 'senior',
    kind: 'open',
    prompt:
      'A hot endpoint runs `SELECT id, total FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20`. There is already an index on `customer_id`. What is a covering index, would you add one here, and what does it cost?',
    modelAnswer:
      'A covering index contains every column the query needs, so the engine answers from the index alone (an index-only scan) and never fetches the table rows. Here I would replace the single-column index with `(customer_id, created_at DESC)` and carry `total` along, either as a trailing key column or with `INCLUDE (total)` in Postgres and SQL Server; `id` is already available (the primary key is stored in secondary indexes in InnoDB, and SQLite stores the rowid). That turns "seek, then sort, then 20 random table lookups" into one ordered range read that stops after 20 entries. The costs: every insert and every update to those columns now writes one more index, the index takes disk and buffer-cache space, and a wide `INCLUDE` list makes the index nearly a copy of the table. In Postgres an index-only scan also depends on the visibility map, so a table with heavy churn and lagging vacuum still visits the heap. I would confirm the gain with `EXPLAIN ANALYZE` before and after, and drop the now-redundant `customer_id` index because the new one serves the same lookups.',
    rubric: [
      'Defines covering index as answering the query from the index without table lookups (index-only scan)',
      'Puts `customer_id` then `created_at` in the key so the index also satisfies the `ORDER BY ... LIMIT` without a sort',
      'Names the write amplification and storage cost, not only the read benefit',
      'Mentions verifying with `EXPLAIN` / `EXPLAIN ANALYZE` and removing the redundant single-column index',
    ],
    tags: ['covering-index', 'include', 'index-only-scan', 'write-amplification'],
    source: 'topic-list',
    explanation:
      'The senior signal is treating an index as a trade: design it for the exact access path (filter, order, projection), then pay for it on every write. The leftmost-prefix rule means the new composite index makes the old single-column one redundant.\n\n**Say this out loud:** "I design the index for the whole access path, filter, then sort, then the projected columns, so the query becomes a single index range read; and I remember every index I add is paid for on every write."',
  },
  {
    id: 'sql-n-plus-one-at-sql-layer',
    domain: 'databases',
    subject: 'sql',
    topic: 'query-optimization',
    level: 'mid',
    kind: 'single',
    prompt:
      'The database log for one page load shows:\n\n```sql\nSELECT id, name FROM customers WHERE country = \'CO\';\nSELECT * FROM orders WHERE customer_id = 1;\nSELECT * FROM orders WHERE customer_id = 2;\n-- ... one more per customer\n```\n\nWhich change fixes the underlying problem?',
    options: [
      { id: 'a', text: 'Add an index on `orders.customer_id` so each per-customer query is faster.' },
      {
        id: 'b',
        text: 'Fetch the orders for all customers in one statement, either with a `JOIN` or with `WHERE customer_id IN (...)`, and group them in the application.',
      },
      { id: 'c', text: 'Run the per-customer queries in parallel with `Promise.all`.' },
      { id: 'd', text: 'Raise the connection pool size so the queries do not queue.' },
    ],
    answer: 'b',
    tags: ['n-plus-one', 'orm', 'batching'],
    source: 'topic-list',
    explanation:
      'This is the N+1 pattern: one query for the parent list plus one per parent. Each statement pays a network round trip, parsing and planning, so latency grows linearly with N even when every query is fast. The fix removes round trips: one `JOIN`, or two queries total (parents, then `IN (...)` for children, which is what ORM eager loading and GraphQL DataLoader do). The index (a) is worth having but still leaves N round trips. Parallelism (c) and a bigger pool (d) move the load onto the database and exhaust connections under concurrency.',
  },
  {
    id: 'sql-non-sargable-predicates',
    domain: 'databases',
    subject: 'sql',
    topic: 'query-optimization',
    level: 'mid',
    kind: 'multi',
    prompt:
      '`orders.created_at` (a `TIMESTAMP`) and `customers.email` (a `VARCHAR`) each have a plain B-tree index, and there are no expression indexes. Which predicates **prevent** the engine from seeking on those indexes? Select all that apply.',
    options: [
      { id: 'a', text: "`WHERE DATE(created_at) = '2026-09-01'`" },
      { id: 'b', text: "`WHERE created_at >= '2026-09-01' AND created_at < '2026-09-02'`" },
      { id: 'c', text: "`WHERE LOWER(email) = 'ana@example.com'`" },
      { id: 'd', text: "`WHERE created_at + INTERVAL '1 day' > NOW()`" },
      { id: 'e', text: "`WHERE email = 'ana@example.com'`" },
    ],
    answer: ['a', 'c', 'd'],
    tags: ['sargable', 'expression-index', 'explain'],
    source: 'topic-list',
    explanation:
      'An index stores the raw column value, so a predicate can seek only when the column stands alone on one side of the comparison ("sargable"). Wrapping the column in a function (a, c) or doing arithmetic on it (d) forces the engine to compute the expression for every row. Rewrite (a) as the half-open range in (b), and (d) as `created_at > NOW() - INTERVAL \'1 day\'`. For case-insensitive email lookups, add an expression index on `LOWER(email)` or use a case-insensitive type or collation (`citext` in Postgres). Another quiet cause is an implicit cast, such as comparing a `VARCHAR` column with a number in MySQL.',
  },
  {
    id: 'sql-diagnose-slow-query-explain',
    domain: 'databases',
    subject: 'sql',
    topic: 'query-optimization',
    level: 'senior',
    kind: 'open',
    prompt:
      'A report query that used to take 200 ms now takes 12 s in production. Nothing in the code changed. Walk me through how you diagnose and fix it.',
    modelAnswer:
      'First I reproduce it with the real parameters and capture the plan with `EXPLAIN (ANALYZE, BUFFERS)` in Postgres or `EXPLAIN ANALYZE` in MySQL 8, ideally on a production-sized replica, and I compare it with the old plan if `pg_stat_statements` or `auto_explain` history exists. I read the plan from the most expensive node outward, looking for a sequential scan on a large table, a nested loop over many more rows than expected, or a sort or hash spilling to disk. The biggest clue is estimated rows against actual rows: a large gap usually means stale or insufficient statistics after data growth, so I run `ANALYZE` (or raise the statistics target for a skewed column) and check whether the plan flips back. If it is a parameter-sensitive plan (a generic cached plan chosen for a skewed value), I address that specifically. Then I check the predicates: non-sargable filters, implicit casts, or a missing composite index for the new data distribution. I also rule out non-plan causes: lock waits, table or index bloat, and a cold cache after a failover. The fix is the smallest one that addresses the cause (fresh statistics, a targeted index, or a rewritten predicate), verified with a new plan, and then I add monitoring so the next regression is caught before users report it.',
    rubric: [
      'Uses `EXPLAIN ANALYZE` (actual execution), not only `EXPLAIN`, and reads it from the costliest node',
      'Compares estimated vs actual rows and connects a large gap to stale statistics or data growth or skew',
      'Checks predicates for sargability and indexes that match the access pattern',
      'Rules out non-plan causes such as locks, bloat or a cold cache',
      'Verifies the fix with a new plan and adds monitoring (for example `pg_stat_statements` or a slow-query log)',
    ],
    tags: ['explain-analyze', 'statistics', 'plan-regression', 'production-debugging'],
    source: 'topic-list',
    explanation:
      '"Nothing changed" usually means the data changed: growth or skew pushed the optimizer past a cost threshold, or statistics went stale so it misjudged cardinalities. A strong answer is a method (measure, read the plan, form a hypothesis, make the smallest fix, verify), not a list of tuning tricks.\n\n**Say this out loud:** "When the code did not change, I assume the data or the statistics did; I compare estimated and actual rows in `EXPLAIN ANALYZE` to find where the optimizer went wrong."',
  },
];
