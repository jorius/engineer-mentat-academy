// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'nosql-document-store-fit',
    domain: 'databases',
    subject: 'nosql',
    topic: 'use-cases',
    level: 'junior',
    kind: 'single',
    prompt: 'Which workload is the most natural fit for a document database such as MongoDB?',
    options: [
      {
        id: 'a',
        text: 'A product catalog where each category has different attributes and a product page reads one product with its variants and specs in a single request.',
      },
      { id: 'b', text: 'A double-entry accounting ledger where every transfer must debit one account and credit another atomically.' },
      { id: 'c', text: 'A BI workload where analysts write ad-hoc queries joining ten tables in ways nobody predicted.' },
      { id: 'd', text: 'A friends-of-friends recommendation that walks relationships up to four hops deep.' },
    ],
    answer: 'a',
    tags: ['document-store', 'mongodb'],
    source: 'topic-list',
    explanation:
      'Document stores shine when the unit you read and write is a self-contained, variably shaped aggregate: one document holds the product, its variants and its specs, so the page is one read with no joins. The ledger needs multi-row ACID invariants and constraints, the home ground of a relational database (MongoDB has multi-document transactions, but they are not its sweet spot). Ad-hoc analytics wants SQL and a columnar warehouse. Multi-hop relationship traversal is what graph databases such as Neo4j or Neptune are built for.',
    hint: 'Think about the access pattern a document store is shaped around, and what each workload needs from the database beyond reading one record.',
  },
  {
    id: 'nosql-store-families',
    domain: 'databases',
    subject: 'nosql',
    topic: 'use-cases',
    level: 'junior',
    kind: 'single',
    prompt: 'Which pairing of NoSQL family and use case is the best match?',
    options: [
      { id: 'a', text: 'Key-value store (Redis) for sessions, caching and rate-limit counters with TTLs.' },
      { id: 'b', text: 'Graph database (Neo4j) for high-volume time-stamped sensor readings queried by time range.' },
      { id: 'c', text: 'Wide-column store (Cassandra) for joining arbitrary entities in ad-hoc reports.' },
      { id: 'd', text: 'Document store (MongoDB) for sub-millisecond atomic counters shared by every API instance.' },
    ],
    answer: 'a',
    tags: ['key-value', 'graph', 'wide-column', 'redis'],
    source: 'topic-list',
    explanation:
      'Redis is an in-memory key-value store with per-key TTLs and atomic operations such as `INCR`, which is exactly what sessions, caches and rate limiters need. Time-series ingestion fits a wide-column store such as Cassandra or a time-series database, keyed by device and time bucket. Wide-column stores are designed around known queries and have no joins. Document stores can hold counters, but a shared hot counter at sub-millisecond latency is the key-value store job.',
    hint: 'For each pairing, recall the access pattern that family is designed around, then ask whether the use case really matches it.',
  },
  {
    id: 'nosql-schemaless-myth',
    domain: 'databases',
    subject: 'nosql',
    topic: 'sql-vs-nosql',
    level: 'mid',
    kind: 'single',
    prompt: 'A teammate says "we picked a NoSQL database, so we never need schema migrations". What is the most accurate response?',
    options: [
      { id: 'a', text: 'Correct: without a declared schema, old and new documents are equally valid and nothing needs to change.' },
      {
        id: 'b',
        text: 'The schema still exists; it moved from the database into the application (schema-on-read). Old document shapes must be handled in code or migrated, for example with a version field and lazy or backfill migrations.',
      },
      { id: 'c', text: 'Migrations are needed only if you add secondary indexes; field changes are always free.' },
      { id: 'd', text: 'NoSQL databases reject documents whose shape differs from the first document inserted, so migrations are enforced automatically.' },
    ],
    answer: 'b',
    tags: ['schema-on-read', 'migrations', 'data-modeling'],
    source: 'topic-list',
    explanation:
      '"Schemaless" means the database does not enforce the schema; every reader still assumes one. After a field rename, old documents keep the old name forever unless you migrate them, so code must handle both shapes. Common patterns: a `schemaVersion` field with read-time upgrades, lazy migration on write, or a background backfill. MongoDB can also enforce JSON Schema validation per collection when you want the guard back. The flexibility is real, but it is a choice of where to enforce the schema, not an absence of one.',
    hint: 'Ask where the schema lives when the database does not enforce one, and what happens to documents written before a field changes.',
  },
  {
    id: 'nosql-cap-and-pacelc',
    domain: 'databases',
    subject: 'nosql',
    topic: 'sql-vs-nosql',
    level: 'senior',
    kind: 'single',
    prompt: 'Which statement about the CAP theorem is accurate?',
    options: [
      { id: 'a', text: 'A distributed database picks any two of consistency, availability and partition tolerance, and keeps that choice at all times.' },
      {
        id: 'b',
        text: 'During a network partition a system must choose between consistency and availability; when there is no partition, the practical trade-off is latency versus consistency (PACELC).',
      },
      { id: 'c', text: 'NoSQL databases are AP and relational databases are CA, which is why relational databases do not scale horizontally.' },
      { id: 'd', text: 'Consistency in CAP means the same thing as the C in ACID: transactions preserve integrity constraints.' },
    ],
    answer: 'b',
    tags: ['cap', 'pacelc', 'consistency', 'distributed-systems'],
    source: 'topic-list',
    explanation:
      'Partitions are not optional in a real network, so "CA" is not a choice for a distributed system. CAP only forces a decision while a partition is happening: refuse some requests (CP) or answer with possibly stale data (AP). PACELC adds the everyday case: else (no partition) you trade latency against consistency. Products are tunable rather than fixed labels: DynamoDB reads are eventually consistent by default and strongly consistent on request; Cassandra picks per query with consistency levels; MongoDB uses read and write concerns. CAP consistency means linearizability, which is unrelated to ACID consistency.\n\n**Say this out loud:** "CAP only bites during a partition, and then I choose between rejecting requests and serving stale data; the rest of the time the real trade-off is latency against consistency, and most modern stores let me tune it per request."',
    hint: 'Recall the precise statement of CAP: the condition under which it applies and what each of its three letters means.',
  },
  {
    id: 'nosql-embed-vs-reference',
    domain: 'databases',
    subject: 'nosql',
    topic: 'use-cases',
    level: 'mid',
    kind: 'open',
    prompt: 'In a document database, how do you decide whether to embed related data inside a document or store it separately and reference it by id? Use blog posts and comments as the example.',
    modelAnswer:
      'I model around access patterns: data that is read together and changes together is embedded, data that grows without bound or is read independently is referenced. Embedding gives a single read and an atomic single-document write, but it duplicates data and the document keeps growing. For a blog, the author name and avatar can be embedded as a snapshot on the post, while the author profile lives in its own collection. Comments are the classic trap: a popular post can have tens of thousands, so an unbounded embedded array will hit the document size limit (16 MB in MongoDB, 400 KB per item in DynamoDB) and make every post read and write heavier. I would store comments in their own collection keyed by post id and a timestamp, and optionally embed the latest few comments plus a count on the post for the first render (the subset pattern). Denormalized copies need an update strategy, either accepted staleness or a fan-out update when the source changes.',
    rubric: [
      'Decides from access patterns (read together, change together) rather than from entity relationships alone',
      'Identifies unbounded growth and the document size limit as the reason not to embed all comments',
      'Proposes a hybrid, such as embedding a bounded subset or summary while referencing the full set',
      'Addresses how duplicated data stays in sync or accepts staleness explicitly',
    ],
    tags: ['data-modeling', 'denormalization', 'mongodb'],
    source: 'topic-list',
    explanation:
      'Relational modeling normalizes first and optimizes later; document modeling starts from the queries. The key follow-up is "what happens when this array reaches 50,000 entries", and the answer should include bounded embedding plus a separate collection.',
    hint: 'Cover access patterns (read together, change together), unbounded growth against the document size limit, and a hybrid for comments.',
  },
  {
    id: 'nosql-polyglot-persistence-design',
    domain: 'databases',
    subject: 'nosql',
    topic: 'sql-vs-nosql',
    level: 'senior',
    kind: 'open',
    prompt:
      'You are designing an e-commerce backend with checkout and payments, a product catalog with category-specific attributes, a shopping cart, and a per-user activity feed. Which storage would you choose for each part, and when would you push back on using more than one database?',
    modelAnswer:
      'Orders and payments go in a relational database (Postgres, or RDS/Aurora on AWS): they need multi-row transactions, foreign keys, unique constraints for idempotency keys, and ad-hoc reporting. The catalog can live in Postgres too, using `JSONB` for category-specific attributes with a GIN index; I would move it to a document store only if its read volume or schema churn clearly justifies it, and search goes to OpenSearch fed by change data capture. The cart is short-lived key-value data read by user id, so Redis with a TTL or DynamoDB keyed by user fits, as long as losing an abandoned cart is acceptable. The activity feed is append-heavy and read by user and time, which fits DynamoDB or Cassandra with the user as partition key and a timestamp sort key. I push back on extra databases when the team is small or the load is modest: every new store adds operations, backups, security review, and a consistency boundary where data must be synced through events or an outbox. Starting with Postgres for everything and splitting out a store when a specific access pattern or scale limit demands it is usually the senior choice.',
    rubric: [
      'Keeps money and order state in a transactional relational store and explains why (ACID, constraints)',
      'Matches each other store to a concrete access pattern (key-value cart, time-ordered feed, flexible catalog)',
      'Mentions that Postgres `JSONB` can cover flexible schemas before adding a document database',
      'Names the operational and consistency cost of polyglot persistence (sync via CDC or outbox, backups, on-call)',
      'Argues for starting simple and splitting on evidence',
    ],
    tags: ['polyglot-persistence', 'system-design', 'trade-offs'],
    source: 'topic-list',
    explanation:
      'Interviewers are testing judgment, not product knowledge: each choice should be justified by an access pattern or a guarantee, and the cost of every additional datastore should be named.\n\n**Say this out loud:** "I pick the store per access pattern and per guarantee: money needs transactions, feeds need cheap time-ordered writes; but every extra database is another consistency boundary to operate, so I start with Postgres and split on evidence."',
    hint: 'Tie each part to the guarantee or access pattern it needs, and weigh the operational and consistency cost of every extra datastore.',
  },
];
