// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'api-design-offset-drift-predict',
    domain: 'apis',
    subject: 'api-design',
    topic: 'pagination',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt:
      'A feed is sorted newest first. The client loads page 1, a new post arrives, then the client loads page 2, once with **offset** pagination and once with a **cursor** (the id of the last item it saw). What does this print, one line per log?',
    code: `const feed = [5, 4, 3, 2, 1];
const byOffset = (offset, limit) => feed.slice(offset, offset + limit);
const byCursor = (afterId, limit) => feed.filter((id) => id < afterId).slice(0, limit);

const page1 = byOffset(0, 2);
console.log(page1);

feed.unshift(6);

console.log(byOffset(2, 2));
console.log(byCursor(page1[page1.length - 1], 2));`,
    answer: '[5,4]\n[4,3]\n[3,2]',
    tags: ['offset-pagination', 'cursor-pagination'],
    source: 'notion',
    explanation:
      'Offset pagination addresses rows **by position**. The insert at the head shifts every row down by one, so offset 2 now points at `4`, which the user already saw: a **duplicate**. A delete would do the opposite and **skip** a row.\n\nCursor (keyset) pagination addresses rows **by value**: "give me items after id 4". Inserts and deletes elsewhere do not move that boundary, so page 2 is exactly `[3,2]`. In SQL this is `WHERE id < :after ORDER BY id DESC LIMIT 2`, which an index serves directly instead of scanning and discarding `OFFSET` rows.',
    hint: 'Offset addresses rows by position and a cursor by value; trace where each one lands after the insert at the head of the feed.',
  },
  {
    id: 'api-design-offset-vs-cursor-tradeoffs',
    domain: 'apis',
    subject: 'api-design',
    topic: 'pagination',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which statements about offset vs cursor pagination are true? Select all that apply.',
    options: [
      { id: 'a', text: 'Cursor pagination cannot jump directly to "page 37"; clients can only move next/previous from a known position' },
      { id: 'b', text: '`OFFSET 100000 LIMIT 20` makes the database read and discard 100 000 rows, so deep pages get slower' },
      { id: 'c', text: 'A cursor needs a unique, stable sort key; sorting only by `createdAt` needs a tie-breaker such as `id`' },
      { id: 'd', text: 'Cursor pagination gives you an exact total count for free' },
      { id: 'e', text: 'Cursors should be opaque (e.g. base64 of the sort values) so the server can change their contents without breaking clients' },
    ],
    answer: ['a', 'b', 'c', 'e'],
    tags: ['offset-pagination', 'cursor-pagination', 'keyset'],
    source: 'notion',
    explanation:
      '- **No page jumps with cursors**: true, and it is the main reason admin tables with page numbers still use offsets.\n- **Deep `OFFSET` gets slower**: true; the cost grows linearly with the offset, while keyset pagination seeks straight into the index.\n- **Unique sort key with a tie-breaker**: true; if two rows share a `createdAt` at a page boundary, `createdAt < :last` skips the second one. Sort by `(createdAt, id)` and compare the tuple.\n- **Exact total count for free**: false; a total needs a separate `COUNT(*)`, which is expensive on big tables. Many APIs return `hasMore`/`nextCursor` instead of a total.\n- **Opaque cursors**: true; an opaque cursor is a contract ("pass me back what I gave you"), not a format clients may build or parse.\n\nRule of thumb: offset for small, stable admin lists with page numbers; cursor for feeds, infinite scroll, sync APIs and large tables.',
    hint: 'Think about what the database does for a deep `OFFSET`, what a cursor needs from the sort key, and what a cursor can and cannot tell you about position and totals.',
  },
  {
    id: 'api-design-keyset-cursor-page',
    domain: 'apis',
    subject: 'api-design',
    topic: 'pagination',
    level: 'senior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement keyset pagination with an opaque cursor. `rows` are already sorted by `createdAt DESC, id DESC` (the index order). Note that several rows share the same `createdAt`.\n\n`solution(rows, limit, cursor)` returns `{ ids, nextCursor }`:\n\n- `cursor` is `null` for the first page, otherwise it is `btoa(JSON.stringify({ createdAt, id }))` of the **last row of the previous page** (keys in that order).\n- `ids` are the ids of up to `limit` rows that come strictly **after** the cursor in the sort order.\n- `nextCursor` encodes the last returned row the same way, or is `null` when no rows remain after this page.',
    starter: `type Row = { id: number; createdAt: string };
type Page = { ids: number[]; nextCursor: string | null };

export function solution(rows: Row[], limit: number, cursor: string | null): Page {
  return { ids: [], nextCursor: null };
}`,
    tests: [
      {
        name: 'first page',
        args: [
          [
            { id: 7, createdAt: '2026-09-20' },
            { id: 6, createdAt: '2026-09-19' },
            { id: 5, createdAt: '2026-09-19' },
            { id: 4, createdAt: '2026-09-19' },
            { id: 2, createdAt: '2026-09-18' },
          ],
          2,
          null,
        ],
        expected: { ids: [7, 6], nextCursor: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTE5IiwiaWQiOjZ9' },
      },
      {
        name: 'second page does not skip rows that share a timestamp',
        args: [
          [
            { id: 7, createdAt: '2026-09-20' },
            { id: 6, createdAt: '2026-09-19' },
            { id: 5, createdAt: '2026-09-19' },
            { id: 4, createdAt: '2026-09-19' },
            { id: 2, createdAt: '2026-09-18' },
          ],
          2,
          'eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTE5IiwiaWQiOjZ9',
        ],
        expected: { ids: [5, 4], nextCursor: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTE5IiwiaWQiOjR9' },
      },
      {
        name: 'last page has no next cursor',
        args: [
          [
            { id: 7, createdAt: '2026-09-20' },
            { id: 6, createdAt: '2026-09-19' },
            { id: 5, createdAt: '2026-09-19' },
            { id: 4, createdAt: '2026-09-19' },
            { id: 2, createdAt: '2026-09-18' },
          ],
          2,
          'eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTE5IiwiaWQiOjR9',
        ],
        expected: { ids: [2], nextCursor: null },
      },
      {
        name: 'page that exactly fits the remaining rows has no next cursor',
        args: [
          [
            { id: 7, createdAt: '2026-09-20' },
            { id: 6, createdAt: '2026-09-19' },
          ],
          2,
          null,
        ],
        expected: { ids: [7, 6], nextCursor: null },
      },
    ],
    solution: `type Row = { id: number; createdAt: string };
type Page = { ids: number[]; nextCursor: string | null };

const encode = (row: Row): string => btoa(JSON.stringify({ createdAt: row.createdAt, id: row.id }));

export function solution(rows: Row[], limit: number, cursor: string | null): Page {
  let remaining = rows;
  if (cursor !== null) {
    const after = JSON.parse(atob(cursor)) as Row;
    remaining = rows.filter(
      (row) => row.createdAt < after.createdAt || (row.createdAt === after.createdAt && row.id < after.id),
    );
  }
  const fetched = remaining.slice(0, limit + 1);
  const page = fetched.slice(0, limit);
  const hasMore = fetched.length > limit;
  return {
    ids: page.map((row) => row.id),
    nextCursor: hasMore && page.length > 0 ? encode(page[page.length - 1]) : null,
  };
}`,
    tags: ['cursor-pagination', 'keyset', 'opaque-cursor'],
    source: 'notion',
    explanation:
      'Two traps. First, comparing only `createdAt < cursor.createdAt` skips ids 5 and 4 on page 2, because they share the cursor\'s timestamp. The boundary must compare the **full sort tuple**: `(createdAt, id) < (cursorCreatedAt, cursorId)`, which in Postgres is literally `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3` against a composite index. Second, fetching `limit + 1` rows is the cheap way to know whether a next page exists without a `COUNT(*)`, and it avoids handing out a cursor that leads to an empty page.\n\nThe cursor is base64 so clients treat it as **opaque**; in production you would also sign it or validate its decoded shape, since it is user input.\n\n**Say this out loud:** "I paginate by keyset: the cursor encodes the sort values of the last row, the query seeks past that tuple with a unique tie-breaker, I fetch limit plus one to know if there is a next page, and the cursor stays opaque so I can change it later."',
    hint: 'Compare the full `(createdAt, id)` tuple against the decoded cursor, not just the timestamp; decode it with `atob` and `JSON.parse`.',
  },
  {
    id: 'api-design-breaking-changes',
    domain: 'apis',
    subject: 'api-design',
    topic: 'versioning',
    level: 'mid',
    kind: 'multi',
    prompt: 'You maintain `/v1/orders`, used by third-party clients. Which changes are **breaking** and would need a new version (or a migration period)? Select all that apply.',
    options: [
      { id: 'a', text: 'Adding an optional `giftMessage` field to the response' },
      { id: 'b', text: 'Renaming `total` to `totalAmount` in the response' },
      { id: 'c', text: 'Making the previously optional `currency` request field required' },
      { id: 'd', text: 'Changing `id` from a number to a string' },
      { id: 'e', text: 'Adding a new endpoint `GET /v1/orders/{id}/refunds`' },
    ],
    answer: ['b', 'c', 'd'],
    tags: ['backward-compatibility'],
    source: 'topic-list',
    explanation:
      'A change is breaking when a client that worked yesterday fails today without changing its code.\n\n- **Additive** changes are safe: the optional `giftMessage` response field and the new `/refunds` endpoint, *provided* clients follow the tolerant-reader rule and ignore unknown fields.\n- **Removing or renaming** anything a client reads (`total` to `totalAmount`), **tightening** input rules (making `currency` required), and **changing types** (`id` from number to string, which breaks typed clients and `===` comparisons) are breaking.\n\nThe gray zone: adding a value to a response enum can break clients that switch exhaustively over it. Document enums as open ("expect new values") from day one.',
    hint: 'Apply one test to each change: would a client that worked yesterday fail today without changing its code, assuming it ignores unknown fields?',
  },
  {
    id: 'api-design-versioning-and-deprecation',
    domain: 'apis',
    subject: 'api-design',
    topic: 'versioning',
    level: 'senior',
    kind: 'open',
    prompt: 'You must ship a breaking change to a public API that hundreds of external clients use. How do you version it, and how do you retire the old version?',
    modelAnswer:
      'First I try hard to avoid the break: most changes can be additive (new field, new endpoint), and a new major version is a cost every client pays. If it is truly breaking, I pick one versioning scheme and keep it consistent: a major version in the path (`/v2/orders`) is the most visible and cache-friendly; a header or media type (`Accept: application/vnd.acme.v2+json`) keeps URLs stable; date-based versions pinned per account (Stripe\'s model) let the server run one codebase with a chain of request/response transformers per version. Internally I avoid forking the whole service; v1 becomes an adapter that translates to the v2 domain model. For retirement I announce a timeline, mark responses with `Deprecation` and `Sunset` headers and a link to the migration guide, and measure per-client v1 traffic so I contact the laggards directly. Only when usage is near zero do I turn it off, often with brownouts first (short scheduled outages) so forgotten integrations surface before the final date.',
    rubric: [
      'Tries additive, backward-compatible change first and treats a major version as a last resort',
      'Compares URI vs header/media-type vs date-based versioning with a reason for the choice',
      'Keeps one core implementation with version adapters/transformers rather than forked codebases',
      'Deprecation process: timeline, Deprecation/Sunset headers, migration guide, per-client usage telemetry',
      'Mentions brownouts or staged shutdown before removing the old version',
    ],
    tags: ['backward-compatibility', 'deprecation', 'sunset-header'],
    source: 'notion',
    explanation:
      'A senior answer treats versioning as a **lifecycle**, not a URL prefix. The prefix is the easy part; the hard parts are avoiding breaks, keeping one implementation, and retiring old versions with data instead of hope.\n\n**Say this out loud:** "I avoid breaking changes by evolving additively; when I must break, I version explicitly, keep v1 as an adapter over the new model, and retire it with Sunset headers, usage telemetry per client and brownouts before the cut-off."',
    hint: 'Cover avoiding breaks with additive changes, where the version lives, one implementation behind adapters, and retiring with `Deprecation`/`Sunset` headers and usage data.',
  },
  {
    id: 'api-design-error-envelope',
    domain: 'apis',
    subject: 'api-design',
    topic: 'response-shape',
    level: 'junior',
    kind: 'single',
    prompt: 'A request fails validation because `email` is malformed and `age` is negative. Which response is the best design?',
    options: [
      { id: 'a', text: '`200 OK` with this body:\n\n```json\n{\n  "success": false,\n  "message": "Invalid input"\n}\n```' },
      { id: 'b', text: '`400 Bad Request` with the plain-text body `Invalid input`' },
      {
        id: 'c',
        text: '`422 Unprocessable Content` with `Content-Type: application/problem+json` and this body:\n\n```json\n{\n  "type": "https://api.acme.io/errors/validation",\n  "title": "Invalid request",\n  "status": 422,\n  "errors": [\n    { "field": "email", "code": "invalid_format" },\n    { "field": "age", "code": "min", "min": 0 }\n  ]\n}\n```',
      },
      { id: 'd', text: '`500 Internal Server Error` with the validation library\'s stack trace, so the client can debug' },
    ],
    answer: 'c',
    tags: ['problem-details', 'error-handling', 'rfc-9457'],
    source: 'topic-list',
    explanation:
      'A good error response has an **accurate status code** (so proxies, retries and monitoring work), a **consistent machine-readable envelope** (so every client handles every error the same way), **stable error codes** the client can branch on (not English messages), and **field-level detail** so a form can highlight both fields at once.\n\nRFC 9457 *Problem Details for HTTP APIs* (which replaced RFC 7807) standardizes that envelope: `type`, `title`, `status`, `detail`, `instance`, plus extension members such as `errors`. `200 OK` with `success: false` hides the failure from HTTP tooling, a plain-text `Invalid input` body is not machine-readable, and a `500` with a stack trace is a 5xx for a client mistake that also leaks internals. `400` is also acceptable for validation errors, as long as the body\'s `status` member matches the HTTP status (RFC 9457 requires it).',
    hint: 'Judge each response by four things: an accurate status, a consistent machine-readable body, field-level detail, and no leaked internals.',
  },
  {
    id: 'api-design-202-accepted-meaning',
    domain: 'apis',
    subject: 'api-design',
    topic: 'response-shape',
    level: 'junior',
    kind: 'single',
    prompt: '`POST /reports` starts a report that takes about 3 minutes to build. The server answers `202 Accepted` with `Location: /jobs/abc123`. What does that tell the client?',
    options: [
      { id: 'a', text: 'The report is ready and can be downloaded from `/jobs/abc123`' },
      { id: 'b', text: 'The request was accepted for processing, which has not finished (and may still fail); check `/jobs/abc123` for its status' },
      { id: 'c', text: 'The server was too busy; the client should retry the POST later' },
      { id: 'd', text: 'The report was created and `/jobs/abc123` is its permanent URL, the same as `201 Created`' },
    ],
    answer: 'b',
    tags: ['async-jobs', '202'],
    source: 'notion',
    explanation:
      '`202 Accepted` is intentionally non-committal: the work was **queued**, not done, and it can still fail. The `Location` header points at a **job (status) resource** the client can poll: it reports `pending`/`running`/`failed`/`succeeded`, and on success links to (or redirects with `303 See Other` to) the finished report.\n\n`201 Created` means the resource already exists. "Too busy, retry later" is `503` or `429` with `Retry-After`. Holding the HTTP request open for 3 minutes instead would hit load balancer and API Gateway timeouts (API Gateway REST integrations cap at 29 s by default).',
    hint: 'Recall how committal 202 is compared with 201, and what kind of resource the `Location` header points at.',
  },
  {
    id: 'api-design-long-running-jobs',
    domain: 'apis',
    subject: 'api-design',
    topic: 'response-shape',
    level: 'senior',
    kind: 'open',
    prompt:
      'Design the API for a long-running operation (an AI agent task or a large export, 30 s to 10 min). The web app wants live progress, partner systems want to be notified when it finishes, and clients on flaky mobile networks retry requests. Walk through the endpoints and the delivery options.',
    modelAnswer:
      '`POST /exports` validates the input, enqueues a job (SQS, BullMQ), so the work never runs inside the HTTP request where load balancer and API gateway timeouts would cut it off, and returns `202 Accepted` with `Location: /exports/{id}` and the job body; the POST accepts an `Idempotency-Key` so a retried submit does not start a second job. `GET /exports/{id}` is the source of truth: `status`, `progress`, timestamps, an `error` in problem-details shape on failure, and a `resultUrl` (for example a presigned S3 link) on success. Polling is the baseline every client can use; the server sends `Retry-After` to pace it. For the web app I add Server-Sent Events on `GET /exports/{id}/events` for progress or streamed tokens: SSE is plain HTTP, one-directional and auto-reconnects with `Last-Event-ID`, which is all progress needs; WebSockets only if the client must also send messages mid-task. For partners I offer webhooks: they register a URL, I POST a signed payload (HMAC over the body plus a timestamp) with retries and backoff, and the payload carries an event id so their handler can deduplicate, since delivery is at-least-once. Webhooks are a notification, not the data contract: receivers should re-fetch the job resource.',
    rubric: [
      '202 Accepted + Location of a job resource, with the job resource as the single source of truth',
      'Idempotency key on the submit so retries do not create duplicate jobs',
      'Polling with Retry-After as the baseline, SSE for live progress (with a reason vs WebSockets)',
      'Webhooks with signatures, retries and at-least-once delivery handled by event-id deduplication',
      'Work runs on a queue/worker, not inside the HTTP request, because of gateway timeouts',
    ],
    tags: ['async-jobs', '202', 'sse', 'webhooks', 'idempotency-key', 'agentic'],
    source: 'notion',
    explanation:
      'This is the "agentic API" question in disguise: a long LLM or agent call is just a long-running job. The shape is always the same: **accept fast, process in the background, expose state as a resource, and push notifications as an optimization on top of polling**.\n\n| Channel | Direction | Best for |\n|---|---|---|\n| Polling | client pulls | Every client, simplest, cache-friendly |\n| SSE | server to browser | Progress, streamed LLM tokens |\n| WebSocket | both ways | Interactive sessions, chat |\n| Webhook | server to server | Partner systems, completion events |\n\n**Say this out loud:** "I return 202 with a job resource that is the source of truth, run the work on a queue, let clients poll it, stream progress with SSE, and notify partners with signed, retried webhooks that they deduplicate by event id."',
    hint: 'Accept fast and expose the job as a resource first; then layer on progress streaming, webhooks for partners and idempotency keys for retries.',
  },
];
