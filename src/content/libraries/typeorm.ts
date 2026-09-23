// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'typeorm-n-plus-one-count',
    domain: 'libraries',
    subject: 'typeorm',
    topic: 'n-plus-one',
    level: 'junior',
    kind: 'single',
    prompt: `\`\`\`ts
const authors = await authorRepo.find(); // returns 100 authors
for (const author of authors) {
  author.posts = await postRepo.find({ where: { authorId: author.id } });
}
\`\`\`
How many SQL queries does this send?`,
    options: [
      { id: 'a', text: '1, because TypeORM merges them into a join' },
      { id: 'b', text: '2' },
      { id: 'c', text: '101' },
      { id: 'd', text: '100' },
    ],
    answer: 'c',
    tags: ['n-plus-one', 'performance'],
    source: 'topic-list',
    explanation:
      'One query for the list plus one per row: the N+1 problem. Each `await` in the loop is also a sequential network round trip, so latency grows linearly with N. Fixes: load the relation with the parent (`find({ relations: { posts: true } })`, a single `LEFT JOIN`), or batch the children with one `WHERE "authorId" IN (...)` query (`In(ids)`) and group them in memory. In GraphQL resolvers, where the loop is hidden across resolver calls, a DataLoader does that batching per request.',
  },
  {
    id: 'typeorm-batch-posts-by-author',
    domain: 'libraries',
    subject: 'typeorm',
    topic: 'n-plus-one',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      "Write the batch function a DataLoader would call for `Author.posts`. `postRepo.find` is a fake of TypeORM's repository: every call counts as one SQL query, and it supports `where: { authorId: In(ids) }`.\n\nReturn `{ queries, postIds }` where `postIds[i]` is the list of post ids for `authorIds[i]` (table order, `[]` when the author has none). This is the DataLoader contract: one result per key, in the same order as the keys. Use **one** query for any non-empty input, and send **no** query for an empty one.",
    starter: `type Post = { id: number; authorId: number; title: string };
type FindOperator = { in: number[] };

export function solution(table: Post[], authorIds: number[]) {
  let queries = 0;
  const In = (values: number[]): FindOperator => ({ in: values });
  // Fake of postRepo.find({ where: { authorId: In(ids) } }); each call is one SQL query.
  const postRepo = {
    find(options: { where: { authorId: FindOperator } }): Post[] {
      queries += 1;
      const ids = options.where.authorId.in;
      return table.filter((post) => ids.includes(post.authorId));
    },
  };

  // TODO: load the posts for every author in authorIds without N+1
  const postIds: number[][] = [];
  return { queries, postIds };
}`,
    tests: [
      {
        name: 'three authors, one query',
        args: [
          [{ id: 1, authorId: 1, title: 'a1' }, { id: 2, authorId: 2, title: 'b1' }, { id: 3, authorId: 1, title: 'a2' }, { id: 4, authorId: 3, title: 'c1' }],
          [1, 2, 3],
        ],
        expected: { queries: 1, postIds: [[1, 3], [2], [4]] },
      },
      {
        name: 'keeps key order and fills missing authors with []',
        args: [
          [{ id: 1, authorId: 1, title: 'a1' }, { id: 2, authorId: 2, title: 'b1' }, { id: 3, authorId: 1, title: 'a2' }, { id: 4, authorId: 3, title: 'c1' }],
          [3, 9, 1],
        ],
        expected: { queries: 1, postIds: [[4], [], [1, 3]] },
      },
      {
        name: 'duplicate keys each get a result',
        args: [[{ id: 2, authorId: 2, title: 'b1' }], [2, 2]],
        expected: { queries: 1, postIds: [[2], [2]] },
      },
      { name: 'no keys, no query', args: [[{ id: 1, authorId: 1, title: 'a1' }], []], expected: { queries: 0, postIds: [] } },
    ],
    solution: `type Post = { id: number; authorId: number; title: string };
type FindOperator = { in: number[] };

export function solution(table: Post[], authorIds: number[]) {
  let queries = 0;
  const In = (values: number[]): FindOperator => ({ in: values });
  // Fake of postRepo.find({ where: { authorId: In(ids) } }); each call is one SQL query.
  const postRepo = {
    find(options: { where: { authorId: FindOperator } }): Post[] {
      queries += 1;
      const ids = options.where.authorId.in;
      return table.filter((post) => ids.includes(post.authorId));
    },
  };

  const uniqueIds = [...new Set(authorIds)];
  if (uniqueIds.length === 0) {
    return { queries, postIds: [] };
  }
  const posts = postRepo.find({ where: { authorId: In(uniqueIds) } });
  const byAuthor = new Map<number, number[]>();
  for (const post of posts) {
    const list = byAuthor.get(post.authorId) ?? [];
    list.push(post.id);
    byAuthor.set(post.authorId, list);
  }
  return { queries, postIds: authorIds.map((id) => byAuthor.get(id) ?? []) };
}`,
    tags: ['n-plus-one', 'dataloader', 'batching', 'graphql'],
    source: 'topic-list',
    explanation:
      'The pattern is always: collect keys, de-duplicate, run **one** `IN` query, group by the foreign key in a `Map` (O(n), not a nested `filter` per key), and map back to the original key order, with `[]` for keys that have no rows. DataLoader requires the result array to line up with the keys, because it resolves each caller\'s promise by position. Skipping the query for an empty key list saves a round trip. In a real resolver you create the DataLoader **per request**, so its cache never leaks data between users.',
  },
  {
    id: 'typeorm-lazy-relation-n-plus-one',
    domain: 'libraries',
    subject: 'typeorm',
    topic: 'n-plus-one',
    level: 'senior',
    kind: 'single',
    prompt: `\`\`\`ts
@Entity()
class Post {
  @ManyToOne(() => User, { lazy: true })
  author: Promise<User>;
}

const posts = await postRepo.find({ take: 50 });
const names = await Promise.all(posts.map(async (p) => (await p.author).name));
\`\`\`
What does TypeORM do here?`,
    options: [
      { id: 'a', text: 'One query with a join; `lazy` is ignored by `find`' },
      { id: 'b', text: 'One query for the posts, then one query per `await p.author`: 51 in total, fired concurrently' },
      { id: 'c', text: 'Two queries: TypeORM batches lazy loads made in the same tick' },
      { id: 'd', text: 'It throws, because lazy relations must be listed in `relations`' },
    ],
    answer: 'b',
    tags: ['lazy-relations', 'n-plus-one'],
    source: 'topic-list',
    explanation:
      'A lazy relation is a promise-returning getter: every first access runs its own `SELECT`. TypeORM does not batch them, so this is N+1 hidden behind a property access. `Promise.all` only makes it concurrent, which can also exhaust the connection pool under load. Use `relations: { author: true }` (or `leftJoinAndSelect`) for this query, or collect the `authorId`s and load users with one `In(ids)` query. `eager: true` is the opposite trade-off: it always joins, even when you do not need the data, and it only applies to `find*` methods, not to QueryBuilder.\n\n**Say this out loud:** "Lazy relations turn N+1 into a property access, so I avoid them on hot paths and load relations explicitly with a join or one batched `IN` query."',
  },
  {
    id: 'typeorm-leftjoin-vs-leftjoinandselect',
    domain: 'libraries',
    subject: 'typeorm',
    topic: 'orm-usage',
    level: 'mid',
    kind: 'single',
    prompt: `\`\`\`ts
const users = await dataSource
  .getRepository(User)
  .createQueryBuilder('user')
  .leftJoin('user.photos', 'photo')
  .where('photo.isPublished = :published', { published: true })
  .getMany();
\`\`\`
\`users[0].photos\` is \`undefined\`. Why?`,
    options: [
      { id: 'a', text: '`leftJoin` only joins for filtering; `leftJoinAndSelect` is needed to select and hydrate `photos`' },
      { id: 'b', text: 'The `photos` relation must be declared with `eager: true`' },
      { id: 'c', text: '`getMany` drops relations; `getRawMany` is required' },
      { id: 'd', text: 'Named parameters are not bound in `where`, so the join is discarded' },
    ],
    answer: 'a',
    tags: ['query-builder', 'joins'],
    source: 'topic-list',
    explanation:
      '`leftJoin` adds the join to the SQL but not the joined columns to the `SELECT`, so there is nothing to map onto `user.photos`. `leftJoinAndSelect` selects them and hydrates the relation. There is a second, subtler bug: a condition on the joined table in `WHERE` removes users with no published photos, which effectively turns the left join into an inner join. To keep every user and only attach published photos, put the condition in the join: `.leftJoinAndSelect("user.photos", "photo", "photo.isPublished = :published", { published: true })`.',
  },
  {
    id: 'typeorm-synchronize-and-migrations',
    domain: 'libraries',
    subject: 'typeorm',
    topic: 'orm-usage',
    level: 'senior',
    kind: 'open',
    prompt:
      'A NestJS service uses TypeORM with `synchronize: true` in every environment "because it is convenient". What are the risks, and what schema-change and transaction workflow do you put in place instead?',
    modelAnswer:
      '`synchronize` diffs entities against the live schema on every boot and applies the changes directly: renaming a property becomes drop-column-plus-add-column, which silently deletes data. Changes are not reviewed, versioned or repeatable, and several instances booting at once can race on DDL. I keep it for throwaway local databases and tests only. Instead, generate migrations with `typeorm migration:generate`, review the SQL in the pull request (especially drops, renames and locking operations like adding an index on a big table, which on Postgres should use `CONCURRENTLY`), commit them, and run them once per deploy as a separate step, not from every app instance. Risky changes follow expand-and-contract: add the new column, backfill, switch the code, then drop the old one in a later release, so old and new code can run side by side. Multi-statement writes go in a transaction: `dataSource.transaction(async (manager) => ...)` using that `manager` for every query (a common bug is using the global repository inside the callback, which runs outside the transaction), or a `QueryRunner` when I need explicit control.',
    rubric: [
      'Explains data-loss risk (renames become drop plus add) and lack of review/versioning',
      'Generates, reviews and commits migrations and runs them once per deploy',
      'Mentions expand-and-contract / backwards-compatible schema changes',
      'Uses `dataSource.transaction` or a QueryRunner and knows to use the transactional `manager`',
    ],
    tags: ['migrations', 'synchronize', 'transactions', 'nestjs'],
    source: 'topic-list',
    explanation:
      'The senior signal is treating schema changes as deployable, reviewable artifacts that must be compatible with the code version still running.\n\n**Say this out loud:** "`synchronize` is for local prototypes only; in shared environments schema changes are reviewed migrations run once per deploy, written expand-and-contract so old and new code can both run."',
  },
];
