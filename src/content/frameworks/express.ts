// engine
import type { Question } from '../../engine/question';

const composeTypes = `type Ctx = { trace: string[] };
type Next = () => Promise<void>;
type Middleware = (ctx: Ctx, next: Next) => unknown;

`;

const composeScenarios = `
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const scenarios: Record<string, Middleware[]> = {
  onion: [
    async (ctx, next) => {
      ctx.trace.push('logger:in');
      await next();
      ctx.trace.push('logger:out');
    },
    async (ctx, next) => {
      ctx.trace.push('auth:in');
      await tick();
      await next();
      ctx.trace.push('auth:out');
    },
    async (ctx) => {
      await tick();
      ctx.trace.push('handler');
    },
  ],
  'short-circuit': [
    async (ctx, next) => {
      ctx.trace.push('logger:in');
      await next();
      ctx.trace.push('logger:out');
    },
    (ctx) => {
      ctx.trace.push('auth:deny');
    },
    (ctx) => {
      ctx.trace.push('handler');
    },
  ],
  'double-next': [
    async (ctx, next) => {
      ctx.trace.push('buggy:in');
      await next();
      await next();
    },
    (ctx) => {
      ctx.trace.push('handler');
    },
  ],
  error: [
    async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.trace.push(\`caught:\${(err as Error).message}\`);
      }
    },
    () => {
      throw new Error('boom');
    },
  ],
};

export async function solution(name: string): Promise<string[]> {
  const ctx: Ctx = { trace: [] };
  try {
    await compose(scenarios[name])(ctx);
  } catch (err) {
    ctx.trace.push(\`error:\${(err as Error).message}\`);
  }
  return ctx.trace;
}
`;

const buggyCompose = `function compose(middlewares: Middleware[]): (ctx: Ctx) => Promise<void> {
  return (ctx) => {
    const dispatch = (i: number): Promise<void> => {
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();
      return Promise.resolve(
        fn(ctx, async () => {
          dispatch(i + 1);
        }),
      ).then(() => undefined);
    };
    return dispatch(0);
  };
}
`;

const fixedCompose = `function compose(middlewares: Middleware[]): (ctx: Ctx) => Promise<void> {
  return (ctx) => {
    let lastIndex = -1;
    const dispatch = (i: number): Promise<void> => {
      if (i <= lastIndex) return Promise.reject(new Error('next() called multiple times'));
      lastIndex = i;
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1))).then(() => undefined);
      } catch (err) {
        return Promise.reject(err);
      }
    };
    return dispatch(0);
  };
}
`;

