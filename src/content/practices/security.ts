// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'security-web-basics-cookie-flags',
    domain: 'practices',
    subject: 'security',
    topic: 'web-security-basics',
    level: 'junior',
    kind: 'multi',
    prompt:
      'Your session cookie is set with `Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/`. Which statements about these attributes are true? Select all that apply.',
    options: [
      { id: 'a', text: '`HttpOnly` stops page JavaScript (`document.cookie`) from reading the cookie, so an XSS payload cannot exfiltrate it directly' },
      { id: 'b', text: '`Secure` means the browser only sends the cookie over HTTPS' },
      { id: 'c', text: '`SameSite=Lax` stops the browser from attaching the cookie to cross-site `POST` requests and subresource requests' },
      { id: 'd', text: '`HttpOnly` protects against CSRF because the attacker cannot read the cookie' },
      { id: 'e', text: '`Secure` encrypts the cookie value so it cannot be read on the user\'s machine' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['cookies', 'httponly', 'samesite'],
    source: 'notion',
    explanation:
      '`HttpOnly` hides the cookie from JavaScript, which limits the blast radius of XSS (the attacker can still act *as* the user from the page, but cannot steal the session for later). `Secure` is about transport only; the value is stored in plain text. `SameSite=Lax` sends the cookie on same-site requests and on top-level `GET` navigations, but not on cross-site `POST`s, iframes or `fetch`. CSRF never needs to *read* the cookie: the browser attaches it automatically, which is why `HttpOnly` does nothing against CSRF and `SameSite` does.',
  },
  {
    id: 'security-web-basics-cors-misconceptions',
    domain: 'practices',
    subject: 'security',
    topic: 'web-security-basics',
    level: 'mid',
    kind: 'single',
    prompt: 'A teammate says "our API is safe from abuse because CORS only allows `https://app.example.com`". Which statement is correct?',
    options: [
      { id: 'a', text: 'Right: CORS stops any client other than `app.example.com` from calling the API' },
      { id: 'b', text: 'CORS is enforced by browsers and *relaxes* the same-origin policy for the origins you list; `curl`, scripts and servers ignore it, so it is not access control' },
      { id: 'c', text: '`Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true` is the safe way to allow cookies from any origin' },
      { id: 'd', text: 'Because every cross-origin `POST` is preflighted, CORS also fully prevents CSRF' },
    ],
    answer: 'b',
    tags: ['cors', 'same-origin-policy'],
    source: 'notion',
    explanation:
      'The same-origin policy is the protection; CORS is the server\'s opt-in to let a browser page from another origin **read** responses. Non-browser clients never check it, so authentication, authorization and rate limiting remain mandatory. Browsers refuse the `*` + credentials combination; you must echo a specific allowed origin. And "simple" requests (a form-encoded `POST` without custom headers) are **not** preflighted: the request is sent with cookies, only the response is hidden, which is exactly how classic CSRF works.',
  },
  {
    id: 'security-xss-escape-html',
    domain: 'practices',
    subject: 'security',
    topic: 'xss',
    level: 'junior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement `solution(input)` so it HTML-escapes untrusted text for safe insertion into an HTML element body or a **quoted** attribute value. Escape exactly these characters:\n\n| char | entity |\n|---|---|\n| `&` | `&amp;` |\n| `<` | `&lt;` |\n| `>` | `&gt;` |\n| `"` | `&quot;` |\n| `\'` | `&#39;` |\n\nEvery `&` in the input is escaped, including one that already looks like an entity.',
    starter: `export function solution(input: string): string {
  return input;
}`,
    tests: [
      { name: 'ampersand', args: ['Tom & Jerry'], expected: 'Tom &amp; Jerry' },
      { name: 'angle brackets', args: ['<script>'], expected: '&lt;script&gt;' },
      { name: 'double quote', args: ['say "hi"'], expected: 'say &quot;hi&quot;' },
      { name: 'single quote', args: ["it's"], expected: 'it&#39;s' },
      { name: 'attribute breakout payload', args: ['"><img src=x onerror="alert(\'xss\')">'], expected: '&quot;&gt;&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;' },
      { name: 'existing entity is escaped once', args: ['&lt;'], expected: '&amp;lt;' },
      { name: 'plain text unchanged', args: ['hello world'], expected: 'hello world' },
    ],
    solution: `const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function solution(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}`,
    tags: ['escaping', 'output-encoding'],
    source: 'notion',
    explanation:
      'A single pass with a character class is the safest shape: each character is replaced exactly once. With chained `.replace` calls, `&` **must** go first; otherwise `<` becomes `&lt;` and then its `&` is escaped again into `&amp;lt;`. Escaping is **context-specific**: this function is correct for element text and quoted attributes, but not for unquoted attributes, URLs (`javascript:` survives escaping), inline `<script>` blocks or CSS. That is why you rely on the framework (React escapes text children) and only hand-roll escaping at the edges.',
  },
  {
    id: 'security-xss-escaping-vs-sanitizing',
    domain: 'practices',
    subject: 'security',
    topic: 'xss',
    level: 'mid',
    kind: 'single',
    prompt:
      'Users write product reviews in a rich-text editor (bold, italics, lists, links), and the reviews must render **as formatted HTML** for other users. What is the right defence against stored XSS?',
    options: [
      { id: 'a', text: 'HTML-escape the review on output, as you would any user text' },
      { id: 'b', text: 'Sanitize with a vetted allowlist sanitizer (e.g. DOMPurify) that keeps only the allowed tags and attributes, strips event handlers and non-`http(s)` URLs, and back it with a CSP' },
      { id: 'c', text: 'Remove `<script>` tags with a regular expression before saving' },
      { id: 'd', text: 'Run the review through `encodeURIComponent` before inserting it' },
    ],
    answer: 'b',
    tags: ['sanitization', 'dompurify', 'stored-xss'],
    source: 'notion',
    explanation:
      '**Escaping** turns markup into inert text; it is the default for user data, but it would show the reviewer\'s `<b>` tags literally. When you must render user HTML, you **sanitize**: parse it and keep only an allowlist of tags, attributes and URL schemes. Blocklists fail: `<img src=x onerror=...>`, `<svg onload=...>` and `<a href="javascript:...">` contain no `<script>` tag, and regexes do not parse HTML. `encodeURIComponent` is for URL components, not HTML. Sanitize on output (or on both input and output) with a maintained library, and add a Content Security Policy as a second layer.',
  },
  {
    id: 'security-xss-react-vectors',
    domain: 'practices',
    subject: 'security',
    topic: 'xss',
    level: 'mid',
    kind: 'multi',
    prompt: 'In a React app, `bio`, `website` and `post` all come from other users. Which of these are XSS vectors? Select all that apply.',
    options: [
      { id: 'a', text: '`<p>{bio}</p>`' },
      { id: 'b', text: '`<div dangerouslySetInnerHTML={{ __html: bio }} />`' },
      { id: 'c', text: '`<a href={website}>Website</a>` without validating the URL scheme' },
      { id: 'd', text: '`useEffect(() => { ref.current.innerHTML = markdownToHtml(post); }, [post]);`' },
      { id: 'e', text: '`<input defaultValue={bio} />`' },
    ],
    answer: ['b', 'c', 'd'],
    tags: ['react', 'dangerouslysetinnerhtml', 'javascript-urls'],
    source: 'notion',
    explanation:
      'React escapes text children and attribute values, so `<p>{bio}</p>` and `<input defaultValue={bio} />` render the payload as inert text. `dangerouslySetInnerHTML` opts out of that on purpose: the name is the warning, and the input must be sanitized first. Setting `innerHTML` through a ref bypasses React completely; markdown renderers happily pass raw HTML through unless configured not to. `href` is escaped as a string but its **meaning** is not checked: `javascript:alert(1)` is still a URL, and depending on the React version you get only a console warning. Allowlist `http:`/`https:` (and maybe `mailto:`) for user-provided URLs.',
  },
  {
    id: 'security-xss-csp-rollout',
    domain: 'practices',
    subject: 'security',
    topic: 'xss',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your five-year-old web app has inline `<script>` blocks, a few `onclick="..."` handlers, and third-party analytics. After an XSS finding, you are asked to add a Content Security Policy. **What policy do you aim for, and how do you roll it out without breaking production?**',
    modelAnswer:
      'The target is a strict, nonce-based policy: `script-src \'nonce-{random}\' \'strict-dynamic\'; object-src \'none\'; base-uri \'none\'; frame-ancestors \'self\'`, with a fresh nonce generated per response and added to every legitimate `<script>`. `strict-dynamic` lets those trusted scripts load their own dependencies, so I do not maintain a fragile host allowlist. `unsafe-inline` and `unsafe-eval` are what make CSP useless against XSS, so inline `onclick` handlers must be refactored into `addEventListener` calls. I would ship it first as `Content-Security-Policy-Report-Only` with a `report-to` endpoint, watch the violation reports for a few weeks, fix or explicitly allow what is legitimate (analytics), and only then switch to enforcing. CSP is defence in depth: it limits what an injected payload can do, but it does not replace output escaping and sanitizing. I would also consider Trusted Types to lock down DOM sinks like `innerHTML`.',
    rubric: [
      'Chooses a nonce- or hash-based `script-src` and rejects `unsafe-inline` / `unsafe-eval`',
      'Knows inline event handlers must be refactored out for a strict policy',
      'Rolls out with `Content-Security-Policy-Report-Only` and a reporting endpoint before enforcing',
      'Includes hardening directives such as `object-src \'none\'`, `base-uri`, `frame-ancestors`',
      'Frames CSP as defence in depth, not a replacement for escaping and sanitizing',
    ],
    tags: ['csp', 'defence-in-depth', 'trusted-types'],
    source: 'notion',
    explanation:
      'A CSP with `unsafe-inline` in `script-src` blocks almost nothing, because injected XSS is inline script. Nonces make "was this script put here by the server for this response?" checkable by the browser. Report-only mode is what makes the change safe on a legacy app.\n\n**Say this out loud:** "CSP is my second line of defence: a nonce-based `script-src` with `strict-dynamic`, rolled out in report-only mode first, so even if an escaping bug slips through, the injected script does not run."',
  },
  {
    id: 'security-csrf-samesite-enough',
    domain: 'practices',
    subject: 'security',
    topic: 'csrf',
    level: 'senior',
    kind: 'single',
    prompt:
      'Your app authenticates with a session cookie set to `SameSite=Lax`. A colleague proposes deleting the anti-CSRF token middleware because "SameSite solved CSRF". What is the best response?',
    options: [
      { id: 'a', text: 'Agree: with `SameSite=Lax` no cross-site request ever carries the cookie' },
      { id: 'b', text: 'Agree only if you also switch to `SameSite=None`, which is stricter' },
      { id: 'c', text: 'Keep a second layer: `Lax` still sends the cookie on top-level cross-site `GET` navigations (dangerous if any `GET` changes state), and it treats sibling subdomains as same-site, so a compromised `blog.example.com` can still forge requests to `app.example.com`. Keep tokens or at least verify `Origin` on state-changing requests' },
      { id: 'd', text: 'Disagree, because CSRF tokens are what stop XSS, and removing them reopens XSS' },
    ],
    answer: 'c',
    tags: ['samesite', 'csrf-tokens', 'defence-in-depth'],
    source: 'notion',
    explanation:
      '`SameSite=Lax` (the default in modern Chromium when unset) blocks the classic hidden cross-site form `POST`, which removes most CSRF. The gaps: **same-site is not same-origin** (any subdomain under the same registrable domain, including one running an old CMS or user content, counts as same-site); `GET` requests on top-level navigation still carry the cookie, so any state-changing `GET` is exposed; and older clients may not enforce it. `SameSite=None` is the **least** strict value and requires `Secure`. CSRF tokens (synchronizer or double-submit) or an `Origin`/`Sec-Fetch-Site` check cost little and close those gaps. CSRF tokens do nothing against XSS: script running on your origin can read the token.\n\n**Say this out loud:** "SameSite is a strong default, not a complete defence: I keep GETs side-effect free and still verify a CSRF token or the Origin header on every state-changing request."',
  },
  {
    id: 'security-csrf-jwt-localstorage',
    domain: 'practices',
    subject: 'security',
    topic: 'csrf',
    level: 'senior',
    kind: 'open',
    prompt:
      'A new SPA stores a 24-hour JWT in `localStorage` and sends it as `Authorization: Bearer`. The team argues this is *better* because it is immune to CSRF. **Is it? What would you recommend instead?**',
    modelAnswer:
      'They are right about CSRF: the browser never attaches a `localStorage` value automatically, so a cross-site form cannot use it. But they have traded CSRF for a worse XSS outcome: any injected script, or any compromised npm dependency running in the page, can read the token and send it to an attacker, who can then use it from anywhere for the full 24 hours. JWTs are hard to revoke before expiry, so a stolen token is a long-lived credential. An `HttpOnly` cookie cannot be read by script, so XSS can still act inside the tab but cannot walk away with the session. I would move to an `HttpOnly; Secure; SameSite=Lax` session cookie (ideally via a backend-for-frontend that holds tokens server-side), or keep a short-lived access token in memory with a refresh token in an `HttpOnly` cookie and rotation. Cookie auth then needs CSRF protection back: SameSite plus a CSRF token or `Origin` check. And whatever the storage, XSS prevention (escaping, sanitizing, CSP) stays the real priority.',
    rubric: [
      'Acknowledges bearer tokens in `localStorage` are not sent automatically, so CSRF does not apply',
      'Explains XSS or a malicious dependency can read and exfiltrate the token for reuse elsewhere',
      'Mentions long lifetime and difficult revocation of JWTs amplifying the damage',
      'Recommends `HttpOnly` cookies (BFF, or in-memory access token + `HttpOnly` refresh with rotation)',
      'Notes cookie auth reintroduces CSRF, handled with SameSite plus tokens or Origin checks',
    ],
    tags: ['jwt', 'localstorage', 'httponly', 'bff'],
    source: 'notion',
    explanation:
      'This is a trade-off question. The weak answer is "localStorage is insecure"; the strong answer names both attacks, compares their blast radius, and picks cookie-based sessions with CSRF defences because XSS token theft is the worse failure.\n\n**Say this out loud:** "Tokens in localStorage swap CSRF for token theft on any XSS. I prefer an HttpOnly, Secure, SameSite cookie, ideally through a BFF, and then close CSRF with a token or Origin check."',
  },
];
