// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'dotnet-service-lifetime-basics',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'hosting-and-di',
    level: 'junior',
    kind: 'single',
    prompt:
      'A host built with `Host.CreateApplicationBuilder` registers services with `AddSingleton`, `AddScoped` and `AddTransient`. Which statement correctly describes these three lifetimes?',
    options: [
      { id: 'a', text: 'Singleton: one instance for the whole application lifetime; Scoped: one instance per scope (per HTTP request in ASP.NET Core, or per explicitly created `IServiceScope` elsewhere); Transient: a brand-new instance every time it is resolved' },
      { id: 'b', text: 'Singleton: one instance per request; Scoped: one instance for the whole application lifetime; Transient: one instance per scope' },
      { id: 'c', text: 'Transient: one instance for the whole application lifetime; Scoped: created once and cached forever after the first resolution; Singleton: a new instance on every injection' },
      { id: 'd', text: 'The three lifetimes behave identically outside of ASP.NET Core; the distinction only matters when a web server is handling requests' },
    ],
    answer: 'a',
    tags: ['dependency-injection', 'service-lifetimes', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'A singleton is created once (the first time it is requested, unless registered as an existing instance) and that same instance is handed to every consumer for the life of the app. A scoped service gets one instance per scope: ASP.NET Core creates a scope automatically for each incoming HTTP request, and any other host (console app, worker, background job) has to create scopes explicitly to get the same behavior. A transient service is constructed fresh every single time it is resolved, even more than once within the same object graph. The two options that shuffle the singleton, scoped and transient definitions simply swap them around. The option claiming the lifetimes behave identically outside ASP.NET Core is wrong because the scope boundary exists in any host that creates `IServiceScope`s, not only in web requests — a `BackgroundService` that processes queue messages, for example, typically creates one scope per message.',
    hint:
      'Think about what a scope is in ASP.NET Core versus a console or worker host, and how often each registration hands out a new instance.',
  },
  {
    id: 'dotnet-dbset-basics',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'entity-framework',
    level: 'junior',
    kind: 'single',
    prompt:
      "```csharp\npublic class AppDbContext : DbContext\n{\n    public DbSet<Product> Products { get; set; }\n}\n```\nWhat does the `DbSet<Product> Products` property represent?",
    options: [
      { id: 'a', text: 'A queryable, trackable collection that represents the `Products` table (or view) mapped to `Product`; it is used both to build LINQ queries translated to SQL and to add, remove or update tracked `Product` instances' },
      { id: 'b', text: 'A cached, in-memory list of every `Product` row, loaded eagerly the moment `AppDbContext` is constructed' },
      { id: 'c', text: 'A static, thread-safe singleton shared by every `AppDbContext` instance in the process' },
      { id: 'd', text: 'A read-only view: entities changed through the `DbSet` are never persisted, and `SaveChanges` only persists SQL written by hand' },
    ],
    answer: 'a',
    tags: ['dbcontext', 'dbset', 'ef-core', 'fundamentals'],
    source: 'topic-list',
    explanation:
      "`DbSet<T>` implements `IQueryable<T>`, so LINQ written against it is translated to SQL and executed only when the query is enumerated — nothing is loaded eagerly at construction time, which rules out the \"cached, in-memory list\" option. It belongs to one `DbContext` instance; it is not a shared static or thread-safe object — `DbContext` itself is not safe to use from multiple threads at once — which rules out the \"static, thread-safe singleton\" option. Entities added, modified or removed through the `DbSet` (or loaded and mutated while tracked) are exactly what `SaveChanges`/`SaveChangesAsync` persists as `INSERT`/`UPDATE`/`DELETE` statements, so the \"read-only view\" option is backwards.",
    hint:
      'Remember that `DbSet<T>` implements `IQueryable<T>`: think about when its queries actually run and what it lets you do with tracked entities.',
  },
  {
    id: 'dotnet-configuration-provider-precedence',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'configuration',
    level: 'mid',
    kind: 'single',
    prompt:
      'A host is built with the default `Host.CreateApplicationBuilder(args)` configuration pipeline. The key `ConnectionStrings:Default` is set in `appsettings.json`, again in `appsettings.Development.json`, as the environment variable `ConnectionStrings__Default`, and as the command-line argument `--ConnectionStrings:Default=...`. What does `configuration["ConnectionStrings:Default"]` return?',
    options: [
      { id: 'a', text: 'The command-line value, because command-line arguments are the last provider added, and for a given key a later provider overrides an earlier one' },
      { id: 'b', text: 'The environment variable value, because environment variables always take precedence over every other configuration source for security reasons' },
      { id: 'c', text: 'The `appsettings.json` value, because file-based configuration is loaded first and is treated as the authoritative source' },
      { id: 'd', text: 'It throws `InvalidOperationException` at startup, because the same key is defined by more than one provider' },
    ],
    answer: 'a',
    tags: ['configuration', 'iconfiguration', 'providers'],
    source: 'topic-list',
    explanation:
      '`IConfiguration` merges every provider into one flat key/value view in registration order; for a key present in more than one provider, whichever provider was added last wins. With the default order used here, command-line arguments are added after environment variables, which are added after the JSON files, so the command-line value wins. (The double underscore in `ConnectionStrings__Default` is how environment variables spell the `:` section separator, since colons are awkward or illegal in most shells and OS environment-variable names.) There is nothing security-related about environment-variable precedence, and configuration never throws when the same key is defined by more than one *provider* — it silently takes the last value, which is exactly the kind of thing worth checking for when a setting "isn\'t taking effect" (a duplicate key repeated inside one JSON file\'s own object is a different case: that throws `FormatException` when the file loads).',
    hint:
      'Recall how `IConfiguration` resolves a key defined by several providers, and the order in which the default builder adds them.',
  },
  {
    id: 'dotnet-addscoped-console-host',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'hosting-and-di',
    level: 'mid',
    kind: 'single',
    prompt:
      "```csharp\nvar builder = Host.CreateApplicationBuilder(args);\nbuilder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connStr));\nbuilder.Services.AddScoped<IOrderProcessor, OrderProcessor>();\n\nvar app = builder.Build();\n\nvar processor = app.Services.GetRequiredService<IOrderProcessor>();\nforeach (var message in queue.ReadAllMessages())\n{\n    processor.Process(message);\n}\n```\nThis is a console/worker host with no HTTP request pipeline; `processor` is resolved once and then reused for every message in the loop. Why is resolving `IOrderProcessor` directly from `app.Services` here a bug, and what is the fix?",
    options: [
      { id: 'a', text: '`app.Services` is the **root** service provider. A scoped service resolved from it is effectively captured as a singleton for the whole application lifetime — one instance is reused for every call and never disposed until shutdown, and any scoped dependency inside it (such as a scoped `AppDbContext`) is captured the same way, producing shared, non-thread-safe state. Fix: create an explicit scope per unit of work with `app.Services.CreateScope()` (or an injected `IServiceScopeFactory`), resolve `IOrderProcessor` from `scope.ServiceProvider`, and dispose the scope when that unit of work is done' },
      { id: 'b', text: "It's not a bug: outside a web request there is no scope boundary at all, so `AddScoped` behaves exactly like `AddSingleton`, which is the desired behavior in a console host" },
      { id: 'c', text: "It's not a bug: `IServiceProvider.GetRequiredService` always opens and disposes a fresh scope internally on every call, so a new `IOrderProcessor` (and a new inner `AppDbContext`) is created each time `Process()` runs" },
      { id: 'd', text: '`AddScoped` cannot be registered in a console host at all; calling it throws at startup unless `builder.Services.AddHttpContextAccessor()` is also called' },
    ],
    answer: 'a',
    tags: ['dependency-injection', 'service-lifetimes', 'captive-dependency', 'hosting'],
    source: 'topic-list',
    explanation:
      "There is no automatic per-request scope in a console or worker host, so someone has to create scopes on purpose — the framework does not do it for you the way it does for an incoming HTTP request. `Host.CreateApplicationBuilder` enables `ValidateScopes` and `ValidateOnBuild` when the host's environment is Development, so in Development this snippet throws \"`InvalidOperationException: Cannot resolve scoped service 'IOrderProcessor' from root provider`\" the moment `GetRequiredService<IOrderProcessor>()` runs. A console host defaults to the `Production` environment unless `DOTNET_ENVIRONMENT` (or `ASPNETCORE_ENVIRONMENT`) is set, so by default — in Production — that validation is off and the call silently succeeds: `processor` is resolved once from the root provider and then reused for every message in the loop, along with any scoped dependency captured inside it (such as a scoped `AppDbContext`), which is exactly the stale-tracked-entities, non-thread-safe-reuse bug this question is about. The fix is the same either way: create a scope per logical operation — `app.Services.CreateScope()` in a simple script, or `IServiceScopeFactory.CreateScope()` injected into a class such as a `BackgroundService` — and resolve scoped services from `scope.ServiceProvider`, disposing the scope when the operation completes.",
    hint:
      'Ask which scope a service resolved from the root provider lives in when no HTTP request is creating scopes for you.',
  },
  {
    id: 'dotnet-ef-executionstrategy',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'entity-framework',
    level: 'mid',
    kind: 'single',
    prompt:
      "```csharp\nbuilder.Services.AddDbContext<AppDbContext>(o =>\n    o.UseSqlServer(connStr, sql => sql.EnableRetryOnFailure()));\n\n// later\nusing var tx = await db.Database.BeginTransactionAsync();\ndb.Orders.Add(order);\nawait db.SaveChangesAsync();\nawait tx.CommitAsync();\n```\n`EnableRetryOnFailure` configures a retrying `IExecutionStrategy`. This code throws `InvalidOperationException: The configured execution strategy ... does not support user-initiated transactions.` Why, and what is the fix?",
    options: [
      { id: 'a', text: "A retrying execution strategy retries an entire unit of work when a transient failure occurs. A manually-opened transaction that spans multiple calls would otherwise be retried only partway through, leaving it committed, rolled back or re-executed inconsistently, so EF Core refuses to mix a retrying strategy with a user-managed transaction. Fix: let the strategy own the transaction boundary by opening, saving and committing the transaction inside `strategy.ExecuteAsync(...)`, where `strategy` comes from `db.Database.CreateExecutionStrategy()`" },
      { id: 'b', text: '`BeginTransactionAsync` only works against SQLite; on SQL Server, transactions must always be started with `System.Transactions.TransactionScope`' },
      { id: 'c', text: '`EnableRetryOnFailure` disables transactions entirely, so `SaveChangesAsync` already commits every change independently and the explicit transaction has to be removed rather than wrapped' },
      { id: 'd', text: 'The exception means the connection string is missing `MultipleActiveResultSets=true`; adding it resolves the conflict between the retry policy and the transaction' },
    ],
    answer: 'a',
    tags: ['ef-core', 'execution-strategy', 'transactions', 'resiliency'],
    source: 'topic-list',
    explanation:
      "This is one of the clearer error messages EF Core produces, and it is pointing at a real correctness issue, not just a style preference: retrying a query or `SaveChanges` call transparently is only safe if the retry can redo the *whole* operation cleanly, and a transaction that was opened outside the strategy cannot be safely rewound and replayed by it. The fix is to move the transaction inside the strategy's delegate — either `strategy.ExecuteAsync(async () => { await using var tx = await db.Database.BeginTransactionAsync(); db.Orders.Add(order); await db.SaveChangesAsync(); await tx.CommitAsync(); })`, or the `ExecuteInTransactionAsync(operation, verifySucceeded)` extension built for exactly this pattern — either way `strategy` (from `db.Database.CreateExecutionStrategy()`) becomes responsible for beginning and committing the transaction, so a retry restarts the whole unit of work from scratch. The \"only works against SQLite\" option is false — `BeginTransactionAsync` is the normal way to start a transaction on SQL Server too. The \"disables transactions entirely\" option is false — `EnableRetryOnFailure` does not stop `SaveChangesAsync` from wrapping its own statements in an (implicit) transaction; it only adds a retrying strategy around the whole operation, and a manually-opened, multi-call transaction still has to live inside that strategy's delegate rather than around it. The `MultipleActiveResultSets=true` option is unrelated: MARS affects running multiple result sets concurrently on one connection and has nothing to do with this exception.",
    hint:
      'Ask what a retrying strategy must be able to replay when a transient failure hits, and who should therefore own the transaction boundary.',
  },
  {
    id: 'dotnet-di-lifetime-pitfalls',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'hosting-and-di',
    level: 'senior',
    kind: 'multi',
    prompt: 'Which statements about DI lifetimes, captive dependencies and `IHostedService`/`BackgroundService` in .NET are correct? Select all that apply.',
    options: [
      { id: 'a', text: 'A singleton service that takes a scoped service as a constructor dependency is a "captive dependency": the scoped instance is captured for the singleton\'s entire lifetime instead of being re-created per scope, which defeats the point of registering it as scoped' },
      { id: 'b', text: 'With the default service provider, enabling scope validation together with `ValidateOnBuild` (as the generic host and `WebApplicationBuilder` do by default in the Development environment) can catch a singleton-depends-on-scoped captive dependency at startup, when the provider is built, instead of only at first use in production' },
      { id: 'c', text: 'A `BackgroundService`/`IHostedService` is registered and resolved as a singleton, so if its work needs a scoped service such as `AppDbContext`, it should inject `IServiceScopeFactory` and create a new scope per unit of work inside `ExecuteAsync`, rather than injecting the scoped service directly into its constructor' },
      { id: 'd', text: 'Injecting `IServiceProvider` into a class and calling `GetService` on it directly whenever a scoped dependency is needed (the "service locator" pattern) is the recommended default way to consume scoped services from a singleton, because it avoids captive dependencies entirely' },
      { id: 'e', text: 'A transient service injected into a singleton is still held by that singleton for as long as the singleton lives; "transient" only guarantees a fresh instance at the moment it is resolved, not that every use of it is short-lived' },
    ],
    answer: ['a', 'b', 'c', 'e'],
    tags: ['dependency-injection', 'captive-dependency', 'background-service', 'hosted-service', 'service-lifetimes'],
    source: 'topic-list',
    explanation:
      "A captive dependency happens purely from the *shape* of the constructor graph: nothing stops you from injecting a scoped service into a singleton, so the DI container has to either capture it (silently wrong) or refuse (validated). Scope/build validation exists precisely to turn the silent version into a loud one during startup rather than a subtle bug found under load. A `BackgroundService` never gets a scope handed to it — it is built once, as a singleton, so any scoped work has to open its own scope, typically once per loop iteration or per message: `using var scope = _scopeFactory.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();`. Injecting `IServiceProvider` and calling `GetService` directly is the *service locator* anti-pattern: even setting aside that it hides real dependencies from the constructor, calling `GetService` on the provider handed to a singleton without first creating a scope resolves scoped services from the root provider, which is the same captive/invalid-resolution problem this question is about — the correct tool is `IServiceScopeFactory.CreateScope()`, not a raw provider reference. Transient only means \"new instance per resolution call\"; once a longer-lived object holds a reference to it, that reference lives exactly as long as its owner does, which is a common source of \"transient services aren't really transient\" surprises.\n\n**Say this out loud:** \"Captive dependencies come from the shape of the constructor graph, not from a typo, so I lean on the provider's scope validation to catch a singleton pulling in a scoped service at startup, and inside a `BackgroundService` I always create an explicit scope per unit of work rather than inject scoped services or reach for the service locator.\"",
    hint:
      'Think about captive dependencies, what scope validation checks when the provider is built, how hosted services are registered, and why the service locator pattern is discouraged.',
  },
  {
    id: 'dotnet-ioptions-variants',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'configuration',
    level: 'senior',
    kind: 'open',
    prompt:
      'A service reads an `SmtpOptions` section bound from configuration. Compare `IOptions<SmtpOptions>`, `IOptionsSnapshot<SmtpOptions>` and `IOptionsMonitor<SmtpOptions>`: when do you reach for each, and what are the lifetime and change-reload trade-offs?',
    modelAnswer:
      "`IOptions<T>` and `IOptionsMonitor<T>` are both registered as singletons, so both are safe to inject straight into another singleton without creating a captive-dependency problem; `IOptionsSnapshot<T>`, the only one of the three registered as scoped, is the one that is not. `IOptions<T>` binds its options on first access and never re-reads them afterward, so the same values are handed out for the rest of the app's lifetime and it never reflects a later configuration reload — that makes it the simplest and cheapest of the three, at the cost of never changing. `IOptionsSnapshot<T>` recomputes the bound options once per scope (once per HTTP request in ASP.NET Core) by re-reading the current `IConfiguration`, so within one request every consumer sees a consistent value, and a new request can see a newer value if the underlying source reloaded; because it is scoped, injecting it into a singleton is exactly the captive-dependency mistake, and the DI container will either capture a stale snapshot forever or reject it if validation is on. `IOptionsMonitor<T>` stays live despite being a singleton: `CurrentValue` always reflects the latest bound configuration, and `OnChange` lets you subscribe to be notified when it changes, which is why it is the one to use inside a `BackgroundService`, a long-lived singleton, or anywhere you need to react to a reloadable source (a JSON file registered with `reloadOnChange: true`, Azure App Configuration, Key Vault refresh, and so on). The trade-off is that `CurrentValue` can change between two reads in the same method, so code that needs an internally-consistent value for one operation should read it once into a local rather than call `CurrentValue` repeatedly.",
    rubric: [
      'States that IOptions<T> is registered as a singleton, bound on first access and never re-read, and never reflects a later reload',
      'States that IOptionsSnapshot<T> is scoped, recomputed once per scope/request, and cannot safely be injected into a singleton',
      'States that IOptionsMonitor<T> is singleton-safe and exposes CurrentValue plus OnChange for live reload notifications',
      'Connects IOptionsMonitor to BackgroundService/long-lived singletons or a reloadable configuration source as the reason to prefer it there',
      'Notes the captive-dependency risk of injecting a scoped option type into a singleton, or the mid-operation inconsistency risk of re-reading CurrentValue',
    ],
    tags: ['configuration', 'ioptions', 'options-pattern', 'hot-reload'],
    source: 'topic-list',
    explanation:
      "This question checks whether \"the options pattern\" is understood as three different lifetimes solving three different problems, not one interchangeable API. The giveaway most candidates miss is that `IOptionsSnapshot<T>` being scoped is exactly as dangerous to inject into a singleton as any other scoped service — it is not just \"the version with reload support,\" and it is *not* the odd one out for being safe in a singleton; `IOptions<T>` and `IOptionsMonitor<T>` both are.\n\n**Say this out loud:** \"IOptions and IOptionsMonitor are both singletons, so both are safe anywhere, including other singletons — IOptions is bound once and never re-read, Monitor stays live via CurrentValue and OnChange. Snapshot is the scoped one, so it's the one that can't go into a singleton, even though it gives the most request-consistent copy.\"",
    hint:
      'Compare the three by their own lifetime and by when they read the bound values; include what injecting the scoped one into a singleton does and how change notifications reach you.',
  },
  {
    id: 'dotnet-dbcontext-thread-safety-tracking',
    domain: 'frameworks',
    subject: 'dotnet',
    topic: 'entity-framework',
    level: 'senior',
    kind: 'open',
    prompt:
      'A `BackgroundService` injects a single `AppDbContext` in its constructor and holds it for its entire lifetime, calling it concurrently from several `Task.Run` workers to read and update rows. It intermittently throws `InvalidOperationException: A second operation was started on this context before a previous operation completed`, and under load some updates seem to silently disappear or apply against stale data. What is wrong, and how would you redesign it?',
    modelAnswer:
      "`DbContext` — and the connection and change tracker underneath it — is not thread-safe: it supports exactly one operation in flight at a time, and its concurrency guard is best-effort, so a second concurrent call (even a `SELECT` racing another `SELECT`) *may* throw that exact exception rather than always throwing it, and concurrent writes that do not happen to hit the guard can still corrupt or overwrite each other's tracked state. The stale-data symptom has a second, separate cause on top of that race: because one `DbContext` stays alive for the whole `BackgroundService` lifetime, its change tracker does identity resolution — once an entity with a given key is tracked, a later query for that same key returns the already-tracked instance instead of refreshing it from the database, so a worker can read what looks like current data but is actually a stale, previously-loaded snapshot, and then write an update computed from it. The real bug is a single long-lived `DbContext` shared across a `BackgroundService`'s whole life and across concurrently-running tasks — the fix is to stop sharing it. I would inject `IDbContextFactory<AppDbContext>` (or `IServiceScopeFactory`) instead of `AppDbContext` directly, and create a short-lived context per unit of work — per queue message, per loop iteration, or per `Task.Run` worker — used only for that one operation and disposed right after, rather than one context living as long as the service. For reads that will not be modified and saved back through that same context, I'd add `AsNoTracking()` so the change tracker does not snapshot entities it will never need to diff, which cuts memory and CPU and avoids accidentally picking up unrelated tracked changes. If the background job loops over many entities and triggers a load per row, I'd replace that with either a single `Include` query for a graph that will actually be updated, or a projection (`Select` into a DTO) for a read-only graph, to avoid the N+1 round trips. Finally, each per-unit-of-work read-modify-`SaveChanges` should be one transactional unit — the default implicit transaction `SaveChanges` wraps is usually enough for a single call, but if the job needs to span more than one `SaveChanges` or if a resilient `SqlServerRetryingExecutionStrategy` is configured, I'd wrap the whole unit of work in `strategy.ExecuteAsync` so retries replay the whole operation instead of a partial one.",
    rubric: [
      'Identifies that DbContext and its change tracker are not thread-safe, and connects that directly to both the exception and the lost/stale-update symptom',
      'Proposes creating a new, short-lived DbContext per unit of work via IDbContextFactory<T> or IServiceScopeFactory, instead of one instance shared for the BackgroundService lifetime and across concurrent tasks',
      'Mentions AsNoTracking for read-only queries to cut change-tracker overhead and avoid unintended tracked state',
      'Mentions avoiding N+1 by using Include for graphs that will be modified or a projection for read-only graphs',
      'Addresses transactional correctness for the per-unit-of-work SaveChanges, including the execution-strategy caveat if retries are configured',
    ],
    tags: ['dbcontext', 'thread-safety', 'change-tracking', 'asnotracking', 'background-service'],
    source: 'topic-list',
    explanation:
      "This scenario bundles several EF Core senior-level facts into one realistic bug report on purpose: the exception text alone tells you the concurrency story, but the \"updates silently disappear\" symptom is the part that separates someone who just wraps the call in a lock from someone who understands the change tracker isn't meant to be shared like this in the first place.\n\n**Say this out loud:** \"DbContext and its change tracker are not thread-safe, so a BackgroundService should hand out a fresh, short-lived context per unit of work through IDbContextFactory or a scope, not share one instance across concurrent tasks for its whole lifetime.\"",
    hint:
      'Cover why `DbContext` is not thread-safe, what a long-lived change tracker does to data freshness, and how to get a short-lived context per unit of work.',
  },
];
