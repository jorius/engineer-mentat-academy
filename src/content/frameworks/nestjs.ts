// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'nestjs-module-exports-cross-module',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'modules',
    level: 'junior',
    kind: 'single',
    prompt:
      "```ts\n@Module({ providers: [UsersService] })\nexport class UsersModule {}\n\n@Module({ providers: [OrdersService], controllers: [OrdersController] })\nexport class OrdersModule {}\n\n@Injectable()\nexport class OrdersService {\n  constructor(private readonly users: UsersService) {}\n}\n```\nBootstrapping fails with *\"Nest can't resolve dependencies of the OrdersService (?). Please make sure that the argument UsersService at index [0] is available in the OrdersModule context.\"* What is the correct fix?",
    options: [
      { id: 'a', text: 'Add `exports: [UsersService]` to `UsersModule` and `imports: [UsersModule]` to `OrdersModule`' },
      { id: 'b', text: 'Add `UsersService` to the `providers` array of `OrdersModule` as well' },
      { id: 'c', text: "Decorate `UsersService` like this:\n\n```ts\n@Injectable({ providedIn: 'root' })\nexport class UsersService {}\n```" },
      { id: 'd', text: 'Add `UsersModule` to the `exports` array of `OrdersModule`' },
    ],
    answer: 'a',
    tags: ['dependency-injection', 'modules'],
    source: 'topic-list',
    explanation:
      "Providers are **encapsulated** in the module that declares them. Another module can inject a provider only if the owning module lists it in `exports` and the consumer lists that module in `imports`. Adding `UsersService` to the `providers` of `OrdersModule` compiles but creates a **second, independent instance** of `UsersService` (and forces `OrdersModule` to satisfy all of its dependencies), which breaks any in-memory state or caching. `providedIn: 'root'` is Angular, not Nest. `@Global()` modules exist but are meant for a few truly cross-cutting providers such as config or logging.",
    hint:
      'Recall how Nest scopes providers to the module that declares them, and which module metadata controls what one module shares with another.',
  },
  {
    id: 'nestjs-unhandled-error-default-response',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'pipes-and-guards',
    level: 'junior',
    kind: 'single',
    prompt:
      "```ts\n@Get(':id')\nfindOne(@Param('id') id: string) {\n  const user = this.users.get(id);\n  if (!user) throw new Error(`User ${id} not found`);\n  return user;\n}\n```\nNo custom exception filter is registered. What does the client receive for `GET /users/42` when the user does not exist?",
    options: [
      { id: 'a', text: '`404` with this body:\n\n```json\n{\n  "message": "User 42 not found"\n}\n```' },
      { id: 'b', text: '`500` with this body:\n\n```json\n{\n  "statusCode": 500,\n  "message": "Internal server error"\n}\n```' },
      { id: 'c', text: '`500` with the error message and stack trace, because `NODE_ENV` is not `production`' },
      { id: 'd', text: 'Nothing: the request hangs because the exception is not an `HttpException`' },
    ],
    answer: 'b',
    tags: ['exception-filters', 'http-exception'],
    source: 'topic-list',
    explanation:
      "Nest's built-in global exception filter turns any exception that is **not** an `HttpException` into a generic 500 and logs it, so internal details never leak. To control status and body, throw an `HttpException` subclass: `` throw new NotFoundException(`User ${id} not found`) `` produces `404` with `{ \"message\": \"User 42 not found\", \"error\": \"Not Found\", \"statusCode\": 404 }`. Custom `@Catch()` exception filters let you reshape errors globally (for example, mapping a domain `UserNotFoundError` or a Prisma `P2025` code to 404) without coupling services to HTTP.",
    hint:
      "Think about what Nest's built-in global exception filter does with an exception that is not an `HttpException`.",
  },
  {
    id: 'nestjs-request-lifecycle-order',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'pipes-and-guards',
    level: 'mid',
    kind: 'single',
    prompt: 'In what order does a NestJS HTTP request pass through the framework\'s enhancers?',
    options: [
      { id: 'a', text: 'Middleware → Guards → Interceptors (before) → Pipes → Route handler → Interceptors (after) → Exception filters (on error)' },
      { id: 'b', text: 'Middleware → Pipes → Guards → Interceptors (before) → Route handler → Interceptors (after) → Exception filters (on error)' },
      { id: 'c', text: 'Guards → Middleware → Interceptors (before) → Pipes → Route handler → Interceptors (after) → Exception filters (on error)' },
      { id: 'd', text: 'Middleware → Interceptors (before) → Guards → Pipes → Route handler → Interceptors (after) → Exception filters (on error)' },
    ],
    answer: 'a',
    tags: ['request-lifecycle', 'guards', 'interceptors', 'pipes'],
    source: 'topic-list',
    explanation:
      "Middleware runs first; it is plain Express/Fastify middleware and does not know which Nest handler will run. **Guards** decide whether the request may proceed at all, so they run before any interceptor or pipe work is done. **Interceptors** wrap the handler (code before `next.handle()` and RxJS operators after it). **Pipes** validate and transform the handler's arguments right before the call. Exceptions thrown by guards, interceptors, pipes or the handler go to **exception filters**, which are resolved from the most specific binding outward (route, then controller, then global). Within each enhancer type the order is global → controller → route. Consequence worth mentioning: a guard sees the **raw, unvalidated** request, because validation pipes run later.",
    hint:
      'Recall the job of each enhancer, and what has to be available before each one can do that job.',
  },
  {
    id: 'nestjs-validation-pipe-query-transform',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'pipes-and-guards',
    level: 'mid',
    kind: 'single',
    prompt:
      "```ts\n// main.ts\napp.useGlobalPipes(new ValidationPipe());\n\n// list-query.dto.ts\nexport class ListQueryDto {\n  @IsInt()\n  @Min(1)\n  page: number;\n}\n\n// controller\n@Get()\nlist(@Query() query: ListQueryDto) { ... }\n```\nWhat happens on `GET /products?page=2`, and what is the fix?",
    options: [
      { id: 'a', text: 'It succeeds and `query.page` is the number `2`, because the TypeScript type tells Nest to convert it' },
      { id: 'b', text: 'It fails with 400 (`page must be an integer number`): query values arrive as strings. Enable `transform: true`, plus either `enableImplicitConversion` in `transformOptions` or the `@Type` decorator (returning `Number`) on the property' },
      { id: 'c', text: 'It fails with 400; fix it by putting `ParseIntPipe` on the `page` property of the DTO' },
      { id: 'd', text: 'It succeeds, but `query.page` is the string `"2"` because validators ignore query parameters' },
    ],
    answer: 'b',
    tags: ['validation-pipe', 'class-validator', 'class-transformer', 'dto'],
    source: 'topic-list',
    explanation:
      "TypeScript types are erased at runtime; everything in a query string or path is a string. `ValidationPipe` builds a DTO instance with class-transformer and runs class-validator on it, so `@IsInt()` sees `\"2\"` and fails (`@Min(1)` fails too, so the 400 lists both messages). `transform: true` makes the pipe hand the **transformed instance** to the handler (and converts primitive params such as `@Query('page') page: number`), while `enableImplicitConversion` (which uses the reflected `design:type` metadata) or an explicit `@Type(() => Number)` converts the DTO property:\n\n```ts\nnew ValidationPipe({\n  transform: true,\n  transformOptions: { enableImplicitConversion: true },\n});\n// or keep transform: true and add\n@Type(() => Number)\npage: number;\n```\n\n`@Type` without `transform: true` only makes validation pass: the pipe still hands the handler the original plain object, so `query.page` is still the string `\"2\"`. `ParseIntPipe` is a parameter pipe (`@Query('page', ParseIntPipe)`), not a property decorator. In production also add `whitelist: true` (strip unknown properties) and often `forbidNonWhitelisted: true` to block mass-assignment.",
    hint:
      'Recall what information about a DTO property survives to runtime, and what `ValidationPipe` does with the raw query by default.',
  },
  {
    id: 'nestjs-guards-vs-middleware-roles',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'pipes-and-guards',
    level: 'mid',
    kind: 'single',
    prompt:
      "You want `@Roles('admin')` on individual controller methods to block non-admin users. Why is this implemented as a **guard** rather than as middleware?",
    options: [
      { id: 'a', text: 'Guards run before middleware, so unauthorised requests are rejected earlier' },
      { id: 'b', text: 'Guards receive an `ExecutionContext` that exposes the target handler and controller class, so they can read the `@Roles` metadata with `Reflector`; middleware runs before Nest knows which handler will execute' },
      { id: 'c', text: 'Middleware cannot read request headers such as `Authorization`' },
      { id: 'd', text: 'Guards can modify the response body after the handler runs, which authorization requires' },
    ],
    answer: 'b',
    tags: ['guards', 'reflector', 'authorization', 'metadata'],
    source: 'topic-list',
    explanation:
      "A guard's `canActivate(context)` can call `this.reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass()])` and compare the result with `request.user.roles`. Returning `false` yields `403 Forbidden`; throwing `UnauthorizedException` yields 401. Middleware is fine for authentication plumbing (parse the token, attach `req.user`), but it has no idea which route or decorators apply. The same `ExecutionContext` abstraction also lets one guard work for HTTP, WebSockets and microservices. Register a global guard with `{ provide: APP_GUARD, useClass: RolesGuard }` in a module rather than `app.useGlobalGuards(new RolesGuard())`, because the latter is created outside the DI container and cannot inject `Reflector` or other providers.",
    hint:
      'Recall where each mechanism sits in the request lifecycle and what Nest hands to each one when it runs.',
  },
  {
    id: 'nestjs-injection-scopes',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'modules',
    level: 'senior',
    kind: 'multi',
    prompt: 'Which statements about NestJS provider **injection scopes** are true? Select all that apply.',
    options: [
      { id: 'a', text: 'By default providers are singletons: one instance is created at bootstrap and shared by every consumer' },
      { id: 'b', text: 'If a service is `Scope.REQUEST`, every controller or provider that injects it (directly or transitively) also becomes request-scoped and is re-created per request' },
      { id: 'c', text: '`Scope.TRANSIENT` means one instance per incoming request, shared by all consumers during that request' },
      { id: 'd', text: 'Request scope has a real per-request allocation cost; for multi-tenant contexts, durable providers with a `ContextIdStrategy` let Nest reuse one sub-tree per tenant instead of per request' },
      { id: 'e', text: 'A WebSocket gateway can safely depend on request-scoped providers to keep per-message user state' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['dependency-injection', 'scopes', 'performance', 'multi-tenancy'],
    source: 'topic-list',
    explanation:
      "Scope **bubbles up** the injection chain: a controller that depends on a request-scoped service must itself be rebuilt per request, and so on upward. That is why one careless `@Injectable({ scope: Scope.REQUEST })` deep in the graph can quietly make a whole feature slower. `TRANSIENT` gives **each consumer** its own dedicated instance, and it does not bubble up: a singleton that injects a transient provider keeps one instance for its lifetime. Gateways, and anything that must behave as a singleton (cron jobs, Passport strategies), should not depend on request-scoped providers. Prefer passing context explicitly or using `AsyncLocalStorage` (for example `nestjs-cls`) for request-scoped data such as the tenant id or a correlation id.\n\n**Say this out loud:** \"Singletons are the default for a reason. Request scope bubbles up the whole dependency chain and costs an allocation per request, so for request context I reach for AsyncLocalStorage or durable providers first.\"",
    hint:
      'Recall the three injection scopes, what each one creates instances per, and how a scope affects the providers that depend on it.',
  },
  {
    id: 'nestjs-interceptor-tap-misses-errors',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'pipes-and-guards',
    level: 'senior',
    kind: 'single',
    prompt:
      "```ts\n@Injectable()\nexport class TimingInterceptor implements NestInterceptor {\n  constructor(private readonly metrics: Metrics) {}\n\n  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {\n    const start = Date.now();\n    return next.handle().pipe(\n      tap(() => this.metrics.observe(Date.now() - start)),\n    );\n  }\n}\n```\nRegistered globally, this interceptor records latency for successful requests, but nothing for requests that fail with a 500 from the handler or a 403 from a guard. Why?",
    options: [
      { id: 'a', text: 'Exception filters run before interceptors, so the observable completes empty on failure' },
      { id: 'b', text: "`tap`'s callback runs only on emitted values: a handler exception reaches the interceptor as an RxJS **error** notification and skips it (use `finalize`, or pass `tap` an observer with an `error` callback). A guard rejection happens **before** interceptors run, so the interceptor never sees those requests at all" },
      { id: 'c', text: 'Nest disables global interceptors for non-2xx responses to avoid double logging' },
      { id: 'd', text: '`next.handle()` is not subscribed on failures, because Nest only subscribes when the handler resolves' },
    ],
    answer: 'b',
    tags: ['interceptors', 'rxjs', 'observability', 'request-lifecycle'],
    source: 'topic-list',
    explanation:
      "An interceptor wraps the handler as an observable stream: success is a `next` then `complete`, failure is an `error` notification. `tap(fn)` only reacts to `next`; `finalize(() => ...)` runs on complete, error **and** unsubscribe, which makes it the right hook for timing. Interceptors can also transform errors with `catchError` (for example, mapping a timeout to `RequestTimeoutException`). Guards run earlier in the lifecycle, so any request they reject never reaches interceptors. Latency or access logging that must cover every request belongs in middleware (or at the HTTP server/proxy layer).\n\n**Say this out loud:** \"Interceptors see the handler as an Observable, so I measure with `finalize`, not `tap`. For metrics that must include guard rejections, I measure in middleware, because guards run before interceptors.\"",
    hint:
      'Trace both failing requests through the Nest request lifecycle and through the RxJS pipeline this interceptor builds.',
  },
  {
    id: 'nestjs-circular-module-design',
    domain: 'frameworks',
    subject: 'nestjs',
    topic: 'modules',
    level: 'senior',
    kind: 'open',
    prompt:
      "`OrdersModule` needs `PaymentsService` to charge a customer, and `PaymentsModule` needs `OrdersService` to mark an order paid when a webhook arrives. Nest reports a circular dependency. How do you resolve it, and how do you structure modules so it does not keep happening?",
    modelAnswer:
      "`forwardRef()` on both module imports (`forwardRef(() => PaymentsModule)` in `OrdersModule`, `forwardRef(() => OrdersModule)` in `PaymentsModule`), plus `@Inject(forwardRef(() => ...))` on the two services' constructor parameters, makes it boot, but it only hides a design smell and makes initialization order fragile, so I treat it as a last resort. The cycle says the two modules share a concept or one of them is reaching into the other's responsibilities. First option: invert one direction with events. Payments emits `PaymentSucceeded` (through `@nestjs/event-emitter`, CQRS or a message broker) and Orders subscribes, so Payments no longer depends on Orders. Second option: extract the shared piece (for example an `OrderStatus` port or a `BillingModule` that orchestrates both) so dependencies point one way. I keep modules aligned to bounded contexts and export only a narrow facade service, never repositories. Truly cross-cutting infrastructure (config, logging, database) lives in modules registered once with `forRoot`/`forRootAsync` and marked `@Global()` sparingly. An import-direction lint rule or a dependency graph check in CI (for example `madge` or `dependency-cruiser`) catches new cycles early.",
    rubric: [
      'Mentions `forwardRef` but explains why it is a workaround, not the fix',
      'Proposes breaking the cycle with domain events (event emitter, CQRS or a broker) so dependencies point one way',
      'Proposes extracting a shared or orchestrating module, or an interface/port owned by one side',
      'Talks about module boundaries: bounded contexts, exporting a narrow facade, sparing use of `@Global()`',
      'Suggests automated cycle detection (madge, dependency-cruiser, lint rules)',
    ],
    tags: ['circular-dependency', 'forward-ref', 'architecture', 'events'],
    source: 'topic-list',
    explanation:
      "Interviewers ask this to see whether you treat a framework error as a design signal. Juniors reach for `forwardRef`; seniors ask why the two modules know about each other and remove one direction of the dependency.\n\n**Say this out loud:** \"`forwardRef` makes it boot but keeps the coupling. I break the cycle by having Payments publish a `PaymentSucceeded` event that Orders handles, so the dependency only points one way.\"",
    hint:
      'Treat the cycle as a design signal: cover `forwardRef` as a stopgap, then how to remove one direction of the dependency, for example with events or a shared lower-level module.',
  },
];
