// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'nextjs-server-component-uses-state',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'app-router',
    level: 'junior',
    kind: 'single',
    prompt:
      "```tsx\n// app/products/[id]/like-button.tsx\nimport { useState } from 'react';\n\nexport function LikeButton() {\n  const [liked, setLiked] = useState(false);\n  return <button onClick={() => setLiked(!liked)}>{liked ? 'Liked' : 'Like'}</button>;\n}\n```\n`app/products/[id]/page.tsx` renders `<LikeButton />` and the build fails, saying `useState` only works in a Client Component. What is the right fix?",
    options: [
      { id: 'a', text: "Add `'use client'` at the top of `app/layout.tsx` so the whole app runs on the client" },
      { id: 'b', text: "Add `'use client'` at the top of `like-button.tsx`, keeping the page itself a Server Component" },
      { id: 'c', text: 'Move the file into a `components/client/` folder; Next.js infers client components from the path' },
      { id: 'd', text: "Replace `useState` with `useRef`, which is allowed in Server Components" },
    ],
    answer: 'b',
    tags: ['server-components', 'use-client'],
    source: 'topic-list',
    explanation:
      "In the App Router every component is a **Server Component** by default: it runs only on the server and ships no JavaScript, so it cannot use state, effects, event handlers or browser APIs. `'use client'` marks a **boundary**: that module and everything it imports become part of the client bundle. Put the boundary as low (as close to the leaves) as possible. Marking `app/layout.tsx` would not even fix this build: the router passes each page to its layout as `children`, so `page.tsx` stays a Server Component and its import of `LikeButton` still fails; it would only turn the layout itself (and everything it imports) into client code and forbid exporting `metadata` from it. Stateful and effect hooks (`useState`, `useReducer`, `useEffect`, `useRef`, `useContext`) are unavailable in Server Components; only a few stateless ones such as `use`, `useId` and `useMemo` are allowed.",
  },
  {
    id: 'nextjs-route-handler-basics',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'app-router',
    level: 'junior',
    kind: 'single',
    prompt: 'In the App Router, how do you expose `GET /api/users` returning JSON?',
    options: [
      { id: 'a', text: 'Create `app/api/users/route.ts` exporting a default handler:\n\n```ts\nexport default function handler(req, res) {\n  res.json(users);\n}\n```' },
      { id: 'b', text: 'Create `app/api/users/route.ts` exporting a named `GET` function that returns a `Response` (for example `Response.json(users)`)' },
      { id: 'c', text: 'Create `app/api/users/page.tsx` that returns the JSON object instead of JSX' },
      { id: 'd', text: 'Create `app/api/users.ts` with a default export; files under `app/api` are API routes automatically' },
    ],
    answer: 'b',
    tags: ['route-handlers', 'web-api'],
    source: 'topic-list',
    explanation:
      "Route Handlers live in a `route.ts` file inside the `app` directory and export one function per HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`). They use the Web `Request`/`Response` APIs (and the `NextRequest`/`NextResponse` helpers), not Node's `req`/`res`. The `handler(req, res)` default export is the **Pages Router** API route in `pages/api`. A segment cannot contain both `route.ts` and `page.tsx`. In Next.js 15 `GET` handlers are **not** cached by default; opt in with `export const dynamic = 'force-static'`. The `api/` folder name is a convention, not a requirement.",
  },
  {
    id: 'nextjs-client-boundary-rules',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'rendering-modes',
    level: 'mid',
    kind: 'multi',
    prompt: "Which statements about the `'use client'` boundary in the App Router are true? Select all that apply.",
    options: [
      { id: 'a', text: "`'use client'` marks a module boundary: that file and every module it imports are included in the browser bundle" },
      { id: 'b', text: 'Client Components render only in the browser; they are never rendered to HTML on the server' },
      { id: 'c', text: 'A Server Component can be passed to a Client Component as `children` (or another prop) and it stays a Server Component' },
      { id: 'd', text: 'You can pass any prop to a Client Component, including a callback function defined in the parent Server Component' },
      { id: 'e', text: "Every component file rendered inside a Client Component needs its own `'use client'` directive" },
    ],
    answer: ['a', 'c'],
    tags: ['server-components', 'use-client', 'serialization', 'hydration'],
    source: 'topic-list',
    explanation:
      "Client Components are still **prerendered to HTML on the server** and then hydrated, so `'use client'` means \"this also ships to and runs in the browser\", not \"browser only\". Anything a client module imports is already client code, so nested files do not need the directive. Props that cross the server-to-client boundary must be **serializable** by React: plain data, Dates, Maps, promises and JSX are fine, but ordinary functions are not. The exception is a **Server Action** (`'use server'`), which crosses as a reference. The composition pattern (`<ClientShell><ServerList /></ClientShell>`) is how you keep interactive wrappers without dragging data-heavy children into the bundle. Use the `server-only` package to make an accidental client import of server code fail the build.",
  },
  {
    id: 'nextjs-dynamic-api-opts-out-of-static',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'rendering-modes',
    level: 'mid',
    kind: 'single',
    prompt:
      "```tsx\n// app/products/page.tsx (Next.js 15)\nimport { cookies } from 'next/headers';\n\nexport default async function ProductsPage() {\n  const currency = (await cookies()).get('currency')?.value ?? 'USD';\n  const products = await getProducts(); // same for every user\n  return <ProductGrid products={products} currency={currency} />;\n}\n```\nThis page used to be statically prerendered at build time. After adding the `cookies()` read, `next build` reports it as **dynamic**. Why?",
    options: [
      { id: 'a', text: '`cookies()` is only available in Client Components, so Next.js falls back to rendering on the client' },
      { id: 'b', text: 'Every `async` Server Component is rendered dynamically' },
      { id: 'c', text: '`cookies()` is a request-time (Dynamic) API; its value cannot be known at build time, so the whole route opts into per-request server rendering' },
      { id: 'd', text: 'The page is missing `generateStaticParams`, which static rendering requires' },
    ],
    answer: 'c',
    tags: ['dynamic-apis', 'static-rendering', 'next-15'],
    source: 'topic-list',
    explanation:
      "`cookies()`, `headers()`, `draftMode()`, `connection()` and the `searchParams` page prop depend on the incoming request. Using any of them (or `fetch` with `cache: 'no-store'`, or `export const dynamic = 'force-dynamic'`) makes the route render on every request. In Next.js 15 these APIs are **async** (`await cookies()`; `params` and `searchParams` are promises), and synchronous access only works through a temporary compatibility shim that logs a warning. To keep the page static, convert the currency on the client. With Partial Prerendering (experimental in Next.js 15) you can instead read the cookie inside a small component wrapped in `<Suspense>`, which becomes a dynamic hole in a static shell; without PPR, `<Suspense>` only streams and the whole route is still rendered per request. `async` components alone are fine to prerender, and `generateStaticParams` is only needed for dynamic segments such as `[id]`.",
  },
  {
    id: 'nextjs-isr-stale-while-revalidate',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'rendering-modes',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      "Model **ISR** (`export const revalidate = N`) as a pure function. Version `1` of a page is built at time `0`. For each request time (seconds, ascending) return the version number that request is served.\n\nRules (these match Next.js's stale-while-revalidate behaviour):\n- A request is **never blocked**: it always gets the currently cached version.\n- If the cached version is **strictly older** than `revalidate` seconds and no regeneration is running, the request triggers **one** background regeneration that finishes `regenSeconds` later.\n- While a regeneration is running, further requests get the old version and do not start another one.\n- A regeneration that has finished by the time of a request (`finishedAt <= t`) replaces the cache with the next version, whose age is measured from `finishedAt`.",
    starter: `export function solution(revalidate: number, regenSeconds: number, requestTimes: number[]): number[] {
  return [];
}`,
    tests: [
      { name: 'fresh page within the window', args: [60, 0, [0, 30, 60]], expected: [1, 1, 1] },
      { name: 'the request that finds a stale page still gets the old one', args: [60, 0, [61, 62]], expected: [1, 2] },
      { name: 'one regeneration for concurrent stale requests', args: [60, 5, [70, 72, 75, 76, 140, 146]], expected: [1, 1, 2, 2, 2, 3] },
      { name: 'no traffic means no regeneration', args: [10, 0, [1000, 1001, 1005, 1012]], expected: [1, 2, 2, 2] },
      { name: 'no requests', args: [60, 0, []], expected: [] },
    ],
    solution: `export function solution(revalidate: number, regenSeconds: number, requestTimes: number[]): number[] {
  let version = 1;
  let generatedAt = 0;
  let regenDoneAt: number | null = null;
  const served: number[] = [];

  for (const t of requestTimes) {
    if (regenDoneAt !== null && regenDoneAt <= t) {
      version += 1;
      generatedAt = regenDoneAt;
      regenDoneAt = null;
    }
    served.push(version);
    if (regenDoneAt === null && t - generatedAt > revalidate) {
      regenDoneAt = t + regenSeconds;
    }
  }
  return served;
}`,
    tags: ['isr', 'stale-while-revalidate', 'caching'],
    source: 'topic-list',
    explanation:
      "ISR is **stale-while-revalidate**, not a cron job. `revalidate = 60` does not rebuild the page every minute. It means the first request that arrives **after** the page is older than 60 s still gets the stale page, and triggers one background regeneration. Only later requests see the new version. With no traffic, nothing regenerates (the 1000-second test). If regeneration throws, Next.js keeps serving the last good version. Compare the modes: **SSG** builds once at `next build`; **ISR** is SSG plus background refresh (time-based via `revalidate`, or on demand via `revalidatePath`/`revalidateTag`); **SSR** (dynamic rendering) renders on every request; **CSR** fetches in the browser after hydration.",
  },
  {
    id: 'nextjs-caching-defaults-15',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'rendering-modes',
    level: 'senior',
    kind: 'multi',
    prompt: 'Which statements about caching and revalidation in the **Next.js 15** App Router are true? Select all that apply.',
    options: [
      { id: 'a', text: "`fetch` results are no longer stored in the Data Cache by default; opt in per request:\n\n```ts\nfetch(url, { cache: 'force-cache' });\n// or\nfetch(url, { next: { revalidate: N } });\n```" },
      { id: 'b', text: 'A route that uses no Dynamic APIs is still prerendered at build time, so a `fetch` with no cache option in it runs once during `next build` and its result is frozen in the static output until revalidation or redeploy' },
      { id: 'c', text: "Calling `revalidateTag('products')` from a Server Action or Route Handler invalidates every cached `fetch` tagged `products`, on every route that used it. The tag is set per request:\n\n```ts\nfetch(url, { next: { tags: ['products'] } });\n```" },
      { id: 'd', text: 'You can call `revalidatePath` directly from a Client Component event handler to refresh server data' },
      { id: 'e', text: '`export const revalidate = 60` renders the page on every request and adds a 60-second CDN `Cache-Control` header' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['caching', 'revalidation', 'next-15', 'data-cache', 'full-route-cache'],
    source: 'topic-list',
    explanation:
      "Next.js 14 cached `fetch` by default, which surprised many teams. Next.js 15 flipped the defaults: no Data Cache for `fetch` and no caching for `GET` Route Handlers, and the client Router Cache no longer reuses page segments (`staleTime` 0 for pages). The trap is the build-time prerendering statement: \"not cached\" does **not** mean \"fresh on every request\". A route without request-time APIs is still statically prerendered, so the data is baked in at build time. Add a Dynamic API, `cache: 'no-store'`, `connection()` or `dynamic = 'force-dynamic'` when you truly need per-request data. `revalidatePath`/`revalidateTag` are server-only; the client calls a Server Action that calls them (and `router.refresh()` only re-fetches the current route's RSC payload). `revalidate = 60` is ISR (stale-while-revalidate), not per-request rendering. Next.js 16's Cache Components (`'use cache'`, `cacheLife`, `cacheTag`) make caching explicitly opt-in again, so in an interview, name the version you are describing.\n\n**Say this out loud:** \"In Next 15, a fetch with no cache option is not cached, but that does not make the route dynamic. If a route has no request-time APIs it is still prerendered at build time, so I decide static versus dynamic per route and invalidate with tags from Server Actions.\"",
  },
  {
    id: 'nextjs-server-action-authorization',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'app-router',
    level: 'senior',
    kind: 'single',
    prompt:
      "```tsx\n// app/posts/actions.ts\n'use server';\nexport async function deletePost(id: string) {\n  await db.post.delete({ where: { id } });\n  revalidatePath('/posts');\n}\n\n// app/posts/page.tsx (Server Component)\nconst session = await auth();\nreturn posts.map((p) => (\n  <article key={p.id}>\n    {p.title}\n    {session?.user.role === 'admin' && <DeleteButton action={deletePost} id={p.id} />}\n  </article>\n));\n```\nA security review flags `deletePost` as critical. Why?",
    options: [
      { id: 'a', text: 'It is safe: a Server Action can only be invoked by users whose rendered page contained it' },
      { id: 'b', text: 'A Server Action is a public POST endpoint: anyone who obtains its action id can call it with arbitrary arguments. Hiding the button is not authorization, so the action itself must check the session, the role or ownership, and validate `id`' },
      { id: 'c', text: 'Server Actions have no CSRF protection, so the only fix is to move the logic into a Route Handler' },
      { id: 'd', text: 'Server Actions cannot read cookies, so `auth()` would always be `null` inside the action' },
    ],
    answer: 'b',
    tags: ['server-actions', 'authorization', 'security'],
    source: 'topic-list',
    explanation:
      "Every exported `'use server'` function becomes a network-reachable endpoint. The page only decides whether to **render a button**; nothing stops a non-admin (or a script) from sending the POST that invokes the action. Treat each Server Action like a public API route: authenticate (`await auth()`), authorize (role or ownership of that specific post), validate input with a schema (for example zod), and rate-limit where it matters. Next.js does mitigate CSRF (actions are POST-only and the `Origin` header is compared with `Host`), and in Next.js 15 the action ids are unguessable and unused actions are removed from the build. Those are defence in depth, **not** access control. Middleware is not a sufficient check either; do authorization close to the data (a data access layer).\n\n**Say this out loud:** \"A Server Action is a public POST endpoint with a nicer calling convention, so authentication, authorization and input validation go inside the action, not in the component that renders the button.\"",
  },
  {
    id: 'nextjs-when-not-to-use',
    domain: 'frameworks',
    subject: 'nextjs',
    topic: 'app-router',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your team defaults to Next.js for every new front end. Give concrete cases where you would **not** choose Next.js, what you would pick instead, and the trade-offs you weigh.',
    modelAnswer:
      "Next.js pays off when you need server rendering for SEO or first-load performance, content that mixes static and dynamic data, and one deployable that holds both UI and a thin BFF. I would not use it for an authenticated internal dashboard or back-office SPA with no SEO needs. There a Vite + React Router (or TanStack Router) SPA served from S3/CloudFront is simpler, cheaper, and has no server to run or caching model to learn. For a mostly static content or docs site, Astro or a static generator ships less JavaScript with less machinery. I would not put a real backend inside Next: long-running jobs, WebSockets, heavy CPU work, queue consumers and multi-client public APIs belong in a dedicated service (NestJS, Express or Fastify on ECS or Lambda), with Next at most a BFF. I also weigh operations. Features such as ISR, image optimisation and middleware are smoothest on Vercel, while self-hosting or AWS needs `output: 'standalone'`, a shared cache handler across replicas, or adapters such as OpenNext. The App Router's caching semantics have changed between 13, 14, 15 and 16, so team familiarity and upgrade cost count. The decision comes down to rendering needs, where the backend logic lives, hosting constraints and team skills, not \"React means Next\".",
    rubric: [
      'Names a no-SEO authenticated SPA/dashboard as a case for a plain Vite SPA',
      'Separates backend concerns (long-running jobs, WebSockets, public multi-client APIs) into a dedicated service',
      'Mentions static/content sites where Astro or a static generator is lighter',
      'Discusses hosting and operational cost: Vercel-optimised features, self-hosting caches across replicas, OpenNext/standalone',
      'Frames the decision around rendering requirements and team familiarity with the caching model',
    ],
    tags: ['architecture', 'trade-offs', 'spa', 'bff', 'hosting'],
    source: 'topic-list',
    explanation:
      "The interviewer wants to hear that you choose a framework from requirements, not habit. The strongest answers tie each \"no\" to a specific cost: a server you did not need, a caching model the team must learn, business logic trapped in the UI deploy, or features that behave differently off Vercel.\n\n**Say this out loud:** \"Next.js earns its complexity when I need server rendering or SEO. For an authenticated dashboard I would ship a Vite SPA, and real backend work goes in a separate service, with Next at most as a BFF.\"",
  },
];
