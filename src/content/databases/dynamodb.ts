// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'dynamodb-valid-key-condition',
    domain: 'databases',
    subject: 'dynamodb',
    topic: 'keys-and-access-patterns',
    level: 'junior',
    kind: 'single',
    prompt:
      'A table has partition key `PK` and sort key `SK`. Which `KeyConditionExpression` is valid for a `Query` (not a `Scan`)?',
    options: [
      { id: 'a', text: "`PK = :pk AND begins_with(SK, 'ORDER#')`" },
      { id: 'b', text: "`begins_with(PK, 'USER#')`" },
      { id: 'c', text: '`SK = :sk`' },
      { id: 'd', text: '`PK = :pk AND contains(SK, :fragment)`' },
    ],
    answer: 'a',
    tags: ['query', 'partition-key', 'sort-key'],
    source: 'topic-list',
    explanation:
      'A `Query` must name exactly one partition with **equality** on the partition key, because the partition key is hashed to find the storage partition; there is no ordering to do a prefix or range search on (b). The sort key is stored in order within a partition, so it supports `=`, `<`, `<=`, `>`, `>=`, `BETWEEN` and `begins_with`. `contains` (d) is not a key condition; it is only allowed in a `FilterExpression`, which runs after the items are read. Querying by sort key alone (c) needs a GSI with that attribute as its partition key, or a `Scan`.',
  },
  {
    id: 'dynamodb-gsi-vs-lsi',
    domain: 'databases',
    subject: 'dynamodb',
    topic: 'keys-and-access-patterns',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which statements about DynamoDB secondary indexes are true? Select all that apply.',
    options: [
      { id: 'a', text: 'A local secondary index (LSI) can only be defined when the table is created.' },
      { id: 'b', text: 'A global secondary index (GSI) supports strongly consistent reads if you pass `ConsistentRead: true`.' },
      { id: 'c', text: 'An LSI keeps the base table partition key and provides an alternate sort key.' },
      { id: 'd', text: 'On a table with an LSI, all items sharing one partition key value (the item collection, including index entries) are capped at 10 GB.' },
      { id: 'e', text: 'GSI key values must be unique across items, like a unique constraint.' },
    ],
    answer: ['a', 'c', 'd'],
    tags: ['gsi', 'lsi', 'secondary-index'],
    source: 'topic-list',
    explanation:
      'An LSI is "local" because it lives in the same partition as the base items: same partition key, different sort key, created only with the table, and it adds the 10 GB item-collection limit. A GSI has its own partition and sort key, can be added or removed at any time, has its own capacity, and is replicated asynchronously, so its reads are **eventually consistent only** (b is false). GSI keys are not unique (e is false): many items can share the same GSI partition and sort key, and DynamoDB has no unique constraint beyond the primary key (you emulate uniqueness with a conditional put on a separate item in a transaction). An under-provisioned GSI can also throttle writes to the base table.',
  },
  {
    id: 'dynamodb-filter-after-limit',
    domain: 'databases',
    subject: 'dynamodb',
    topic: 'keys-and-access-patterns',
    level: 'mid',
    kind: 'single',
    prompt:
      "A `Query` for one customer's orders uses `Limit: 10` and `FilterExpression: '#status = :shipped'`. It returns 3 items and a `LastEvaluatedKey`, even though the customer has 40 shipped orders. Why?",
    options: [
      {
        id: 'a',
        text: '`Limit` caps the number of items **read** before the filter runs; 10 items were read, 3 matched, and the rest must be fetched with further pages.',
      },
      { id: 'b', text: 'The filter was applied to an eventually consistent replica that had not yet received the other shipped orders.' },
      { id: 'c', text: 'DynamoDB returns at most 3 items when a `FilterExpression` is present unless you raise the limit on the table.' },
      { id: 'd', text: '`LastEvaluatedKey` means the query hit the 1 MB page limit, so the filter was skipped for the remaining items.' },
    ],
    answer: 'a',
    tags: ['filter-expression', 'pagination', 'rcu'],
    source: 'topic-list',
    explanation:
      'DynamoDB reads items that match the key condition, stopping at `Limit` items or 1 MB, then applies the `FilterExpression` to that page. You pay read capacity for everything read, not for what the filter keeps. So a filter is a convenience, not an access pattern: if "shipped orders for a customer" is a real query, put the status in the key (for example `SK = ORDER#SHIPPED#<date>`, or a GSI keyed on status). Always loop on `LastEvaluatedKey` until it is absent.',
  },
  {
    id: 'dynamodb-order-keys-builder',
    domain: 'databases',
    subject: 'dynamodb',
    topic: 'keys-and-access-patterns',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'An orders table (single-table design) must serve two access patterns:\n\n1. A customer\'s orders, newest first, optionally within a date range.\n2. All orders in a given status across customers, within a date range (via `GSI1`).\n\nImplement `solution(order)` returning the four key attributes:\n\n- `PK`: `CUSTOMER#<customerId>`\n- `SK`: `ORDER#<createdAt>#<orderId>`\n- `GSI1PK`: `STATUS#<status>`, with the status upper-cased\n- `GSI1SK`: `<createdAt>#<orderId>`\n\n`createdAt` is an ISO-8601 UTC string. Because keys compare as strings, `orderId` (a number) must be **left-padded with zeros to 8 digits**.',
    starter: `type Order = { customerId: string; orderId: number; status: string; createdAt: string };
type OrderKeys = { PK: string; SK: string; GSI1PK: string; GSI1SK: string };

export function solution(order: Order): OrderKeys {
  return { PK: '', SK: '', GSI1PK: '', GSI1SK: '' };
}`,
    tests: [
      {
        name: 'pads the order id and upper-cases the status',
        args: [{ customerId: 'c-42', orderId: 7, status: 'shipped', createdAt: '2026-09-01T10:00:00Z' }],
        expected: {
          PK: 'CUSTOMER#c-42',
          SK: 'ORDER#2026-09-01T10:00:00Z#00000007',
          GSI1PK: 'STATUS#SHIPPED',
          GSI1SK: '2026-09-01T10:00:00Z#00000007',
        },
      },
      {
        name: 'leaves an 8-digit id unchanged',
        args: [{ customerId: 'c-9', orderId: 12345678, status: 'Pending', createdAt: '2026-09-23T08:30:00Z' }],
        expected: {
          PK: 'CUSTOMER#c-9',
          SK: 'ORDER#2026-09-23T08:30:00Z#12345678',
          GSI1PK: 'STATUS#PENDING',
          GSI1SK: '2026-09-23T08:30:00Z#12345678',
        },
      },
      {
        name: 'pads a mid-size id',
        args: [{ customerId: 'c-1', orderId: 1042, status: 'DELIVERED', createdAt: '2026-08-31T23:59:59Z' }],
        expected: {
          PK: 'CUSTOMER#c-1',
          SK: 'ORDER#2026-08-31T23:59:59Z#00001042',
          GSI1PK: 'STATUS#DELIVERED',
          GSI1SK: '2026-08-31T23:59:59Z#00001042',
        },
      },
    ],
    solution: `type Order = { customerId: string; orderId: number; status: string; createdAt: string };
type OrderKeys = { PK: string; SK: string; GSI1PK: string; GSI1SK: string };

export function solution(order: Order): OrderKeys {
  const id = String(order.orderId).padStart(8, '0');
  const timeAndId = \`\${order.createdAt}#\${id}\`;
  return {
    PK: \`CUSTOMER#\${order.customerId}\`,
    SK: \`ORDER#\${timeAndId}\`,
    GSI1PK: \`STATUS#\${order.status.toUpperCase()}\`,
    GSI1SK: timeAndId,
  };
}`,
    tags: ['single-table-design', 'composite-sort-key', 'gsi', 'overloading'],
    source: 'topic-list',
    explanation:
      "Sort keys compare byte by byte, so `'10' < '9'`; zero-padding makes numeric ids sort numerically, and ISO-8601 UTC timestamps already sort chronologically. With these keys, pattern 1 is `Query PK = 'CUSTOMER#c-42' AND begins_with(SK, 'ORDER#')` with `ScanIndexForward: false` for newest first, or `SK BETWEEN 'ORDER#2026-09-01' AND 'ORDER#2026-09-30~'` for a range. Pattern 2 is a `Query` on `GSI1` with `GSI1PK = 'STATUS#SHIPPED'` and a range on `GSI1SK`. The `ORDER#` prefix leaves room for other entity types (profile, addresses) in the same partition. Watch the GSI: a status has few distinct values, so `STATUS#PENDING` can become a hot partition at scale; shard it (`STATUS#PENDING#3`) or make the index sparse by writing `GSI1PK` only for statuses you actually query.",
  },
  {
    id: 'dynamodb-hot-partition-throttling',
    domain: 'databases',
    subject: 'dynamodb',
    topic: 'keys-and-access-patterns',
    level: 'senior',
    kind: 'open',
    prompt:
      'An event-ingestion table uses the event date (`2026-09-23`) as its partition key and a UUID as sort key. The table is on-demand, total traffic is far below account limits, yet writes are throttled every afternoon. Explain what is happening and how you would fix it.',
    modelAnswer:
      "Every write for the day lands on one partition key, and a single partition key value is served by one physical partition, which supports about 1,000 write units and 3,000 read units per second no matter how much capacity the table has overall. On-demand and adaptive capacity redistribute throughput across partitions and can isolate a hot item, but they cannot make a single key exceed the per-partition limit, so the busy afternoon hits it. The fix is a higher-cardinality key. If events are read per source, use `sourceId` (or tenant id) as partition key and the timestamp as sort key. If the date really is the access pattern, use write sharding: `PK = 2026-09-23#<n>` with `n` chosen randomly or by hashing the event id over, say, 10 to 20 shards, and read a day with a parallel query over all shards merged by timestamp. Hashing the event id makes the shard computable for point reads. I would confirm the diagnosis with CloudWatch Contributor Insights for DynamoDB, which shows the most-accessed keys, before changing the model.",
    rubric: [
      'Identifies the hot partition: one key value is limited by per-partition throughput (about 1,000 WCU / 3,000 RCU)',
      'Explains that on-demand or adaptive capacity does not lift the per-key limit',
      'Proposes a higher-cardinality partition key or write sharding with a suffix',
      'Describes the read-side cost of sharding (scatter-gather queries merged in the application)',
      'Mentions confirming with CloudWatch Contributor Insights or throttle metrics',
    ],
    tags: ['hot-partition', 'write-sharding', 'throttling', 'capacity'],
    source: 'topic-list',
    explanation:
      'The trap is thinking capacity is a table-level number. Throughput is spread across partitions by the hash of the partition key, so a low-cardinality key concentrates load no matter how much the table is provisioned for.\n\n**Say this out loud:** "Capacity is per partition, not per table: a date as partition key puts a whole day on one key, so I raise cardinality or shard the key and pay for it with a scatter-gather read."',
  },
  {
    id: 'dynamodb-single-table-design-tradeoffs',
    domain: 'databases',
    subject: 'dynamodb',
    topic: 'keys-and-access-patterns',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is single-table design in DynamoDB, why do people use it, and when would you **not** use it?',
    modelAnswer:
      "Single-table design stores several entity types (customers, orders, order items) in one table with generic key attributes such as `PK` and `SK`, so related items share a partition: `PK = CUSTOMER#42` holds the profile item and `ORDER#...` items. One `Query` can then return a customer and their recent orders together, which replaces the joins DynamoDB does not have, and overloaded GSIs (`GSI1PK`/`GSI1SK` meaning different things per entity) serve the remaining access patterns. It requires listing every access pattern up front and designing keys for them, which is its main strength and its main cost. I would avoid it, or use a few tables, when access patterns are still changing (early product work), when entities are mostly fetched independently so co-location buys nothing, when the team is not fluent in the model (the table is hard to read and debug), or when analytics and ad-hoc queries matter (export to S3 and query with Athena, or use a relational database instead). Tools like GraphQL resolvers that fetch one entity type per resolver also get little benefit from co-location. Adding a new access pattern later often means backfilling new key attributes on existing items.",
    rubric: [
      'Explains co-locating different entity types under one partition key so one `Query` fetches related items (pre-joined data)',
      'Mentions generic, overloaded key attributes and GSIs',
      'States that access patterns must be known up front and new patterns may require backfills',
      'Gives concrete cases against it: evolving requirements, independent entity access, analytics or ad-hoc queries, team familiarity',
    ],
    tags: ['single-table-design', 'data-modeling', 'trade-offs'],
    source: 'topic-list',
    explanation:
      'DynamoDB modeling works backwards from queries. Single-table design is the logical end of that approach, but it is an optimization for known, stable, latency-critical access patterns, not a default rule. Even AWS guidance now presents multi-table designs as valid when entities are accessed independently.\n\n**Say this out loud:** "Single-table design pre-joins data by sharing a partition key, so it pays off when I know my access patterns and need related items in one query; when the patterns are still moving or I need ad-hoc queries, I use separate tables or a relational database."',
  },
];
