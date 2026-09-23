// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'api-security-jwt-payload-readable',
    domain: 'apis',
    subject: 'api-security',
    topic: 'authn-vs-authz',
    level: 'junior',
    kind: 'single',
    prompt:
      'After login your API returns a signed JWT (`header.payload.signature`, HS256 or RS256) that the client sends as `Authorization: Bearer <token>`. Which statement is true?',
    options: [
      { id: 'a', text: 'The payload is encrypted, so it is safe to put the user\'s password hash or PII in it' },
      { id: 'b', text: 'Anyone holding the token can read the payload (it is base64url); the signature only lets the server detect tampering and verify who issued it' },
      { id: 'c', text: 'The server must look the token up in its database on every request, otherwise it cannot know the token is valid' },
      { id: 'd', text: 'Logging the user out immediately invalidates every copy of the token' },
    ],
    answer: 'b',
    tags: ['jwt', 'authentication'],
    source: 'notion',
    explanation:
      'A JWT is **signed, not encrypted** (unless you use JWE). Paste one into any decoder and the claims are right there, so never put secrets in it. The signature (HMAC with a shared secret, or RSA/ECDSA with a key pair) proves the token was issued by someone holding the key and has not been modified.\n\nThat makes JWTs **stateless**: the server verifies signature, `exp`, `iss` and `aud` without a DB lookup (**c** is false). The flip side is **d**: a stolen token stays valid until it expires. You mitigate with short-lived access tokens (5 to 15 min), refresh-token rotation, and a denylist of token ids (`jti`) only when you need instant revocation.\n\nAuthentication answers *who are you*; the claims in the token (roles, scopes) are inputs to authorization, which you still enforce per request.',
  },
  {
    id: 'api-security-bola-object-level-authz',
    domain: 'apis',
    subject: 'api-security',
    topic: 'authn-vs-authz',
    level: 'mid',
    kind: 'single',
    prompt:
      'A customer logs in, opens `GET /api/invoices/1041` (their own invoice), then edits the URL to `/api/invoices/1042` and sees another company\'s invoice. The token was valid and not expired. What failed, and what is the fix?',
    options: [
      { id: 'a', text: 'Authentication failed; add MFA so attackers cannot log in' },
      { id: 'b', text: 'Authorization failed at the object level (BOLA/IDOR); every lookup must check that the invoice belongs to the caller\'s tenant, e.g. `WHERE id = :id AND tenant_id = :tokenTenant`' },
      { id: 'c', text: 'The ids are guessable; switching to UUIDs fixes the vulnerability' },
      { id: 'd', text: 'CORS is misconfigured; restricting allowed origins would block the request' },
    ],
    answer: 'b',
    tags: ['bola', 'idor', 'authorization', 'multi-tenancy', 'owasp-api'],
    source: 'topic-list',
    explanation:
      '**Authentication** (who you are) worked: the token was genuine. **Authorization** (what you may do *to this object*) was never checked. This is **Broken Object Level Authorization**, #1 in the OWASP API Security Top 10, also called IDOR.\n\nThe fix belongs in the data access path, not the UI: scope every query by the caller\'s tenant or ownership taken **from the verified token**, never from a request parameter, and return `404` (not `403`) so you do not confirm the object exists. Row-level security in Postgres is a strong backstop.\n\n**c** is defense in depth only: UUIDs make ids harder to guess, but they leak through logs, shared links and other endpoints, and they do not add a permission check. **d** is irrelevant; CORS does not stop a logged-in user from calling the API directly.',
  },
  {
    id: 'api-security-cognito-authorizer-scope',
    domain: 'apis',
    subject: 'api-security',
    topic: 'authn-vs-authz',
    level: 'mid',
    kind: 'single',
    prompt:
      'API Gateway sits in front of your Lambda with a **Cognito user pool authorizer**. Users sign in through Cognito and send the ID or access token on each call. Which of these is **still your code\'s responsibility**?',
    options: [
      { id: 'a', text: 'Verifying the token signature against the user pool\'s JWKS' },
      { id: 'b', text: 'Rejecting expired tokens' },
      { id: 'c', text: 'Checking that the caller may act on the specific resource, e.g. that order 55 belongs to `claims.sub` or that the user is in the `admins` group' },
      { id: 'd', text: 'Storing and hashing user passwords' },
    ],
    answer: 'c',
    tags: ['cognito', 'aws', 'authorization', 'jwt'],
    source: 'topic-list',
    explanation:
      '**Cognito** is the identity provider: it stores users and password hashes, runs sign-up/sign-in/MFA, federates with social and SAML/OIDC providers, and issues JWTs (ID, access and refresh tokens). The **API Gateway Cognito authorizer** validates the token (signature via the pool\'s JWKS, expiry, issuer, and for access tokens the OAuth scopes you configure) before your Lambda runs, and passes the claims in `requestContext.authorizer`.\n\nWhat neither can know is your domain rule: *this* user may read *this* order. That object-level check, plus role checks from `cognito:groups` or custom claims, lives in your service. In short: Cognito gives you authentication and coarse-grained scopes, you own fine-grained authorization.',
  },
  {
    id: 'api-security-fixed-window-boundary-burst',
    domain: 'apis',
    subject: 'api-security',
    topic: 'rate-limiting',
    level: 'mid',
    kind: 'single',
    prompt:
      'Your limiter allows **100 requests per minute** using a **fixed window** counter keyed by `apiKey:currentMinute`. A client sends 100 requests at 12:00:59 and 100 more at 12:01:00. How many are accepted, and which algorithm prevents this?',
    options: [
      { id: 'a', text: '100; a fixed window already guarantees at most 100 requests in any 60-second span' },
      { id: 'b', text: '200; the counter resets at the minute boundary. A sliding window (log or weighted counter) or a token bucket bounds the burst' },
      { id: 'c', text: '101; one request is let through as the window rolls over' },
      { id: 'd', text: '200; only an IP-based limit instead of an API-key limit prevents this' },
    ],
    answer: 'b',
    tags: ['fixed-window', 'sliding-window', 'token-bucket'],
    source: 'notion',
    explanation:
      'A fixed window counts per calendar bucket, so a client can spend a full quota at the end of one window and another full quota at the start of the next: **2x the limit in two seconds**.\n\n- **Sliding window log**: store each request timestamp and count those in the last 60 s. Exact, but memory grows with the limit.\n- **Sliding window counter**: weight the previous window\'s count by how much of it still overlaps (`prev * (1 - elapsed/60) + current`). Cheap and close enough; common with Redis.\n- **Token bucket**: a bucket of `capacity` tokens refilled at a steady rate; each request takes one. It deliberately **allows bursts up to capacity** while enforcing the long-run average, which is usually what you want for APIs (AWS API Gateway throttling uses it).\n\nThe key choice (API key, user, IP) is a separate decision from the algorithm.',
  },
  {
    id: 'api-security-token-bucket-allow',
    domain: 'apis',
    subject: 'api-security',
    topic: 'rate-limiting',
    level: 'senior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement the decision function of a **token bucket** rate limiter, `allow(timestamps, capacity, refillPerSec)`, exported as `solution`.\n\n- `timestamps` are request arrival times in **milliseconds**, in ascending order.\n- The bucket starts **full** with `capacity` tokens at the first request\'s time.\n- Tokens refill continuously at `refillPerSec` tokens per second, never above `capacity`.\n- A request is allowed if at least 1 token is available, and then consumes 1 token. Rejected requests consume nothing.\n\nReturn one boolean per request.',
    starter: `export function solution(timestamps: number[], capacity: number, refillPerSec: number): boolean[] {
  return [];
}`,
    tests: [
      { name: 'burst up to capacity, then reject', args: [[0, 0, 0, 0], 3, 1], expected: [true, true, true, false] },
      { name: 'refills over time', args: [[0, 0, 0, 1000], 2, 1], expected: [true, true, false, true] },
      { name: 'never refills above capacity', args: [[0, 10000, 10000, 10000, 10000], 3, 1], expected: [true, true, true, true, false] },
      { name: 'fractional refill between requests', args: [[0, 0, 500, 1000], 1, 2], expected: [true, false, true, true] },
      { name: 'no requests', args: [[], 5, 1], expected: [] },
    ],
    solution: `export function solution(timestamps: number[], capacity: number, refillPerSec: number): boolean[] {
  let tokens = capacity;
  let last = timestamps.length > 0 ? timestamps[0] : 0;
  return timestamps.map((now) => {
    tokens = Math.min(capacity, tokens + ((now - last) / 1000) * refillPerSec);
    last = now;
    if (tokens >= 1) {
      tokens -= 1;
      return true;
    }
    return false;
  });
}`,
    tags: ['token-bucket', 'algorithms'],
    source: 'notion',
    explanation:
      'The trick is **lazy refill**: no timer ticks tokens in. On each request you compute how many tokens accrued since the last one, `elapsed * rate`, add them, and **clamp to capacity** (without the clamp, a client idle for an hour could fire thousands of requests at once). Then spend one token or reject.\n\nThat is why the state per key is only two numbers, `tokens` and `lastRefill`, which fits in one Redis hash. In a distributed setup the read-refill-decrement must be **atomic** (a Lua script or `MULTI`), or two instances race and both spend the last token. A rejected call returns `429` with `Retry-After = ceil((1 - tokens) / rate)` seconds.\n\n**Say this out loud:** "A token bucket stores just tokens and a timestamp per key, refills lazily on each request capped at capacity, which allows controlled bursts while enforcing the average rate, and in Redis the check-and-decrement has to be one atomic script."',
  },
  {
    id: 'api-security-distributed-rate-limiting',
    domain: 'apis',
    subject: 'api-security',
    topic: 'rate-limiting',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your API runs on 12 containers behind a load balancer. Each instance has an in-memory limiter of 100 req/min per API key, yet a partner reports being able to send ~1 000 req/min, and an abusive client hits your login endpoint from thousands of IPs. How do you redesign rate limiting?',
    modelAnswer:
      'In-memory limiters multiply by the instance count (12 x 100), and the load balancer spreads requests, so the limit must live in shared state: a Redis token bucket or sliding-window counter updated atomically with a Lua script, keyed by the identity that the quota belongs to (API key or user id, not only IP, because of NAT and IPv6 rotation). Coarse, cheap protection goes to the edge: AWS WAF rate-based rules or API Gateway usage plans and throttling absorb floods before they cost compute. For the login endpoint I limit per account (failed attempts per username) as well as per IP, add exponential lockout or CAPTCHA after failures, and alert on credential-stuffing patterns. Responses use `429` with `Retry-After` and `RateLimit` headers so good clients back off. I decide explicitly what happens when Redis is down: usually fail open with a local fallback limiter for general traffic, fail closed for expensive or sensitive routes. Finally, different routes get different budgets: a report export or an LLM call costs far more than a GET, so I weight them.',
    rubric: [
      'Explains why per-instance in-memory limits multiply with horizontal scaling',
      'Uses shared, atomic state (Redis + Lua) with the right key (API key/user, not only IP)',
      'Layers limits: edge (WAF, API Gateway usage plans) plus application-level',
      'Login-specific defenses: per-account limits, lockout/CAPTCHA, credential-stuffing detection',
      'Returns 429 + Retry-After and has an explicit fail-open/fail-closed decision',
    ],
    tags: ['token-bucket', 'redis', 'waf', 'api-gateway', '429'],
    source: 'notion',
    explanation:
      'The bug is architectural, not algorithmic: a limiter is only as global as its state. Senior answers also separate **quota enforcement** (fairness between customers, keyed by API key) from **abuse defense** (keyed by account, IP reputation, device), because one algorithm keyed by IP does neither well.\n\n**Say this out loud:** "Rate limits have to live in shared atomic state keyed by the identity that owns the quota, layered with edge throttling, with per-account limits on login and an explicit fail-open or fail-closed decision when the limiter store is down."',
  },
  {
    id: 'api-security-public-endpoint-controls',
    domain: 'apis',
    subject: 'api-security',
    topic: 'common-practices',
    level: 'mid',
    kind: 'multi',
    prompt:
      'You expose a **public, unauthenticated** `POST /contact` endpoint used by your marketing site. Which measures actually protect it? Select all that apply.',
    options: [
      { id: 'a', text: 'Rate limiting per IP (and globally), returning `429` with `Retry-After`' },
      { id: 'b', text: 'Server-side schema validation: types, max lengths, allowed fields only, reject unknown properties' },
      { id: 'c', text: 'A CORS allowlist containing only the marketing domain, which stops bots and scripts from calling the endpoint' },
      { id: 'd', text: 'Relying on the form\'s client-side validation, since the only UI that calls it is yours' },
      { id: 'e', text: 'Parameterized queries when storing the message, and output-encoding it wherever it is later rendered (e.g. the admin inbox)' },
    ],
    answer: ['a', 'b', 'e'],
    tags: ['input-validation', 'cors', 'rate-limiting', 'xss', 'sql-injection'],
    source: 'notion',
    explanation:
      '- **a** limits brute force, spam and DoS; add a CAPTCHA or proof-of-work if abuse persists.\n- **b** is the core rule: **never trust input**. Validate at the boundary (zod, class-validator, JSON Schema) with allowlists and size limits; this also blocks mass-assignment of fields you did not intend to accept.\n- **e** handles the input you *did* accept: parameterized queries stop SQL injection, and output encoding (plus a CSP) stops stored XSS when an admin views the message.\n\n**c** is the classic misconception: **CORS is enforced by browsers**, and it only controls whether a page from another origin may *read* the response. `curl`, scripts and bots ignore it entirely. **d**: attackers do not use your form. Client-side validation is UX, not security.',
  },
  {
    id: 'api-security-token-storage-csrf',
    domain: 'apis',
    subject: 'api-security',
    topic: 'common-practices',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your React SPA at `app.acme.io` calls `api.acme.io`. A colleague stores the JWT access token in `localStorage`; another says to use cookies. Where do you keep tokens, and what CORS and CSRF configuration does your choice require?',
    modelAnswer:
      'Anything in `localStorage` is readable by any script on the page, so a single XSS (or a compromised npm dependency) exfiltrates a token the attacker can replay from anywhere until it expires. I prefer keeping the refresh token in an `HttpOnly; Secure; SameSite` cookie scoped to the auth path, and the short-lived access token in memory only; on reload the SPA calls the refresh endpoint to get a new access token (or I go further with a BFF that keeps tokens server-side and gives the browser only a session cookie). Cookies are sent automatically, which reintroduces CSRF, so I set `SameSite=Lax` or `Strict` (app and api are same-site under acme.io), keep state-changing routes off GET, and add a CSRF token (double-submit or synchronizer) or strict `Origin` header checks for defense in depth. CORS must allow exactly `https://app.acme.io` with `Access-Control-Allow-Credentials: true`; wildcard `*` is not allowed with credentials, and reflecting any `Origin` back is a serious misconfiguration because it lets any site make credentialed reads. HttpOnly does not make XSS harmless (the attacker can still make requests from the victim\'s page), so a strict CSP and output encoding remain necessary.',
    rubric: [
      'Explains the XSS exfiltration risk of localStorage and why HttpOnly cookies or in-memory tokens reduce it',
      'Recognizes that cookies bring CSRF and names SameSite plus a CSRF token or Origin checks',
      'Correct credentialed CORS: explicit origin, Allow-Credentials true, no wildcard, never reflect arbitrary origins',
      'Short-lived access tokens with refresh rotation (or a BFF keeping tokens server-side)',
      'Notes that HttpOnly limits token theft but not XSS itself, so CSP and encoding still matter',
    ],
    tags: ['jwt', 'cookies', 'csrf', 'cors', 'xss', 'bff'],
    source: 'notion',
    explanation:
      'There is no storage option without trade-offs; the interviewer wants to hear you pair each choice with the attack it opens. localStorage trades CSRF immunity for XSS token theft; cookies trade XSS theft resistance for CSRF, which SameSite plus tokens handle well.\n\nA useful distinction: **CORS** decides whether another origin may *read* your responses (a browser relaxation of the same-origin policy), while **CSRF** is about another origin *sending* a request that the browser decorates with your cookies. CORS does not stop CSRF.\n\n**Say this out loud:** "I keep the access token in memory and the refresh token in an HttpOnly, Secure, SameSite cookie, which removes token theft via XSS; because cookies bring CSRF back, I rely on SameSite plus a CSRF token or Origin checks, and CORS allows exactly my app origin with credentials, never a wildcard or a reflected origin."',
  },
];
