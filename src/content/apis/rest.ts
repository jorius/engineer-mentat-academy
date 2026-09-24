// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'rest-resource-nouns-vs-rpc',
    domain: 'apis',
    subject: 'rest',
    topic: 'http-methods',
    level: 'junior',
    kind: 'single',
    prompt: 'You are exposing tickets over HTTP. Which set of endpoints is **REST** style rather than RPC style?',
    options: [
      { id: 'a', text: '`GET /getTickets`, `POST /createTicket`, `POST /updateTicket`, `POST /deleteTicket`' },
      { id: 'b', text: '`GET /tickets`, `POST /tickets`, `PATCH /tickets/123`, `DELETE /tickets/123`' },
      { id: 'c', text: '`POST /tickets/list`, `POST /tickets/create`, `POST /tickets/update`, `POST /tickets/delete`' },
      { id: 'd', text: '`GET /tickets?action=create`, `GET /tickets?action=delete&id=123`' },
    ],
    answer: 'b',
    tags: ['rest-vs-rpc', 'resource-naming'],
    source: 'notion',
    explanation:
      'In REST the **path names a resource (a plural noun)** and the **HTTP method is the verb**. Putting the verb in the path (`/createTicket`, `/tickets/delete`) is RPC style: every operation becomes a POST, so you lose the method semantics that caches, proxies, retries and tooling rely on (GET is safe and cacheable, PUT/DELETE are idempotent).\n\nThe `GET /tickets?action=...` set is the worst of all: a `GET` that deletes data breaks the safety guarantee, and crawlers or link prefetchers can trigger it.\n\nRPC is not wrong in general (gRPC and JSON-RPC are legitimate), but if you call an API RESTful the resources should be nouns.',
    hint: 'Ask where the verb lives in each set: in the path, in a query parameter, or in the HTTP method itself.',
  },
  {
    id: 'rest-put-vs-patch-partial-body',
    domain: 'apis',
    subject: 'rest',
    topic: 'http-methods',
    level: 'junior',
    kind: 'single',
    prompt:
      'The stored user is:\n\n```json\n{\n  "name": "Ana",\n  "email": "ana@x.io",\n  "role": "admin"\n}\n```\n\nA client sends `PUT /users/7` with this body to a server that implements PUT exactly as the HTTP spec defines it:\n\n```json\n{\n  "email": "ana@y.io"\n}\n```\n\nWhat is stored afterwards?',
    options: [
      { id: 'a', text: '```json\n{\n  "name": "Ana",\n  "email": "ana@y.io",\n  "role": "admin"\n}\n```\nBecause PUT merges the fields it receives' },
      { id: 'b', text: '```json\n{\n  "email": "ana@y.io"\n}\n```\nBecause PUT replaces the whole representation with the body' },
      { id: 'c', text: 'Nothing changes; PUT is idempotent, so it cannot modify an existing resource' },
      { id: 'd', text: 'A new user is created with a generated id, because PUT means create' },
    ],
    answer: 'b',
    tags: ['put', 'patch'],
    source: 'notion',
    explanation:
      '**PUT is a full replace**: the body *is* the new state of the resource, so fields you omit are gone (or reset to defaults). That is also why PUT is idempotent: sending the same full state twice leaves the same result.\n\n**PATCH is a partial update**: you send only the change (a JSON Merge Patch like `{ "email": "ana@y.io" }` or a JSON Patch operation list). Use PATCH when clients edit a few fields.\n\nMany real APIs implement PUT as a merge, which is exactly the bug that silently wipes `role` when someone later "fixes" it to follow the spec. The claim that PUT cannot modify an existing resource because it is idempotent confuses idempotent (N calls = 1 call) with safe (no state change).',
    hint: 'Recall whether the HTTP spec treats a PUT body as a partial change or as the complete new state of the resource.',
  },
  {
    id: 'rest-non-crud-actions-design',
    domain: 'apis',
    subject: 'rest',
    topic: 'http-methods',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your ticketing API needs operations that are not plain CRUD: **close** a ticket, **assign** it to an agent, and **merge** ticket 123 into ticket 456. How do you model these in a REST API, and when would you accept an RPC-style endpoint?',
    modelAnswer:
      'First ask whether the action is really a state change on a resource. Closing is `PATCH /tickets/123` with `{ "status": "closed" }`; the server validates the transition (you cannot close an already merged ticket) and returns `409 Conflict` for an illegal one. Assignment can be modeled as a sub-resource, `PUT /tickets/123/assignee` with `{ "agentId": 9 }`, or `POST /tickets/123/assignments` if you want an audit history of assignments. Merge touches two tickets and has side effects, so I model it as creating a resource: `POST /ticket-merges` with `{ "source": 123, "target": 456 }` returning `201` and the merge record, or `202` if it is long-running. If none of that reads naturally, a controller-style `POST /tickets/123:merge` or `POST /tickets/123/merge` is an accepted, documented exception (Google AIP custom methods do this); it must be POST because it is neither safe nor idempotent by default. What I avoid is verbs as top-level paths for everything, and never a GET that mutates state.',
    rubric: [
      'Models simple actions as state changes via PATCH on the resource, with server-side transition validation',
      'Uses sub-resources or "action as a created resource" (e.g. POST /ticket-merges) for multi-entity operations',
      'Knows the custom-method escape hatch (POST /tickets/123:merge) and uses POST for it',
      'Names the right status codes: 409 for illegal transitions, 201/202 for created or async actions',
      'Rules out GET for anything that mutates state',
    ],
    tags: ['rest-vs-rpc', 'resource-naming', 'api-design'],
    source: 'notion',
    explanation:
      'Interviewers use this to see whether you apply REST as a tool or as a religion. The strong answer maps most actions onto resources (state fields, sub-resources, or the action itself as a resource you create) and admits a clearly bounded RPC-style exception when the domain demands it.\n\n**Say this out loud:** "Most verbs are really state transitions, so I PATCH the state and let the server validate the transition; for multi-resource operations I create a resource that represents the action, and only as a last resort do I add a documented custom POST method."',
    hint: 'Cover which actions are really state transitions, when a sub-resource or an action-as-resource fits, the custom-method escape hatch, and status codes for illegal transitions.',
  },
  {
    id: 'rest-status-401-vs-403',
    domain: 'apis',
    subject: 'rest',
    topic: 'status-codes',
    level: 'junior',
    kind: 'single',
    prompt:
      'A request to `DELETE /projects/42` arrives with a **valid, unexpired** bearer token for a user whose role is `viewer`. Viewers may not delete projects. Which status code fits best?',
    options: [
      { id: 'a', text: '`401 Unauthorized`' },
      { id: 'b', text: '`403 Forbidden`' },
      { id: 'c', text: '`400 Bad Request`' },
      { id: 'd', text: '`405 Method Not Allowed`' },
    ],
    answer: 'b',
    tags: ['401', '403', 'authz'],
    source: 'notion',
    explanation:
      'Despite its name, **401 means "unauthenticated"**: no credentials, or credentials that are invalid or expired. It must come with a `WWW-Authenticate` header (RFC 9110 §15.5.2) telling the client how to authenticate. **403 means "authenticated, but not allowed"**: retrying with the same identity will not help.\n\n`405` is for a method the resource does not support at all (for anyone), and it must include an `Allow` header. `400` is for a malformed request.\n\nWhen revealing that a resource *exists* is itself a leak (another tenant\'s project), many APIs return `404` instead of `403`. That is a deliberate choice, not a mistake.',
    hint: 'Separate "who is calling" from "what they may do", and check which of the two a valid, unexpired token already settles.',
  },
  {
    id: 'rest-status-code-choices',
    domain: 'apis',
    subject: 'rest',
    topic: 'status-codes',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which pairings of scenario and response are correct? Select all that apply.',
    options: [
      { id: 'a', text: '`POST /users` creates a user synchronously: `201 Created` with a `Location: /users/88` header' },
      { id: 'b', text: '`DELETE /users/88` succeeds and there is nothing to return: `204 No Content`' },
      { id: 'c', text: '`POST /users` with an email that already exists (unique constraint): `409 Conflict`' },
      { id: 'd', text: 'The request body fails validation: `200 OK` with this body:\n\n```json\n{\n  "success": false,\n  "error": "email invalid"\n}\n```' },
      { id: 'e', text: 'The client sends malformed JSON that the parser cannot read: `500 Internal Server Error`' },
      { id: 'f', text: 'The client exceeded its quota: `429 Too Many Requests` with a `Retry-After` header' },
    ],
    answer: ['a', 'b', 'c', 'f'],
    tags: ['201', '204', '409', '429', 'error-handling'],
    source: 'notion',
    explanation:
      '- **201 + Location** tells the client where the new resource lives.\n- **204** is success with an empty body; a `200` with the deleted entity is also fine.\n- **409** signals a conflict with the current state of the resource (duplicate key, version mismatch, illegal state transition).\n- **429 + Retry-After** lets well-behaved clients back off.\n\n`200 OK` with `success: false` is the classic anti-pattern: a `200` for a failure blinds every proxy, retry policy, monitoring dashboard and SDK that relies on status codes. Use `400` or `422` with an error body. Answering malformed JSON with `500` blames the server for a client mistake; malformed JSON is `400`. A 5xx should mean "our fault", and alerting on 5xx rates only works if you keep that promise.',
    hint: 'For each pairing, ask whether the status tells proxies, retries and monitoring the truth, and whether the fault lies with the client or the server.',
  },
  {
    id: 'rest-if-match-412-lost-update',
    domain: 'apis',
    subject: 'rest',
    topic: 'status-codes',
    level: 'senior',
    kind: 'single',
    prompt:
      'Two support agents open ticket 123 at the same time (both receive `ETag: "v7"`). Agent A saves first, the ticket becomes `v8`. Agent B then sends `PUT /tickets/123` with `If-Match: "v7"`. What should the server do to prevent the lost update?',
    options: [
      { id: 'a', text: 'Apply the write; last write wins is the HTTP default and `If-Match` is only a caching hint' },
      { id: 'b', text: 'Reject with `412 Precondition Failed`; the client refetches, reconciles and retries with the new ETag' },
      { id: 'c', text: 'Return `304 Not Modified`, because the client already has a copy of the resource' },
      { id: 'd', text: 'Reject with `428 Precondition Required`, because the ETag is out of date' },
    ],
    answer: 'b',
    tags: ['etag', 'optimistic-concurrency', 'conditional-requests'],
    source: 'topic-list',
    explanation:
      '`If-Match` makes the write **conditional**: "apply this only if the current version is still `v7`". Since the version is now `v8`, the precondition fails and the server answers **412 Precondition Failed** without changing anything. This is optimistic concurrency control over HTTP, the same idea as a `version` column checked in `UPDATE ... WHERE version = 7`.\n\n`304` is the answer to a conditional **GET** with `If-None-Match` (the cached copy is still fresh). `428 Precondition Required` is what you return when the client sent **no** `If-Match` at all on an endpoint that requires one. Many APIs use `409 Conflict` for version mismatches carried in the body; with HTTP preconditions, 412 is the precise code.\n\n**Say this out loud:** "I prevent lost updates with ETags: reads return a version, writes send `If-Match`, and a stale version gets a 412 so the client has to reconcile instead of silently overwriting someone else\'s change."',
    hint: 'Treat `If-Match` as a conditional write, like optimistic locking with a version column, and recall which status means a precondition did not hold.',
  },
  {
    id: 'rest-idempotent-but-not-safe',
    domain: 'apis',
    subject: 'rest',
    topic: 'idempotency',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which HTTP methods are **idempotent but not safe** as the HTTP specification defines them? Select all that apply.',
    options: [
      { id: 'a', text: '`GET`' },
      { id: 'b', text: '`PUT`' },
      { id: 'c', text: '`DELETE`' },
      { id: 'd', text: '`POST`' },
      { id: 'e', text: '`PATCH`' },
    ],
    answer: ['b', 'c'],
    tags: ['safe-methods', 'idempotent-methods', 'retries'],
    source: 'notion',
    explanation:
      '**Safe** = does not change server state (read-only). **Idempotent** = the effect of N identical requests equals the effect of one, so it is safe to *retry*.\n\n| Method | Safe | Idempotent |\n|---|---|---|\n| GET, HEAD, OPTIONS | yes | yes |\n| PUT | no | yes (full replace, same state every time) |\n| DELETE | no | yes (deleted twice is still deleted) |\n| PATCH | no | not guaranteed (`{ "op": "increment" }` is not) |\n| POST | no | no (each call may create a new resource) |\n\nGET is idempotent **and** safe, so it does not qualify. A common trap: the second `DELETE` may return `404` instead of `204`. It is still idempotent, because idempotency is about **server state**, not about getting the same response. That is also why clients and proxies may auto-retry PUT and DELETE after a timeout, but not POST without an idempotency key.',
    hint: 'Define both terms first: safe means no state change, idempotent means N identical requests have the effect of one. Then check each method against both.',
  },
  {
    id: 'rest-idempotency-key-replay',
    domain: 'apis',
    subject: 'rest',
    topic: 'idempotency',
    level: 'senior',
    kind: 'fix',
    language: 'typescript',
    prompt:
      'This handler processes `POST /payments` requests that carry an `Idempotency-Key` header. Mobile clients retry on timeouts, and customers are being **double-charged**. Fix `solution` so that:\n\n- a retry with the same key and the same amount **replays the original response** without charging again;\n- a key reused with a **different amount** gets `{ status: 422, chargeId: null }` and no charge;\n- `charges` counts real charges, and charge ids are `ch_1`, `ch_2`, ... with no gaps.',
    starter: `type Req = { key: string; amount: number };
type Res = { status: number; chargeId: string | null };

export function solution(requests: Req[]): { responses: Res[]; charges: number } {
  const store = new Map<string, { amount: number; response: Res }>();
  let charges = 0;
  const responses = requests.map((req) => {
    charges += 1;
    const chargeId = \`ch_\${charges}\`;
    const seen = store.get(req.key);
    if (seen) {
      return seen.response;
    }
    const response = { status: 201, chargeId };
    store.set(req.key, { amount: req.amount, response });
    return response;
  });
  return { responses, charges };
}`,
    tests: [
      {
        name: 'retry with same key replays the first response',
        args: [[{ key: 'k1', amount: 50 }, { key: 'k1', amount: 50 }]],
        expected: { responses: [{ status: 201, chargeId: 'ch_1' }, { status: 201, chargeId: 'ch_1' }], charges: 1 },
      },
      {
        name: 'different keys are different payments',
        args: [[{ key: 'k1', amount: 50 }, { key: 'k2', amount: 50 }]],
        expected: { responses: [{ status: 201, chargeId: 'ch_1' }, { status: 201, chargeId: 'ch_2' }], charges: 2 },
      },
      {
        name: 'reused key with a different payload is rejected',
        args: [[{ key: 'k1', amount: 50 }, { key: 'k1', amount: 70 }]],
        expected: { responses: [{ status: 201, chargeId: 'ch_1' }, { status: 422, chargeId: null }], charges: 1 },
      },
      {
        name: 'ids have no gaps after a replay',
        args: [[{ key: 'a', amount: 10 }, { key: 'a', amount: 10 }, { key: 'b', amount: 20 }]],
        expected: {
          responses: [{ status: 201, chargeId: 'ch_1' }, { status: 201, chargeId: 'ch_1' }, { status: 201, chargeId: 'ch_2' }],
          charges: 2,
        },
      },
    ],
    solution: `type Req = { key: string; amount: number };
type Res = { status: number; chargeId: string | null };

export function solution(requests: Req[]): { responses: Res[]; charges: number } {
  const store = new Map<string, { amount: number; response: Res }>();
  let charges = 0;
  const responses = requests.map((req) => {
    const seen = store.get(req.key);
    if (seen) {
      if (seen.amount !== req.amount) {
        return { status: 422, chargeId: null };
      }
      return seen.response;
    }
    charges += 1;
    const response = { status: 201, chargeId: \`ch_\${charges}\` };
    store.set(req.key, { amount: req.amount, response });
    return response;
  });
  return { responses, charges };
}`,
    tags: ['idempotency-key', 'retries', 'payments'],
    source: 'notion',
    explanation:
      'Two bugs: the starter **charges before it checks the key**, so every retry moves money even though it replays the old response, and it **ignores the payload**, so a key accidentally reused for a different payment silently returns the wrong receipt.\n\nThe fix is "look up first, charge only on a miss, remember the request fingerprint with the response". In production the store is Redis or a DB table with a unique constraint on the key, entries expire after a TTL (Stripe keeps them 24 h), keys are scoped per client, and a request that arrives **while the first is still in flight** gets `409 Conflict` (the IETF Idempotency-Key draft uses 409 for that and 422 for a payload mismatch). The key must be written atomically with the side effect, or a crash between the two reintroduces the double charge.\n\n**Say this out loud:** "POST is not idempotent, so I make it idempotent with a client-generated key: check the key before the side effect, store a hash of the request with the response, replay on a match, reject a mismatched payload, and make the key write atomic with the charge."',
    hint: 'Look up the key before any side effect, store the request amount alongside the saved response, and only charge on a miss.',
  },
];
