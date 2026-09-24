// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'prisma-select-vs-include',
    domain: 'libraries',
    subject: 'prisma',
    topic: 'orm-usage',
    level: 'junior',
    kind: 'single',
    prompt: "Which Prisma query returns each user's `email` and their `posts`, and **no other** `User` fields?",
    options: [
      { id: 'a', text: '```ts\nprisma.user.findMany({\n  select: { email: true, posts: true },\n});\n```' },
      { id: 'b', text: '```ts\nprisma.user.findMany({\n  select: { email: true },\n  include: { posts: true },\n});\n```' },
      { id: 'c', text: '```ts\nprisma.user.findMany({\n  include: { email: true, posts: true },\n});\n```' },
      { id: 'd', text: '```ts\nprisma.user.findMany({\n  where: { posts: { some: {} } },\n  select: { email: true },\n});\n```' },
    ],
    answer: 'a',
    tags: ['select', 'include', 'prisma-client'],
    source: 'topic-list',
    explanation:
      '`select` lists exactly what comes back, and a relation inside `select` is loaded too. `include` means "all scalar fields **plus** these relations". The two cannot be used at the same level (combining them is a validation error), and `include` only accepts relations, so `include: { email: true }` fails. The `where: { posts: { some: {} } }` query filters to users with posts but returns only emails. Selecting only the fields you need also keeps secrets such as `passwordHash` out of API responses, and the generated types follow the selection.',
  },
  {
    id: 'prisma-migrate-deploy',
    domain: 'libraries',
    subject: 'prisma',
    topic: 'orm-usage',
    level: 'mid',
    kind: 'single',
    prompt: 'Which Prisma CLI command belongs in the production deployment pipeline?',
    options: [
      { id: 'a', text: '`prisma migrate deploy`' },
      { id: 'b', text: '`prisma migrate dev`' },
      { id: 'c', text: '`prisma db push`' },
      { id: 'd', text: '`prisma migrate reset`' },
    ],
    answer: 'a',
    tags: ['migrations', 'ci-cd'],
    source: 'topic-list',
    explanation:
      '`migrate deploy` applies the committed migrations that have not run yet, records them in `_prisma_migrations`, and never generates new migrations or resets anything. `migrate dev` is for development: it uses a shadow database, creates new migrations from schema drift, and may offer to **reset** the database. `db push` syncs the schema without any migration history, which is fine for prototypes and dangerous for shared data. `migrate reset` drops the database. A failed migration in production is resolved with `prisma migrate resolve` after fixing it by hand, not by resetting.',
  },
  {
    id: 'prisma-include-query-shape',
    domain: 'libraries',
    subject: 'prisma',
    topic: 'n-plus-one',
    level: 'senior',
    kind: 'single',
    prompt:
      'Using the classic `query` relation load strategy, what does this call send to the database?\n```ts\nprisma.user.findMany({\n  take: 100,\n  include: { posts: true },\n});\n```',
    options: [
      { id: 'a', text: '101 queries: one for the users and one per user for posts' },
      { id: 'b', text: 'One query with a `LEFT JOIN` between `User` and `Post`' },
      { id: 'c', text: 'Two queries: the users, then `SELECT ... FROM "Post" WHERE "authorId" IN (...)`, stitched together in the client' },
      { id: 'd', text: 'One query per distinct author, run in parallel' },
    ],
    answer: 'c',
    tags: ['include', 'n-plus-one', 'relation-load-strategy', 'dataloader'],
    source: 'topic-list',
    explanation:
      'Prisma resolves each included relation with one extra batched `IN` query and joins the results in the query engine, so `include` is **not** N+1: it is 1 + (number of relations) queries. Prisma also offers a `join` strategy (`relationLoadStrategy: "join"`), which uses a single SQL query with lateral joins and JSON aggregation on PostgreSQL. N+1 comes back when you loop and call `findMany`/`findUnique` per row yourself. Prisma Client also batches `findUnique` calls made in the same tick (its built-in dataloader), which is why GraphQL resolvers that call `findUnique` per parent stay efficient, but only for `findUnique`.\n\n**Say this out loud:** "Prisma\'s `include` batches each relation into one `IN` query, so N+1 in Prisma comes from my own loops; I fix it with `include`, one `in` query, or rely on the `findUnique` batching in resolvers."',
  },
  {
    id: 'prisma-chunked-in-batching',
    domain: 'libraries',
    subject: 'prisma',
    topic: 'n-plus-one',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      "A nightly job needs post titles for tens of thousands of author ids. One `findMany` per author is N+1; one `findMany` with every id in a single `in` list builds one enormous statement and loads every row at once, and Prisma cannot always split it for you. `findMany` below fakes this call, counting queries and throwing when a call binds more than `chunkSize` ids:\n```ts\nprisma.post.findMany({\n  where: { authorId: { in: ids } },\n});\n```\n\nReturn `{ queries, titles }` where `titles[i]` holds the titles for `authorIds[i]` (table order, `[]` when none). De-duplicate the ids, split them into chunks of at most `chunkSize`, and send one query per chunk. Send no query for an empty list.",
    starter: `type Post = { id: number; authorId: number; title: string };

export function solution(table: Post[], authorIds: number[], chunkSize: number) {
  let queries = 0;
  // Fake of prisma.post.findMany({ where: { authorId: { in: ids } } }).
  const findMany = (args: { where: { authorId: { in: number[] } } }): Post[] => {
    const ids = args.where.authorId.in;
    if (ids.length > chunkSize) {
      throw new Error('too many bind variables: ' + ids.length);
    }
    queries += 1;
    return table.filter((post) => ids.includes(post.authorId));
  };

  // TODO: batch the lookups in chunks of at most chunkSize ids
  const titles: string[][] = [];
  return { queries, titles };
}`,
    tests: [
      {
        name: 'five authors in chunks of two',
        args: [
          [
            { id: 1, authorId: 1, title: 'a1' },
            { id: 2, authorId: 2, title: 'b1' },
            { id: 3, authorId: 3, title: 'c1' },
            { id: 4, authorId: 1, title: 'a2' },
            { id: 5, authorId: 5, title: 'e1' },
          ],
          [1, 2, 3, 4, 5],
          2,
        ],
        expected: { queries: 3, titles: [['a1', 'a2'], ['b1'], ['c1'], [], ['e1']] },
      },
      {
        name: 'duplicates are fetched once',
        args: [[{ id: 1, authorId: 1, title: 'a1' }, { id: 2, authorId: 2, title: 'b1' }], [2, 1, 2, 1], 2],
        expected: { queries: 1, titles: [['b1'], ['a1'], ['b1'], ['a1']] },
      },
      {
        name: 'one chunk when everything fits',
        args: [[{ id: 1, authorId: 7, title: 'g1' }], [7, 8], 100],
        expected: { queries: 1, titles: [['g1'], []] },
      },
      { name: 'no ids, no query', args: [[{ id: 1, authorId: 1, title: 'a1' }], [], 10], expected: { queries: 0, titles: [] } },
    ],
    solution: `type Post = { id: number; authorId: number; title: string };

export function solution(table: Post[], authorIds: number[], chunkSize: number) {
  let queries = 0;
  // Fake of prisma.post.findMany({ where: { authorId: { in: ids } } }).
  const findMany = (args: { where: { authorId: { in: number[] } } }): Post[] => {
    const ids = args.where.authorId.in;
    if (ids.length > chunkSize) {
      throw new Error('too many bind variables: ' + ids.length);
    }
    queries += 1;
    return table.filter((post) => ids.includes(post.authorId));
  };

  const uniqueIds = [...new Set(authorIds)];
  const byAuthor = new Map<number, string[]>();
  for (let start = 0; start < uniqueIds.length; start += chunkSize) {
    const chunk = uniqueIds.slice(start, start + chunkSize);
    for (const post of findMany({ where: { authorId: { in: chunk } } })) {
      const list = byAuthor.get(post.authorId) ?? [];
      list.push(post.title);
      byAuthor.set(post.authorId, list);
    }
  }
  return { queries, titles: authorIds.map((id) => byAuthor.get(id) ?? []) };
}`,
    tags: ['n-plus-one', 'batching', 'chunking', 'bind-parameters'],
    source: 'topic-list',
    explanation:
      'Batching trades N round trips for ceil(unique / chunkSize). Chunking matters because databases and drivers cap bind parameters per statement (PostgreSQL\'s protocol allows 65,535; SQL Server 2,100), and huge `IN` lists also produce big plans and big result sets held in memory. Prisma\'s query engine can split a plain oversized `in` list into several queries by itself, but not every filter shape (negated filters such as `notIn` fail with "Query parameter limit exceeded"), and it still returns everything in one call; explicit chunks keep statement size, memory and retries under your control. De-duplicate first so repeated keys do not waste parameter slots, group with a `Map`, and map back to the caller\'s order. For truly large jobs, stream with cursor pagination (`cursor` + `take`) instead of loading everything at once.',
  },
  {
    id: 'prisma-interactive-transactions',
    domain: 'libraries',
    subject: 'prisma',
    topic: 'orm-usage',
    level: 'senior',
    kind: 'open',
    prompt:
      'A checkout endpoint must decrement stock, create an order and charge a card through a payment API. Under load, stock sometimes goes negative. How do you implement it with Prisma, and what goes inside the transaction?',
    modelAnswer:
      'Negative stock is a lost-update race: two requests read `stock = 1`, both pass the check, and both write. The fix is to make the check and the write one atomic statement: `tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` and treat `count === 0` as out of stock. Alternatively use optimistic concurrency with a `version` column in the `where`, or `SERIALIZABLE` isolation with retries. I wrap the stock update and the order insert in an interactive transaction, `prisma.$transaction(async (tx) => { ... })`, using `tx` for every query; the array form `$transaction([a, b])` is enough when the writes do not depend on each other\'s results. The payment call stays **outside** the transaction: a network call holds locks and a connection while it waits, and it cannot be rolled back anyway. So I reserve stock and create a `PENDING` order in the transaction, charge the card with an idempotency key, then mark the order paid, or release the stock through a compensating step if the charge fails. I keep transactions short and set `timeout`/`maxWait` explicitly.',
    rubric: [
      'Diagnoses a read-then-write race (lost update) rather than blaming Prisma',
      'Uses an atomic conditional update (`updateMany` with a `gte` guard / `decrement`) or optimistic locking',
      'Knows interactive `$transaction(async (tx) => ...)` versus the array form, and uses `tx` for every query',
      'Keeps the external payment call out of the transaction and uses idempotency and compensation',
    ],
    tags: ['transactions', 'concurrency', 'optimistic-locking', 'idempotency'],
    source: 'topic-list',
    explanation:
      'Interviewers use this to see whether you understand that a transaction alone does not prevent a read-then-write race at the default isolation level (READ COMMITTED on PostgreSQL; MySQL\'s REPEATABLE READ does not stop it either), and that side effects outside the database do not belong inside it.\n\n**Say this out loud:** "I make the stock check and decrement a single conditional update, keep the transaction to database work only, and handle the payment outside it with an idempotency key and a compensating step."',
  },
];
