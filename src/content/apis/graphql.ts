// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'graphql-over-under-fetching',
    domain: 'apis',
    subject: 'graphql',
    topic: 'graphql-vs-rest',
    level: 'junior',
    kind: 'single',
    prompt:
      'A mobile screen shows a user\'s name plus the titles of their last 3 orders. With the REST API it calls `GET /users/7` (returns 40 fields) and then `GET /users/7/orders` (returns full orders with line items). Which problems does a GraphQL query like this one address?\n\n```\n{\n  user(id: 7) {\n    name\n    orders(last: 3) {\n      title\n    }\n  }\n}\n```',
    options: [
      { id: 'a', text: 'Over-fetching only: the client receives fewer fields, but still needs two round trips' },
      { id: 'b', text: 'Both over-fetching (unneeded fields) and under-fetching (extra round trips), because the client selects exactly the fields and nested data it needs in one request' },
      { id: 'c', text: 'Neither; GraphQL only changes the transport from JSON to a binary format' },
      { id: 'd', text: 'Under-fetching only; the server still sends every field of the user type' },
    ],
    answer: 'b',
    tags: ['over-fetching', 'under-fetching'],
    source: 'notion',
    explanation:
      '**Over-fetching**: the endpoint returns more than the screen needs (40 user fields, whole line items), wasting bandwidth, which matters on mobile. **Under-fetching**: one endpoint does not return enough, so the client makes extra round trips (user, then orders), adding latency.\n\nIn GraphQL the **client declares the shape** of the response and the server resolves nested fields in one request, so both disappear from the client\'s point of view. The work does not vanish; it moves to the server, where nested resolvers can cause N+1 queries unless you batch. GraphQL is still JSON over HTTP (usually POST); the idea that it switches to a binary transport describes gRPC/protobuf, not GraphQL.',
  },
  {
    id: 'graphql-dataloader-per-request-context',
    domain: 'apis',
    subject: 'graphql',
    topic: 'schema-and-resolvers',
    level: 'mid',
    kind: 'single',
    prompt:
      'Resolvers receive `(parent, args, context, info)`. You add a DataLoader for `User` records (it batches and **caches** by id). Where should the DataLoader instance be created?',
    options: [
      { id: 'a', text: 'Once at module level, so every request shares the cache and the hit rate is highest' },
      { id: 'b', text: 'In the context factory, so each incoming request gets fresh loader instances' },
      { id: 'c', text: 'Inside each field resolver, right before calling `load`' },
      { id: 'd', text: 'In `info`, because it carries the parsed query and can see all requested ids' },
    ],
    answer: 'b',
    tags: ['dataloader', 'resolvers', 'context'],
    source: 'topic-list',
    explanation:
      '`context` is the per-request object shared by every resolver in one operation: it is where the authenticated user, DB handles and loaders live. Creating loaders there scopes both the **batch window** and the **memo cache** to a single request.\n\n- **Module level** is the dangerous distractor: a shared cache never invalidates (stale data after writes), grows without bound, and can serve data loaded under one user\'s permissions to another user.\n- **Inside each field resolver** creates a new loader per field call, so there is nothing to batch with and the N+1 comes back.\n- **`info`** is the query AST and schema metadata, not a place for per-request state.\n\nFor a cross-request cache, put Redis (or HTTP caching) *below* the loader, with explicit TTLs and invalidation.',
  },
  {
    id: 'graphql-n-plus-one-batching-predict',
    domain: 'apis',
    subject: 'graphql',
    topic: 'schema-and-resolvers',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt:
      'This simulates resolving `posts { author { id } }` twice: once with a naive per-post lookup and once through a tiny DataLoader that collects keys during the current tick and dispatches one batch. `queries` counts database round trips. What does it print, one line per log?',
    code: `let queries = 0;
const db = {
  posts: () => {
    queries++;
    return Promise.resolve([
      { id: 1, authorId: 10 },
      { id: 2, authorId: 20 },
      { id: 3, authorId: 10 },
      { id: 4, authorId: 30 },
    ]);
  },
  authorById: (id) => {
    queries++;
    return Promise.resolve({ id });
  },
  authorsByIds: (ids) => {
    queries++;
    console.log('batch', ids);
    return Promise.resolve(ids.map((id) => ({ id })));
  },
};

function createLoader(batchFn) {
  const cache = new Map();
  let queue = [];
  return (key) => {
    if (cache.has(key)) return cache.get(key);
    const promise = new Promise((resolve) => {
      queue.push({ key, resolve });
      if (queue.length === 1) {
        Promise.resolve().then(async () => {
          const batch = queue;
          queue = [];
          const rows = await batchFn(batch.map((item) => item.key));
          batch.forEach((item, i) => item.resolve(rows[i]));
        });
      }
    });
    cache.set(key, promise);
    return promise;
  };
}

async function resolvePosts(loadAuthor) {
  queries = 0;
  const posts = await db.posts();
  await Promise.all(posts.map((post) => loadAuthor(post.authorId)));
  return queries;
}

resolvePosts(db.authorById)
  .then((naive) => {
    console.log('naive:', naive);
    return resolvePosts(createLoader(db.authorsByIds));
  })
  .then((batched) => console.log('batched:', batched));`,
    answer: 'naive: 5\nbatch [10,20,30]\nbatched: 2',
    tags: ['n-plus-one', 'dataloader', 'microtasks'],
    source: 'topic-list',
    explanation:
      'Naive: 1 query for the posts list + 1 query **per post** for its author = 1 + 4 = **5**. That is the N+1 problem, and in GraphQL it happens by default because each `author` field resolver runs independently and knows nothing about its siblings.\n\nBatched: all four `loadAuthor` calls happen synchronously inside `posts.map`. The first call schedules a dispatch on the microtask queue; the next ones just enqueue. The repeated key `10` hits the memo cache and returns the same promise, so the batch is deduplicated to `[10,20,30]`. Result: 1 + 1 = **2** queries, whatever the number of posts. The real `dataloader` package does the same thing (it schedules the dispatch after the current tick of promise jobs).\n\n**Say this out loud:** "Field resolvers are independent, so nested lists produce N+1 queries; DataLoader fixes it by collecting every key requested in the same tick, deduplicating, and issuing one `WHERE id IN (...)` query, with a loader per request."',
  },
  {
    id: 'graphql-batch-function-contract',
    domain: 'apis',
    subject: 'graphql',
    topic: 'schema-and-resolvers',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'A DataLoader batch function receives `keys` and must return an array of the **same length and in the same order**, one entry per key. Your database query `SELECT * FROM authors WHERE id IN (...)` returns `rows` in arbitrary order, without duplicates, and omits ids that do not exist.\n\nImplement `solution(keys, rows)` so it returns the rows aligned to `keys`, with `null` for missing ids. Duplicate keys each get the row.',
    starter: `type Author = { id: number; name: string };

export function solution(keys: number[], rows: Author[]): (Author | null)[] {
  return [];
}`,
    tests: [
      {
        name: 'reorders rows to match keys',
        args: [[3, 1, 2], [{ id: 1, name: 'Ana' }, { id: 2, name: 'Luis' }, { id: 3, name: 'Mia' }]],
        expected: [{ id: 3, name: 'Mia' }, { id: 1, name: 'Ana' }, { id: 2, name: 'Luis' }],
      },
      {
        name: 'missing id becomes null',
        args: [[1, 9], [{ id: 1, name: 'Ana' }]],
        expected: [{ id: 1, name: 'Ana' }, null],
      },
      {
        name: 'duplicate keys each get the row',
        args: [[2, 2], [{ id: 2, name: 'Luis' }]],
        expected: [{ id: 2, name: 'Luis' }, { id: 2, name: 'Luis' }],
      },
      { name: 'no keys', args: [[], []], expected: [] },
    ],
    solution: `type Author = { id: number; name: string };

export function solution(keys: number[], rows: Author[]): (Author | null)[] {
  const byId = new Map(rows.map((row) => [row.id, row] as const));
  return keys.map((key) => byId.get(key) ?? null);
}`,
    tags: ['dataloader', 'n-plus-one'],
    source: 'topic-list',
    explanation:
      'DataLoader resolves the promise for `keys[i]` with `result[i]`. If you return the raw rows, a missing id shifts every later result by one and **authors get attached to the wrong posts**, a silent data bug rather than a crash (DataLoader only throws when the lengths differ).\n\nIndex the rows in a `Map` (O(n + k)) instead of calling `rows.find` per key (O(n * k)). Return `null` for a missing record, or an `Error` instance if that key should reject individually.',
  },
  {
    id: 'graphql-operational-costs',
    domain: 'apis',
    subject: 'graphql',
    topic: 'graphql-vs-rest',
    level: 'mid',
    kind: 'multi',
    prompt: 'Your team is moving a public REST API to GraphQL. Which of these are **real operational costs** you take on? Select all that apply.',
    options: [
      { id: 'a', text: 'HTTP/CDN caching gets harder: most queries are `POST /graphql`, so URL-based caching no longer works without persisted queries or GET queries' },
      { id: 'b', text: 'Errors often arrive as `200 OK` with an `errors` array, so status-code-based monitoring and alerting miss them' },
      { id: 'c', text: 'A single request can be arbitrarily expensive (deep nesting, huge lists), so you need depth/complexity limits instead of simple per-endpoint rate limits' },
      { id: 'd', text: 'Nested resolvers produce N+1 database queries unless you add batching' },
      { id: 'e', text: 'You can no longer evolve the schema without versioning the endpoint as `/v2/graphql`' },
    ],
    answer: ['a', 'b', 'c', 'd'],
    tags: ['caching', 'rate-limiting', 'n-plus-one', 'observability'],
    source: 'notion',
    explanation:
      '**Harder HTTP/CDN caching**: REST GETs are cacheable by URL at every layer (browser, CDN, reverse proxy). One POST endpoint defeats that; persisted queries (a hash instead of the full query) restore GET caching.\n\n**Errors inside `200 OK`**: partial success is normal in GraphQL (`data` plus `errors`), so you monitor the `errors` array and resolver-level metrics, not just HTTP codes.\n\n**Arbitrarily expensive requests**: "requests per minute" means little when one query can fan out to millions of rows. You add query depth limits, cost analysis, pagination caps and, for public APIs, persisted-query allowlists.\n\n**N+1 queries**: each nested field resolver runs on its own, so a list of posts triggers one author lookup per post unless a per-request DataLoader batches them into one `WHERE id IN (...)` query.\n\nThe `/v2/graphql` claim is false: GraphQL APIs usually evolve **without** versions. You add fields freely and deprecate old ones with `@deprecated`, then remove them once field-usage telemetry shows no clients.',
  },
  {
    id: 'graphql-when-wrong-choice',
    domain: 'apis',
    subject: 'graphql',
    topic: 'graphql-vs-rest',
    level: 'senior',
    kind: 'open',
    prompt: 'A team lead proposes GraphQL for every new service, including internal service-to-service calls and a public, mostly-read product catalog. When is GraphQL the **wrong** choice, and what would you use instead?',
    modelAnswer:
      'GraphQL pays off when many different clients (web, mobile, partners) need different shapes of rich, nested data and you want to evolve one schema without versions; a BFF-like aggregation layer is its sweet spot. For a public, read-heavy catalog, REST is usually better: resources map naturally to URLs, and GET responses can be cached at the CDN and browser with `Cache-Control` and ETags, which GraphQL loses without persisted queries. For internal service-to-service calls, gRPC gives typed contracts, binary encoding, deadlines and streaming, and the flexible querying GraphQL offers is not needed between two services you own. GraphQL also brings a cost: N+1 resolvers need DataLoader, arbitrary queries need depth and complexity limits, errors hide inside `200` responses, and file uploads and simple webhooks are awkward. So I would choose per boundary: GraphQL (or a BFF) at the edge for product UIs, REST for public cacheable resources and CRUD, gRPC or events between services.',
    rubric: [
      'Names where GraphQL fits: many clients with different data needs, nested data, evolving one schema',
      'Explains the HTTP caching loss and why REST fits a public read-heavy catalog',
      'Proposes gRPC (or async events) for internal service-to-service traffic',
      'Lists GraphQL operating costs: N+1, query cost limits, errors in 200 responses',
      'Chooses per boundary instead of one style for everything',
    ],
    tags: ['rest-vs-graphql', 'grpc', 'caching', 'bff'],
    source: 'notion',
    explanation:
      'The interviewer is testing whether you can argue **against** a fashionable technology with concrete mechanisms (HTTP caching, typed binary RPC, query cost control) rather than taste.\n\n| Style | Strength | Use when |\n|---|---|---|\n| REST | Simple, cacheable, ubiquitous | Public and CRUD APIs |\n| GraphQL | Client picks fields, one round trip | Many clients, nested data, mobile |\n| gRPC | Fast binary, streaming, strict contracts | Internal service-to-service |\n\n**Say this out loud:** "I pick the API style per boundary: GraphQL at the product edge where many clients need different shapes, REST where HTTP caching and simplicity matter, and gRPC or events between services I own."',
  },
];
