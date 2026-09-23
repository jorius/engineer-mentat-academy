// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'aspnet-middleware-basics',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'middleware',
    level: 'junior',
    kind: 'single',
    prompt:
      '```csharp\nvar app = builder.Build();\n\napp.Use(async (context, next) =>\n{\n    Console.WriteLine("Before");\n    await next(context);\n    Console.WriteLine("After");\n});\n\napp.MapGet("/", () => "Hello");\n\napp.Run();\n```\nWhat best describes ASP.NET Core middleware, based on this example?',
    options: [
      { id: 'a', text: "Middleware runs only once, at application startup; the code inside `app.Use` runs when the host-starting `app.Run()` at the bottom of `Program.cs` is called, not for each incoming request" },
      { id: 'b', text: 'Middleware is a chain of components, each given `HttpContext` and a `next` delegate; each can run code before and after calling `next`, so responses flow back in reverse order' },
      { id: 'c', text: "Every middleware component must call `next` exactly once and can never run code after doing so; a runtime check throws if any code appears after `await next(context)`" },
      { id: 'd', text: "`app.Use` can only register middleware that runs before routing occurs; a separate registration pass automatically wires up any middleware meant to run after an endpoint has produced a response" },
    ],
    answer: 'b',
    tags: ['middleware', 'pipeline', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'Middleware components are chained: each one gets the current `HttpContext` and a `next` delegate representing the rest of the pipeline, decides whether (and when) to call `next`, and can run logic both before and after that call. Because ASP.NET Core wires routing in at the very start of the pipeline once an endpoint is configured, this `app.Use` block already runs after the request has been matched to the `/` endpoint — so `next(context)` here leads straight to that endpoint executing, which is why "Before" prints, then "Hello" is written by the `/` handler, then "After" prints once control returns. Option a is wrong: the host-starting `app.Run()` at the bottom of `Program.cs` is unrelated to the terminal-middleware overload also named `Run`, and this `app.Use` delegate executes on every matching request, not once at startup. Option c is backwards and invents a runtime check that does not exist — running code after `await next(context)` is the normal, supported way to observe the response on its way back out, and is exactly what makes logging/timing middleware possible; nothing throws for doing it. Option d is also wrong and invents a "separate registration pass" that ASP.NET Core has no concept of: middleware registered anywhere in the pipeline can still run logic after `next` returns, which is after the endpoint has already written its response — that is how response-inspecting middleware (compression, logging status codes, etc.) works, with no second pass involved.',
  },
  {
    id: 'aspnet-controller-di-and-routing',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'minimal-apis-and-controllers',
    level: 'junior',
    kind: 'single',
    prompt:
      '```csharp\n[ApiController]\n[Route("api/[controller]")]\npublic class OrdersController : ControllerBase\n{\n    private readonly IOrderService _orders;\n\n    public OrdersController(IOrderService orders)\n    {\n        _orders = orders;\n    }\n\n    [HttpGet("{id}")]\n    public IActionResult GetById(int id)\n    {\n        var order = _orders.Find(id);\n        if (order is null)\n        {\n            return NotFound();\n        }\n        return Ok(order);\n    }\n}\n```\nWhich statement correctly describes this controller?',
    options: [
      { id: 'a', text: "`IOrderService orders` must be resolved manually inside the constructor with `HttpContext.RequestServices.GetService<IOrderService>()`; ASP.NET Core controllers only support property injection, not constructor injection" },
      { id: 'b', text: "`[ApiController]` is what makes the route reachable at all; without it, routing ignores `[HttpGet]`/`[Route]` entirely and treats the class as a plain, unrouted object" },
      { id: 'c', text: "Because `GetById` returns `IActionResult`, the response is always serialized as XML unless the client explicitly sends an `Accept: application/json` header — JSON is only a negotiated fallback" },
      { id: 'd', text: '`IOrderService orders` is supplied by DI when the controller is activated, since `IOrderService` is registered on `builder.Services`; `[Route("api/[controller]")]` plus `[HttpGet("{id}")]` map to `GET /api/Orders/{id}`' },
    ],
    answer: 'd',
    tags: ['dependency-injection', 'controllers', 'routing', 'fundamentals'],
    source: 'topic-list',
    explanation:
      "ASP.NET Core's controller factory resolves constructor parameters from the DI container when it activates a controller for a request, exactly like any other DI-managed class — no manual `HttpContext.RequestServices` lookups are needed, and constructor injection is in fact the standard, recommended way to consume services in a controller, which is what makes option a wrong. `[Route(\"api/[controller]\")]` combined with attribute routing on the action produces `api/Orders/{id}` for this class, matching `GetById`'s `[HttpGet(\"{id}\")]`. Option b overstates what `[ApiController]` does: attribute routing and `[HttpGet]`/`[Route]` work on plain `ControllerBase` classes too; `[ApiController]` adds conveniences on top (automatic 400 responses for invalid model state, inferred binding sources, and requiring attribute routing), it does not gate whether the route is reachable. Option c is wrong because JSON, not XML, is the default (and normally the only) output formatter registered in ASP.NET Core; an XML formatter only participates in content negotiation if it is explicitly added with `AddXmlSerializerFormatters()`.",
  },
  {
    id: 'aspnet-use-vs-run-mismatch',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'middleware',
    level: 'mid',
    kind: 'single',
    prompt:
      '```csharp\napp.Use(async (context, next) =>\n{\n    if (context.Request.Path == "/health")\n    {\n        await context.Response.WriteAsync("OK");\n        return;\n    }\n    await next(context);\n});\n\napp.Run(async context =>\n{\n    await context.Response.WriteAsync("fallback");\n});\n\napp.MapGet("/hello", () => "hi");\n```\nA request to `GET /hello` returns `fallback` instead of `hi`. Why, and what is the fix?',
    options: [
      { id: 'a', text: "`app.Run` is **terminal** — it never calls `next`, so it always answers itself, and it sits ahead of the implicit `UseEndpoints`, which is always wired in at the very end of the pipeline" },
      { id: 'b', text: "`app.Run` and `app.MapGet` cannot be combined in the same pipeline; the runtime throws `InvalidOperationException` at startup unless every `Map*` call is the very first statement after `app.Build()`, before any `app.Use`" },
      { id: 'c', text: "The `app.Use` block for `/health` is the bug: its path comparison silently applies to every request, including `/hello`, regardless of the `if` check shown in the code" },
      { id: 'd', text: 'Moving `app.MapGet("/hello", ...)` to the very top of `Program.cs`, before both `app.Use` blocks, fixes it: ASP.NET Core inserts the implicit endpoint-execution middleware exactly where the matching `Map*` call appears' },
    ],
    answer: 'a',
    tags: ['middleware', 'terminal-middleware', 'pipeline-order', 'gotcha'],
    source: 'topic-list',
    explanation:
      "`app.Use` middleware receives a `next` delegate and decides whether to call it; `app.Run` middleware does not receive one at all — its signature is just `(HttpContext) => Task`, so by definition it always produces a response and can never forward the request further. A `Map*` call like `app.MapGet` does not insert middleware into the pipeline at the point it is written — it only adds an entry to the endpoint data source. Once any endpoint is configured, ASP.NET Core implicitly wires `UseRouting` in at the very start of the pipeline and `UseEndpoints` in at the very end, wrapping every `app.Use`/`app.Run` middleware written in `Program.cs` in between. So `/hello` is already matched to an endpoint by the time this code runs — but for any request other than `/health`, the conditional `app.Use` block calls `next`, handing control to the unconditional `app.Run`, which sits before the implicit `UseEndpoints` and, being terminal, never calls `next` itself. `UseEndpoints` — and therefore the actual `/hello` handler — is never reached. Fix: remove the catch-all `app.Run` (a real fallback should use `app.MapFallback(...)`, which only runs when no endpoint matched), or call `UseRouting()`/`UseEndpoints()` explicitly and place the terminal `app.Run` after `UseEndpoints()`. Option b is false and invents a startup exception that does not exist — `Run` and `Map*` calls can be freely interleaved; only the ordering of actual middleware relative to the implicit `UseEndpoints` position matters. Option c is false — the `if` check does correctly scope the early response to `/health` only. Option d is false and is exactly the natural-but-wrong instinct this gotcha exists to catch: moving `MapGet` earlier changes nothing, because `Map*` calls do not participate in middleware ordering at all — they only register endpoints for the implicit routing/execution machinery to match and invoke later, and that machinery always wraps the entire set of `Program.cs` middleware regardless of where each `Map*` call sits.",
  },
  {
    id: 'aspnet-minimal-api-frombody-inference',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'minimal-apis-and-controllers',
    level: 'mid',
    kind: 'single',
    prompt:
      '```csharp\npublic record CreateOrderRequest(string CustomerId, List<string> ItemIds);\n\napp.MapPost("/orders", (CreateOrderRequest request, IOrderService orders) =>\n{\n    var id = orders.Create(request.CustomerId, request.ItemIds);\n    return Results.Created($"/orders/{id}", new { id });\n});\n```\n`IOrderService` is registered in `builder.Services`. A client `POST`s `{"customerId": "c1", "itemIds": ["i1"]}` as the request body. How are the two parameters bound?',
    options: [
      { id: 'a', text: "Both parameters are bound from the body: minimal APIs deserialize the JSON payload independently into every complex-type parameter, splitting properties by name across them" },
      { id: 'b', text: "Minimal APIs require an explicit `[FromBody]` attribute on `request`; without it, the endpoint throws `InvalidOperationException` at startup because a `record` parameter's source can never be inferred" },
      { id: 'c', text: "`orders` resolves as a DI service because `IOrderService` is registered; `request` matches no other binding source, so it falls back to the JSON body. Only one parameter can be implicitly body-bound this way" },
      { id: 'd', text: "`orders` is bound from the body because it is declared second in the parameter list, and `request` resolves from DI because `record` types are always treated as services by minimal API binding, never inferred otherwise" },
    ],
    answer: 'c',
    tags: ['minimal-apis', 'model-binding', 'dependency-injection', 'gotcha'],
    source: 'topic-list',
    explanation:
      "Minimal API parameter binding checks, per parameter, whether it matches a known source before falling back to the body: route values, the query string, explicit attributes, special framework types, and — importantly — whether the parameter's type is registered as a service in the DI container. `IOrderService` matches that last case, so `orders` is resolved from the request's service provider rather than parsed from JSON. `request` matches none of those sources (there is no route or query value named `request`, and `CreateOrderRequest` is not a registered service), so the framework treats it as the implicit body parameter and deserializes the JSON payload into it. Only one parameter can be sourced from the body this way — a second unattributed complex type with no other binding source produces a runtime binding error rather than being split across both. Option a invents a per-parameter JSON-splitting rule ASP.NET Core does not have. Option b is wrong because `[FromBody]` is optional here precisely because binding source inference already resolves it correctly, and there is no startup-time exception for this case. Option d invents position- and record-based inference rules that also do not exist — the binding source depends on where the value can actually come from (route, query, DI, body), never on parameter order or on being a `record`.",
  },
  {
    id: 'aspnet-401-vs-403-policy',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'auth',
    level: 'mid',
    kind: 'single',
    prompt:
      '```csharp\n[Authorize(Policy = "CanEditOrders")]\n[HttpPut("{id}")]\npublic IActionResult Update(int id, OrderDto dto) { /* ... */ }\n```\nThe app registers JWT bearer as its default authentication scheme, with no cookie or other redirect-based scheme configured. Client A calls this endpoint with no `Authorization` header at all. Client B calls it with a valid, correctly signed JWT bearer token for a real user who simply does not satisfy the `CanEditOrders` policy. What status code does each client get, and why?',
    options: [
      { id: 'a', text: 'Both clients get `401 Unauthorized`; `[Authorize(Policy = ...)]` cannot distinguish "no identity at all" from "identity present but policy failed" — both failures produce the same status code, with no distinction' },
      { id: 'b', text: 'Client A gets `401 Unauthorized` — no identity could be established, which triggers a "challenge". Client B gets `403 Forbidden` — authentication succeeds, but the `CanEditOrders` policy fails against that principal' },
      { id: 'c', text: 'Client A gets `403 Forbidden` (missing credentials are treated as an access denial) and Client B gets `401 Unauthorized` (an authenticated user who fails a policy is treated as never authenticated)' },
      { id: 'd', text: 'Both clients get `500 Internal Server Error`, because policy evaluation runs before authentication in the pipeline, so `HttpContext.User` does not exist yet when the `CanEditOrders` policy is checked against it' },
    ],
    answer: 'b',
    tags: ['authentication', 'authorization', 'policies', 'status-codes'],
    source: 'topic-list',
    explanation:
      'Authentication and authorization are two distinct failure modes with two distinct responses. Because JWT bearer is the app\'s default scheme here with no interactive fallback, a missing or invalid credential produces a `401` "challenge", while a valid credential that fails the `CanEditOrders` policy produces a `403` "forbid" — the server knows exactly who is asking and is refusing on purpose, which is a materially different situation than "I don\'t know who this is." Option a collapses that distinction into a single status code, and option c swaps it. Option d is wrong because `UseAuthentication` runs, and populates `HttpContext.User`, before `UseAuthorization` evaluates any `[Authorize]` attribute — there is no exception here, just two different, well-defined outcomes.',
  },
  {
    id: 'aspnet-middleware-pipeline-tradeoffs',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'middleware',
    level: 'senior',
    kind: 'multi',
    prompt: 'Which statements about the ASP.NET Core middleware pipeline, endpoint routing, and exception handling are correct? Select all that apply.',
    options: [
      { id: 'a', text: '`UseAuthentication` must be registered before `UseAuthorization`, because the authorization middleware reads `HttpContext.User`, which the authentication middleware is responsible for populating; registering them in the reverse order means authorization always evaluates against an unauthenticated principal, at least for policies that do not name explicit `AuthenticationSchemes`' },
      { id: 'b', text: "In the minimal hosting model, once any endpoint is configured, `WebApplication` implicitly wires `UseRouting` in at the very start of the pipeline and `UseEndpoints` in at the very end, wrapping every `app.Use`/`app.Run` middleware registered in `Program.cs` — `Map*`/`MapControllers` calls only add entries to the endpoint data source, they do not change where that middleware sits. So middleware anywhere in `Program.cs` still runs before the matched endpoint actually executes, regardless of whether it was written before or after the corresponding `Map*` call, unless a terminal or short-circuiting middleware intercepts the request first" },
      { id: 'c', text: '`UseExceptionHandler`, registered near the start of the pipeline, can catch unhandled exceptions thrown by any downstream component — routing, authentication, authorization, custom middleware, and MVC action execution alike — while an MVC exception *filter* only observes exceptions raised during model binding, action filters and the action method, and never sees an exception thrown by middleware running before or after that machinery, or by a result filter' },
      { id: 'd', text: 'Exception filters see exceptions thrown by any middleware earlier in the pipeline, not only ones raised during action execution, because MVC filters wrap the entire request pipeline rather than just the controller action' },
      { id: 'e', text: "A middleware that never calls `next()` (or `next.Invoke()`) short-circuits the pipeline: nothing registered after it — not even a matched endpoint's execution — runs for that request" },
    ],
    answer: ['a', 'b', 'c', 'e'],
    tags: ['middleware', 'pipeline-order', 'endpoint-routing', 'exception-handling', 'authentication', 'authorization'],
    source: 'topic-list',
    explanation:
      "Pipeline order is not a style preference in ASP.NET Core; several components have hard dependencies on what ran before them. `UseAuthorization` inspects `HttpContext.User`, which — for a policy that does not name explicit `AuthenticationSchemes` — only has an identity on it because `UseAuthentication` ran first and populated it from the request's credentials; swap the order for such a policy and every `[Authorize]` check evaluates against an anonymous principal, regardless of how valid the caller's token actually was. (A policy that does name specific schemes is a narrower exception: the authorization middleware's policy evaluator can trigger authentication for those schemes itself, but that is not the general rule.) Endpoint routing is wired the same way even though it is implicit: once any endpoint is configured, `WebApplication` inserts `UseRouting` at the very start of the pipeline and `UseEndpoints` at the very end, wrapping every `app.Use`/`app.Run` middleware written in `Program.cs` — `Map*`/`MapControllers` calls only add entries to the endpoint data source, they do not change where that middleware sits. So route matching happens before all user middleware, and the matched endpoint only actually executes after all of it, unless a terminal or short-circuiting middleware — the same mechanism as option e — intercepts the request first. `UseExceptionHandler` middleware sits in the pipeline like any other middleware, so if it is early enough, it wraps and can catch exceptions from everything downstream of it, including MVC; an MVC exception filter, by contrast, only observes exceptions raised during model binding, action filters, or the action method itself, so it cannot see an exception thrown by routing, authentication, a custom middleware, or even a result filter — which is exactly what makes option d false and option c true.\n\n**Say this out loud:** \"`UseAuthentication` has to run before `UseAuthorization`, and the matched endpoint only actually executes at the very end of the pipeline, not wherever `Map*` happens to be written. A short-circuiting middleware anywhere before that point can swallow the request, and an exception filter only ever sees what happens inside MVC's own action-invocation code, never anything earlier in the pipeline.\"",
  },
  {
    id: 'aspnet-minimal-api-vs-controllers-tradeoffs',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'minimal-apis-and-controllers',
    level: 'senior',
    kind: 'open',
    prompt:
      "Your team is adding a new read/write HTTP surface for `Order` resources to a .NET 8/9 app that already hosts several well-established MVC controllers. Discuss the trade-offs between building the new endpoints as minimal APIs (`MapGet`/`MapPost` on `WebApplication`) versus as an MVC controller, how you would shape minimal API responses using `IResult`/`TypedResults` if you went that route, and why you would add a `CancellationToken` parameter to the handlers either way.",
    modelAnswer:
      "Minimal APIs and controllers both end up dispatching to a C# method through routing, but they differ in overhead and in how much structure you get for free. Minimal APIs skip the MVC filter pipeline and controller-activation machinery, so there is less indirection per request and less boilerplate for a small, focused set of endpoints — but that also means you lose things `[ApiController]` gives controllers automatically, most notably: without extra work, minimal API handlers do not automatically run DataAnnotations validation on a bound model and short-circuit with a `400 ValidationProblemDetails` the way an `[ApiController]`-decorated controller does, so validation has to be done explicitly in (or via a filter added to) the handler. Controllers also bring the full action-filter/exception-filter/result-filter pipeline, which is valuable when cross-cutting behavior (logging, caching, validation, authorization checks that need to run at a specific stage) is already expressed as filters elsewhere in the app — reusing that consistently is a real argument for sticking with controllers in a codebase that already has several of them, purely for consistency and shared infrastructure, even though a brand-new isolated surface would work fine as minimal APIs. If I did go the minimal API route, I would still call `TypedResults` (e.g., `TypedResults.Ok(order)`, `TypedResults.NotFound()`) inside the handler, but I would also declare the handler's own return type as the concrete typed result — `Ok<Order>` for a single outcome, or the union `Results<Ok<Order>, NotFound>` when the handler can produce more than one outcome — rather than annotating it as the bare `IResult` interface. Declaring the return type as plain `IResult` erases that compile-time type information, which loses two things: the handler becomes harder to unit test (you can only assert on the response written to a fake `HttpContext`, not on a concrete result and its `Value`), and, more importantly, it loses accurate OpenAPI response metadata, which the framework can only infer from a signature that actually names the concrete or unioned result types, not from `.Produces<Order>()` calls bolted on afterward as a workaround. Either way — minimal API or controller — I would add a `CancellationToken` parameter to the handler/action; ASP.NET Core binds it automatically to `HttpContext.RequestAborted`, and passing it through to the EF Core query or downstream `HttpClient` call lets that work actually stop when the caller disconnects, instead of the server continuing to hold a database connection and do work for a response nobody will ever receive.",
    rubric: [
      'States at least one concrete cost of minimal APIs relative to controllers (e.g., no automatic DataAnnotations validation/model-state short-circuit like [ApiController] provides) and at least one concrete benefit (less overhead/boilerplate, or no MVC filter pipeline)',
      'States at least one concrete reason to prefer controllers here specifically, tied to the existing MVC controllers in the app (shared filters/conventions/consistency), rather than declaring one approach universally better',
      'States that a handler must declare its return type as a concrete TypedResults type (e.g., Ok<Order>) or a Results<...> union, not the bare IResult interface, because declaring IResult erases the type information OpenAPI metadata inference and stronger unit-test assertions depend on',
      'States that a CancellationToken handler parameter binds to HttpContext.RequestAborted and explains why threading it through downstream async calls matters (stopping wasted work/DB connections on client disconnect)',
      'Applies the reasoning to both minimal APIs and controllers rather than treating CancellationToken or the trade-off discussion as specific to only one of them',
    ],
    tags: ['minimal-apis', 'controllers', 'iresult', 'typedresults', 'cancellation-token', 'tradeoffs'],
    source: 'topic-list',
    explanation:
      "This question is deliberately not looking for \"minimal APIs are faster\" as the whole answer — the interesting part is recognizing that the loss of `[ApiController]`'s automatic validation is a real cost, that a handler has to actually declare a concrete `TypedResults` return type (not just call `TypedResults.*` while still typed as `IResult`) to keep OpenAPI accuracy and testability, and that the CancellationToken point applies uniformly regardless of which hosting style wins.\n\n**Say this out loud:** \"Minimal APIs cost you the automatic model-state validation and filter pipeline controllers get from `[ApiController]`, so in a codebase that already leans on controllers I'd stay consistent. If I did use minimal APIs I'd declare concrete `TypedResults` return types for testability and accurate OpenAPI metadata, and either way I'd accept a `CancellationToken` so abandoned requests stop doing work instead of running to completion for nobody.\"",
  },
  {
    id: 'aspnet-jwt-bearer-policy-authorization',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'auth',
    level: 'senior',
    kind: 'open',
    prompt:
      'Design authorization for `PUT /orders/{id}` so that only the order\'s owner, or a user in the `OrdersManager` role, can update it. Explain how ASP.NET Core validates the incoming JWT bearer token in the first place, then explain why a plain `[Authorize(Roles = "OrdersManager")]` is not enough by itself for this rule, and what a custom requirement/handler adds that a role check alone cannot.',
    modelAnswer:
      "JWT bearer validation is configured through `AddAuthentication(...).AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidIssuer = ..., ValidateAudience = true, ValidAudience = ..., ValidateLifetime = true, ValidateIssuerSigningKey = true, IssuerSigningKey = ... })`. On each request, the JWT bearer handler checks the token's signature against the configured signing key, and checks the issuer, audience and expiration against those `TokenValidationParameters`; if every check passes, it builds a `ClaimsPrincipal` from the token's claims and sets it on `HttpContext.User` (this only takes effect for later middleware because `UseAuthentication` runs before `UseAuthorization`). `[Authorize(Roles = \"OrdersManager\")]` alone can express the manager branch of the rule, but it cannot express \"or is the owner of this specific order,\" because a role check only ever looks at claims already present on the principal — it has no way to compare those claims against the specific `Order` being updated, since the attribute is evaluated before the resource is even loaded. To combine both branches, I'd define a custom `IAuthorizationRequirement` (e.g., `SameOwnerOrRoleRequirement`) and a resource-typed `AuthorizationHandler<SameOwnerOrRoleRequirement, Order>`, whose `HandleRequirementAsync` succeeds the requirement if `context.User.IsInRole(\"OrdersManager\")` is true, or if the order's owner id matches an id claim on `context.User`. I'd register it with `services.AddAuthorization(options => options.AddPolicy(\"CanEditOrder\", policy => policy.Requirements.Add(new SameOwnerOrRoleRequirement())))` and `services.AddSingleton<IAuthorizationHandler, SameOwnerOrRoleHandler>()`. Because this is resource-based — the decision depends on the specific `Order`, not just the caller's claims — it can't be fully expressed as a declarative `[Authorize]` attribute on the action; instead, the action loads the order first, then calls `await _authorizationService.AuthorizeAsync(User, order, \"CanEditOrder\")` and returns `Forbid()` (403) if that fails.",
    rubric: [
      'Describes JWT bearer validation via TokenValidationParameters (issuer, audience, lifetime, signing key) and states that success populates HttpContext.User with claims for later middleware',
      "States that a role check alone can't express ownership of a specific resource because it only inspects claims already on the principal, not the entity being acted on",
      'Describes defining a custom IAuthorizationRequirement plus an AuthorizationHandler<TRequirement> (ideally resource-typed) registered via AddPolicy/AddAuthorization',
      'States that resource-based authorization requires an imperative IAuthorizationService.AuthorizeAsync(user, resource, policy) call after loading the entity, since a declarative [Authorize] attribute runs before the resource exists',
      'Produces a coherent combined rule (OrdersManager role OR ownership match) rather than only one branch of it',
    ],
    tags: ['jwt', 'authentication', 'authorization', 'policies', 'requirements', 'resource-based-authorization'],
    source: 'topic-list',
    explanation:
      "The trap in this scenario is stopping at `[Authorize(Roles = \"OrdersManager\")]` and missing that it silently drops the ownership branch of the rule entirely, because a declarative role check has no way to see the resource being modified — it runs, and finishes, before the action even loads the `Order`.\n\n**Say this out loud:** \"A role attribute can express the manager branch, but not ownership of this specific order, because it never sees the resource. So I'd add a resource-based requirement and handler, register it as a policy, and call `AuthorizeAsync` against the order once I've loaded it, instead of forcing everything into one attribute.\"",
  },
];