export const questions: Question[] = [
  {
    id: 'express-middleware-registration-order',
    domain: 'frameworks',
    subject: 'express',
    topic: 'middleware',
    level: 'junior',
    kind: 'single',
    prompt:
      "```js\nconst app = express();\n\napp.get('/health', (req, res) => res.send('ok'));\napp.use(requestLogger);\napp.use(express.json());\napp.post('/orders', (req, res) => res.status(201).json(req.body));\n```\nOps complains that health checks never show up in the request log. Why?",
    options: [
      { id: 'a', text: '`app.use` middleware is hoisted, so `requestLogger` runs first for every request; the logger must be filtering `/health` itself' },
      { id: 'b', text: 'Middleware and routes run in registration order; `/health` ends the response without calling `next()`, so `requestLogger` is never reached' },
      { id: 'c', text: '`app.use` only applies to non-GET requests unless you pass a path' },
      { id: 'd', text: '`express.json()` swallows GET requests that have no body' },
    ],
    answer: 'b',
    tags: ['middleware-order', 'next'],
    source: 'topic-list',
    explanation:
      'Express keeps one ordered stack of layers (middleware and routes). A request walks that stack top to bottom and only moves on when the current layer calls `next()`. The `/health` handler sends a response and never calls `next()`, so nothing registered after it runs. Cross-cutting middleware (logging, request ids, security headers, body parsing) goes **before** the routes; the 404 handler and the error handler go **after** them.',
    hint:
      'Recall how Express decides which layer of the stack runs next for a request.',
  },
  {
    id: 'express-error-handler-arity',
    domain: 'frameworks',
    subject: 'express',
    topic: 'error-handling',
    level: 'junior',
    kind: 'single',
    prompt:
      "```js\napp.get('/orders/:id', async (req, res) => {\n  throw new Error('db down');\n});\n\napp.use((err, req, res) => {\n  res.status(500).json({ error: err.message });\n});\n```\nOn **Express 5**, the custom error handler never runs; clients get Express's default HTML error page. What is wrong?",
    options: [
      { id: 'a', text: 'The error handler must be registered **before** the routes it protects' },
      { id: 'b', text: 'Error handlers must be registered with `app.error(...)`, not `app.use(...)`' },
      { id: 'c', text: 'Express recognises an error handler only by its arity: it must declare four parameters `(err, req, res, next)`' },
      { id: 'd', text: 'Async handlers cannot throw in Express; the error is silently lost' },
    ],
    answer: 'c',
    tags: ['error-middleware', 'express-5'],
    source: 'topic-list',
    explanation:
      "Express checks `fn.length === 4` to decide whether a layer is an error handler. With three parameters this function is treated as a normal middleware (so `err` would actually be `req`), and it is skipped while an error is being propagated. Declare `(err, req, res, next)` even if you never call `next`, and register it **after** all routes. In Express 5 the rejected promise from the async route is forwarded to `next(err)` automatically, so once the signature is fixed the handler does run. On Express 4 the rejected promise would never reach any error handler, so the arity fix alone would not be enough there.",
    hint:
      'Recall exactly how Express recognizes an error-handling middleware, and what Express 5 does with a rejected async handler.',
  },
  {
    id: 'express-async-errors-v4-vs-v5',
    domain: 'frameworks',
    subject: 'express',
    topic: 'error-handling',
    level: 'mid',
    kind: 'single',
    prompt:
      "```js\napp.get('/users/:id', async (req, res) => {\n  const user = await repo.findById(req.params.id); // rejects: connection refused\n  res.json(user);\n});\n\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: 'internal' });\n});\n```\nWhat happens when `repo.findById` rejects on **Express 4** versus **Express 5** (Node 20+)?",
    options: [
      { id: 'a', text: 'Both versions forward the rejection to the error handler; the client gets a 500 JSON body' },
      { id: 'b', text: "Express 4 never sees the rejection: it becomes an unhandled rejection that crashes the process by default on Node 15+ (the client's connection drops; if an `unhandledRejection` listener keeps the process alive, the request hangs instead); Express 5 forwards the rejected promise to `next(err)`, so the error handler answers 500" },
      { id: 'c', text: 'Express 4 forwards it to the error handler; Express 5 removed automatic error forwarding in favour of `try/catch`' },
      { id: 'd', text: 'Both versions return a 500 from the default handler because the custom handler is declared after the route' },
    ],
    answer: 'b',
    tags: ['async', 'express-5', 'unhandled-rejection'],
    source: 'topic-list',
    explanation:
      "Express 4's router calls the handler and ignores its return value, so a rejected promise escapes it entirely. With Node's default `--unhandled-rejections=throw` the process then exits and every in-flight connection is dropped; only when something registers an `unhandledRejection` listener does the process survive, and then this request hangs with no response. The usual Express 4 fixes were wrapping every handler in `try/catch` + `next(err)`, an `asyncHandler(fn)` wrapper that does `.catch(next)`, or the `express-async-errors` patch. Express 5 checks whether a handler returns a promise and calls `next(err)` when it rejects, for middleware and route handlers alike. It still does **not** catch errors thrown later inside callbacks such as `setTimeout` or an event emitter, because those are not part of the returned promise.",
    hint:
      'Ask what each router version does with the promise an async handler returns, and what Node does with a rejection nobody handles.',
  },
  {
    id: 'express-next-semantics',
    domain: 'frameworks',
    subject: 'express',
    topic: 'middleware',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which statements about `next` in Express are true? Select all that apply.',
    options: [
      { id: 'a', text: '`next()` hands control to the next matching layer in registration order' },
      { id: 'b', text: '`next(err)` with an `Error` skips every remaining non-error middleware and route and jumps to the error-handling middleware' },
      { id: 'c', text: "`next('route')` skips the remaining callbacks of the current route; it only works inside `app.METHOD` / `router.METHOD` handlers, not in `app.use` middleware" },
      { id: 'd', text: 'Calling `next()` after `res.json()` is harmless because Express stops the chain once a response has been sent' },
      { id: 'e', text: 'Calling `next()` ends the current function, so code written after it never runs' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['next', 'routing'],
    source: 'topic-list',
    explanation:
      "Express does not track whether you already responded: if you `res.json()` and then `next()`, a later layer may try to write again and you get `ERR_HTTP_HEADERS_SENT` (\"Cannot set headers after they are sent to the client\"). `next()` is an ordinary function call, so the rest of your function keeps running after it returns; write `return next()` when you mean \"stop here\". `next('router')` is the sibling of `next('route')`: it leaves the current `Router` instance entirely.",
    hint:
      "Recall what each form of the `next` call does, and what actually ends a middleware function's execution.",
  },
  {
    id: 'express-route-order-param-shadowing',
    domain: 'frameworks',
    subject: 'express',
    topic: 'routing',
    level: 'mid',
    kind: 'single',
    prompt:
      "```js\nconst router = express.Router();\nrouter.get('/users/:id', getUserById);\nrouter.get('/users/me', getCurrentUser);\napp.use('/api', router);\n```\nWhat happens on `GET /api/users/me`?",
    options: [
      { id: 'a', text: '`getCurrentUser` runs because static segments always win over parameters' },
      { id: 'b', text: '`getUserById` runs with `req.params.id === "me"`, because the first matching route in registration order wins' },
      { id: 'c', text: 'Express throws at startup because the two paths are ambiguous' },
      { id: 'd', text: 'Both handlers run, `getUserById` first and then `getCurrentUser`' },
    ],
    answer: 'b',
    tags: ['route-order', 'path-params', 'express-5'],
    source: 'topic-list',
    explanation:
      "Express has no route specificity ranking (unlike Fastify's radix-tree router or Next.js file routing, where static segments win): it tests layers in order and runs the first match. `getUserById` then responds (probably 404 or a DB cast error) and `getCurrentUser` is unreachable. Fixes: register `/users/me` first, or validate `id` inside the handler. Express 5 uses path-to-regexp v8, which **removed** inline regex constraints such as `/:id(\\\\d+)`, removed `?` optional params in favour of braces (`/users{/:id}`), and requires wildcards to be named (`/*splat`), so ordering and explicit validation matter even more after an upgrade.",
    hint:
      'Recall how Express matches a request path against the routes registered on a router.',
  },
  {
    id: 'express-error-handler-headers-sent',
    domain: 'frameworks',
    subject: 'express',
    topic: 'error-handling',
    level: 'senior',
    kind: 'single',
    prompt:
      "```js\napp.get('/export.csv', async (req, res) => {\n  res.setHeader('Content-Type', 'text/csv');\n  for await (const row of db.streamRows()) {\n    res.write(toCsv(row)); // the DB connection drops half-way\n  }\n  res.end();\n});\n\napp.use((err, req, res, next) => {\n  logger.error(err);\n  res.status(500).json({ error: 'internal' });\n});\n```\nOn **Express 5**, what should the error handler do for this failure?",
    options: [
      { id: 'a', text: 'Nothing changes; `res.status(500)` will replace the partial CSV with a JSON body' },
      { id: 'b', text: 'Call `res.end()` so the client receives a truncated but "successful" 200 download' },
      { id: 'c', text: 'Check `res.headersSent` first and, if true, delegate with `return next(err)` so Express\'s default handler destroys the connection; only send the JSON 500 when headers are not yet sent' },
      { id: 'd', text: 'Retry the stream from the beginning inside the error handler' },
    ],
    answer: 'c',
    tags: ['streaming', 'headers-sent', 'error-middleware'],
    source: 'topic-list',
    explanation:
      "Once the status line and headers are on the wire you cannot change the status code. Trying produces `ERR_HTTP_HEADERS_SENT` inside your error handler. Express's docs prescribe exactly this guard: if `res.headersSent`, call `next(err)` and let the built-in handler close the socket. The client then sees an aborted transfer instead of a truncated file that looks complete. Ending the response cleanly with `res.end()` is the worst choice because it turns a failure into silent data loss. (This relies on Express 5 forwarding the rejected async handler to the error middleware; on Express 4 the handler would need an async wrapper to be reached at all.)\n\n**Say this out loud:** \"An error handler has to check `res.headersSent`; after streaming has started the only honest signal left is aborting the connection, so I delegate to Express's default handler.\"",
    hint:
      'Consider what the client has already received when the stream fails, and what can still change about the response at that point.',
  },
  {
    id: 'express-compose-middleware-fix',
    domain: 'frameworks',
    subject: 'express',
    topic: 'middleware',
    level: 'senior',
    kind: 'fix',
    language: 'typescript',
    prompt:
      "This is a Koa-style `compose` (the model behind promise-aware middleware stacks). Each middleware gets `(ctx, next)` and `next()` returns a promise for **the whole rest of the chain**. It has two bugs:\n\n1. `await next()` does not wait for downstream async middleware, so the \"after\" half of the onion runs too early.\n2. Calling `next()` twice from the same middleware silently runs the downstream chain again; it must reject with `Error('next() called multiple times')`.\n\nFix **only `compose`**. The scenarios and `solution` below it are the test harness. Downstream errors (sync or async) must stay catchable by an upstream middleware that wraps its call like this:\n\n```ts\ntry {\n  await next();\n} catch {}\n```",
    starter: `${composeTypes}${buggyCompose}${composeScenarios}`,
    tests: [
      { name: 'onion order with async middleware', args: ['onion'], expected: ['logger:in', 'auth:in', 'handler', 'auth:out', 'logger:out'] },
      { name: 'short-circuit when a middleware does not call next', args: ['short-circuit'], expected: ['logger:in', 'auth:deny', 'logger:out'] },
      { name: 'next called twice rejects', args: ['double-next'], expected: ['buggy:in', 'handler', 'error:next() called multiple times'] },
      { name: 'downstream error is catchable upstream', args: ['error'], expected: ['caught:boom'] },
    ],
    solution: `${composeTypes}${fixedCompose}${composeScenarios}`,
    tags: ['compose', 'onion-model', 'async', 'next'],
    source: 'topic-list',
    explanation:
      "The `next` passed to each middleware must **return** `dispatch(i + 1)`. Otherwise the caller awaits a promise that settles as soon as the synchronous part of `dispatch` returns, while the downstream async work is still pending. Returning the promise is also what makes a downstream rejection travel back up to the caller's `try/catch`; a dropped promise becomes an unhandled rejection instead. The `lastIndex` guard detects re-entry: `next()` from middleware `i` must advance the index past `i` exactly once. The `try/catch` around `fn(...)` turns a synchronous throw into a rejected promise, so callers see one error channel.\n\nExpress's own `next` is callback-style and returns nothing, even in Express 5, so `await next()` in Express does not wait for downstream handlers and there is no onion-style post-processing. Async errors are a separate mechanism: Express 4 ignored the promise a handler returned, and Express 5's router attaches a rejection handler to that promise and calls `next(err)`.\n\n**Say this out loud:** \"Middleware composition is an onion: `next()` has to return a promise for the entire downstream chain, otherwise post-processing runs too early and downstream errors escape as unhandled rejections.\"",
    hint:
      'Check what `next` returns to the middleware that awaits it, and what `compose` would need to remember to notice a second call.',
  },
  {
    id: 'express-production-hardening',
    domain: 'frameworks',
    subject: 'express',
    topic: 'middleware',
    level: 'senior',
    kind: 'open',
    prompt:
      'An Express 5 API is going to production behind a load balancer on Kubernetes. Walk through what you add or configure to harden it: security headers, abuse protection, request limits, error exposure and shutdown behaviour.',
    modelAnswer:
      "Security headers come from `helmet()` registered first, plus a strict CORS allow-list rather than `origin: '*'` with credentials. Because the app sits behind a proxy I set `app.set('trust proxy', 1)` (the exact hop count) so `req.ip` and `req.secure` are correct. Without it, IP-based rate limiting sees only the load balancer. I add rate limiting (`express-rate-limit` backed by Redis so limits hold across replicas), stricter on login and password-reset routes, and cap bodies with `express.json({ limit: '100kb' })`. Validation happens at the edge with a schema library (zod or Joi), and a final error handler returns a generic message without stack traces while logging the full error with a request id. `NODE_ENV=production`, `x-powered-by` disabled, and server timeouts (`headersTimeout`, `requestTimeout`, `keepAliveTimeout` longer than the LB idle timeout) round it out. For graceful shutdown I handle `SIGTERM`: flip readiness to failing so the LB stops routing, call `server.close()` to stop accepting connections and drain in-flight requests, close DB pools and queues, and force-exit after a deadline shorter than `terminationGracePeriodSeconds`. Uncaught exceptions are logged and the process exits so the orchestrator restarts it rather than running in an unknown state.",
    rubric: [
      'Names helmet (security headers) and a restrictive CORS policy',
      "Adds rate limiting with a shared store and explains `trust proxy` so client IPs are correct behind the LB",
      'Limits body size, validates input, and hides stack traces in error responses while logging them with a correlation id',
      'Describes graceful shutdown: SIGTERM, fail readiness, `server.close()` to drain, close resources, forced exit after a timeout',
      'Mentions keep-alive/timeouts tuned relative to the load balancer, or crash-and-restart on uncaught exceptions',
    ],
    tags: ['helmet', 'rate-limiting', 'graceful-shutdown', 'security', 'production'],
    source: 'topic-list',
    explanation:
      "Interviewers are listening for layered defence and operational awareness, not a list of npm packages. The two details that separate seniors are `trust proxy` (rate limiting and secure cookies silently break without it) and a shutdown sequence that coordinates with the orchestrator (readiness first, then drain, then force-exit before SIGKILL).\n\n**Say this out loud:** \"On SIGTERM I fail readiness, stop accepting connections with `server.close()`, drain in-flight requests, close pools, and exit before the grace period ends. Behind a proxy I set `trust proxy` so rate limiting keys on the real client IP.\"",
    hint:
      'Cover it in layers: security headers, proxy awareness for rate limits and cookies, body and timeout limits, error output in production, and a SIGTERM sequence that cooperates with readiness probes.',
  },
];
