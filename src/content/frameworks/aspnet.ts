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
      { id: 'a', text: 'Middleware is a chain of components that each receive the `HttpContext` and a delegate to the next component; each can run code before and after calling that delegate, so requests flow "in" through the chain in registration order and responses flow back "out" in reverse order' },
      { id: 'b', text: 'Middleware runs only once, at application startup; the code inside `app.Use` executes when `app.Run()` (the one that starts the host, at the bottom of `Program.cs`) is called, not for each incoming HTTP request' },
      { id: 'c', text: 'Every middleware component must call `next` exactly once and can never run any code after doing so; anything written after `await next(context)` is ignored by the runtime' },
      { id: 'd', text: '`app.Use` can only register middleware that runs before routing occurs; it is not possible to write middleware that runs after an endpoint has already produced a response' },
    ],
    answer: 'a',
    tags: ['middleware', 'pipeline', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'Middleware components are chained: each one gets the current `HttpContext` and a `next` delegate representing the rest of the pipeline, decides whether (and when) to call `next`, and can run logic both before and after that call — which is exactly why "Before" prints, then `next` runs the rest of the pipeline (routing, the `/` endpoint), then "After" prints once control returns. Option b is wrong: the host-starting `app.Run()` at the bottom of `Program.cs` is unrelated to the terminal middleware overload also named `Run`, and the `app.Use` delegate executes on every matching request, not once at startup. Option c is backwards — running code after `await next(context)` is the normal, supported way to observe the response on the way back out, and is exactly what makes logging/timing middleware possible. Option d is also wrong: middleware registered anywhere in the pipeline, including after routing, can still run logic after `next` returns, which is after the endpoint has already written its response — that is how response-inspecting middleware (compression, logging status codes, etc.) works.',
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
      { id: 'a', text: '`IOrderService orders` is supplied by dependency injection when the controller is activated for a request, provided `IOrderService` was registered on `builder.Services`; `[Route("api/[controller]")]` maps requests to `/api/Orders` (the `[controller]` token is replaced with the class name minus the `Controller` suffix), and `[HttpGet("{id}")]` combines with it to match `GET /api/Orders/{id}`' },
      { id: 'b', text: '`IOrderService orders` must be resolved manually inside the constructor with `HttpContext.RequestServices.GetService<IOrderService>()`; constructor injection is not supported for ASP.NET Core controllers' },
      { id: 'c', text: '`[ApiController]` is what makes the route reachable at all; without it, the `[HttpGet]` and `[Route]` attributes are ignored and `GetById` can never be invoked' },
      { id: 'd', text: "Because `GetById` returns `IActionResult`, the response is always serialized as XML unless the client explicitly sends an `Accept: application/json` header — JSON is only a negotiated fallback format" },
    ],
    answer: 'a',
    tags: ['dependency-injection', 'controllers', 'routing', 'fundamentals'],
    source: 'topic-list',
    explanation:
      "ASP.NET Core's controller factory resolves constructor parameters from the DI container when it activates a controller for a request, exactly like any other DI-managed class — no manual `HttpContext.RequestServices` lookups are needed, which is what makes option b wrong. `[Route(\"api/[controller]\")]` combined with attribute routing on the action produces `api/Orders/{id}` for this class, matching `GetById`'s `[HttpGet(\"{id}\")]`. Option c overstates what `[ApiController]` does: attribute routing and `[HttpGet]`/`[Route]` work on plain `ControllerBase` classes too; `[ApiController]` adds conveniences on top (automatic 400 responses for invalid model state, inferred binding sources, and requiring attribute routing), it does not gate whether the route is reachable. Option d is wrong because JSON, not XML, is the default (and normally the only) output formatter registered in ASP.NET Core; an XML formatter only participates in content negotiation if it is explicitly added with `AddXmlSerializerFormatters()`.",
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
      { id: 'a', text: '`app.Run` registers **terminal** middleware: its delegate takes no `next` parameter and always writes a response, ending the pipeline right there. It was registered before `app.MapGet("/hello", ...)`, so every request that is not `/health` reaches `app.Run` and is handled by it before the routing/endpoint-execution logic that `MapGet` adds (at the point in `Program.cs` where it is called) ever gets a turn. Fix: move `app.MapGet` before the unconditional `app.Run`, or remove the catch-all `app.Run` block' },
      { id: 'b', text: '`app.Run` and `app.MapGet` cannot be combined in the same pipeline; any `Map*` call must be the very first statement after `app.Build()`' },
      { id: 'c', text: 'The `app.Use` block for `/health` is the bug: its path comparison silently applies to every request, including `/hello`, regardless of the `if` check shown' },
      { id: 'd', text: '`app.Run` only executes if no other middleware ever called `next`, so `app.MapGet("/hello", ...)` should still run first automatically, because route matching is always inserted at the very start of the pipeline no matter where `app.Run` appears in `Program.cs`' },
    ],
    answer: 'a',
    tags: ['middleware', 'terminal-middleware', 'pipeline-order', 'gotcha'],
    source: 'topic-list',
    explanation:
      "`app.Use` middleware receives a `next` delegate and decides whether to call it; `app.Run` middleware does not receive one at all — its signature is just `(HttpContext) => Task`, so by definition it can never forward the request further and always produces a response itself. That makes registration order decisive here: for any path other than `/health`, the conditional `app.Use` block calls `next`, which hands control to whatever was registered after it — and that is the unconditional `app.Run`, registered before `MapGet(\"/hello\", ...)`. The `hello` endpoint's routing/execution logic is effectively inserted into the pipeline at the point `MapGet` is called in `Program.cs`, which here is *after* `app.Run` already swallowed the request. Option b is false — `Run` and `Map*` calls can be freely interleaved; only their relative order matters. Option c is false — the `if` check does correctly scope the early response to `/health` only. Option d is false and is the exact misconception this gotcha exists to catch: nothing about the minimal hosting model makes routing jump to the front of the pipeline regardless of where `Map*` is called — code order in `Program.cs` still governs where each piece of middleware, including the implicit routing/endpoint-execution behavior `Map*` adds, sits in the chain.",
  },
  {
    id: 'aspnet-minimal-api-frombody-inference',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'minimal-apis-and-controllers',
    level: 'mid',
    kind: 'single',
    prompt:
      '```csharp\npublic record CreateOrderRequest(string CustomerId, List<string> ItemIds);\n\napp.MapPost("/orders", (CreateOrderRequest request, IOrderService orders) =>\n{\n    var id = orders.Create(request.CustomerId, request.ItemIds);\n    return Results.Created($"/orders/{id}", new { id });\n});\n```\n`IOrderService` is registered in `builder.Services`. A client `POST`s `{"customerId": "c1", "itemIds": ["i1"]}` as the request body. How are `request` and `orders` bound, and why does only one of them come from the body?',
    options: [
      { id: 'a', text: '`orders` is inferred as a DI-supplied service because `IOrderService` is a registered service type, so it is resolved from the request\'s `IServiceProvider`; `request` has no other binding source (no matching route or query value, not a registered service, no `TryParse`/`BindAsync`), so a minimal API endpoint falls back to binding a parameter like it from the JSON request body. Only one parameter can be implicitly bound from the body this way' },
      { id: 'b', text: 'Both parameters are bound from the body: minimal APIs deserialize the JSON payload independently into every complex-type parameter, splitting properties by name across them' },
      { id: 'c', text: '`orders` is bound from the body because it is declared second in the parameter list, and `request` is resolved from DI because `record` types are always treated as services by minimal API model binding' },
      { id: 'd', text: 'Minimal APIs require an explicit `[FromBody]` attribute on `request`; without it, the endpoint throws `InvalidOperationException` at startup because the binding source for a `record` parameter can never be inferred' },
    ],
    answer: 'a',
    tags: ['minimal-apis', 'model-binding', 'dependency-injection', 'gotcha'],
    source: 'topic-list',
    explanation:
      "Minimal API parameter binding checks, per parameter, whether it matches a known source before falling back to the body: route values, the query string, headers, explicit attributes, special framework types, and — importantly — whether the parameter's type is registered as a service in the DI container. `IOrderService` matches that last case, so `orders` is resolved from the request's service provider rather than parsed from JSON. `request` matches none of those sources (there is no route or query value named `request`, and `CreateOrderRequest` is not a registered service), so the framework treats it as the implicit body parameter and deserializes the JSON payload into it. Only one parameter can be sourced from the body this way — a second unattributed complex type with no other binding source produces a runtime binding error rather than being split across both. Options b and c both invent binding rules ASP.NET Core does not have (per-parameter JSON splitting, and position- or record-based inference); option d is wrong because `[FromBody]` is optional here precisely because binding source inference already resolves it correctly, and there is no startup-time exception for this case.",
  },
  {
    id: 'aspnet-401-vs-403-policy',
    domain: 'frameworks',
    subject: 'aspnet',
    topic: 'auth',
    level: 'mid',
    kind: 'single',
    prompt:
      '```csharp\n[Authorize(Policy = "CanEditOrders")]\n[HttpPut("{id}")]\npublic IActionResult Update(int id, OrderDto dto) { /* ... */ }\n```\nClient A calls this endpoint with no `Authorization` header at all. Client B calls it with a valid, correctly signed JWT bearer token for a real user who simply does not satisfy the `CanEditOrders` policy. What status code does each client get, and why?',
    options: [
      { id: 'a', text: 'Client A gets `401 Unauthorized`, because the authentication handler cannot establish any identity for the request at all, which triggers a "challenge". Client B gets `403 Forbidden`, because authentication succeeds (there is a valid `ClaimsPrincipal`), but authorization evaluates the `CanEditOrders` policy against that principal and it fails, which triggers a "forbid" instead of a challenge' },
      { id: 'b', text: 'Both clients get `401 Unauthorized`; `[Authorize(Policy = ...)]` cannot distinguish "no identity at all" from "identity present but policy failed" — by design, both failures produce the same status code' },
      { id: 'c', text: 'Client A gets `403 Forbidden` (missing credentials are treated as an access denial) and Client B gets `401 Unauthorized` (an authenticated user who fails a policy is treated as if never authenticated at all)' },
      { id: 'd', text: 'Both clients get `500 Internal Server Error`, because policy evaluation runs before authentication in the pipeline, so `HttpContext.User` does not exist yet when `CanEditOrders` is checked and the request throws an unhandled exception' },
    ],
    answer: 'a',
    tags: ['authentication', 'authorization', 'policies', 'status-codes'],
    source: 'topic-list',
    explanation:
      'Authentication and authorization are two distinct failure modes with two distinct responses. When no credentials are presented (or they are invalid), the authorization middleware asks the authentication handler to "challenge" the request, which for JWT bearer authentication with no interactive fallback means a `401`. When credentials are valid and a `ClaimsPrincipal` exists, but that principal does not satisfy the required policy, the response is a "forbid" instead — `403` — because the server knows exactly who is asking and is refusing on purpose, which is a materially different situation than "I don\'t know who this is." Options b and c both collapse or swap that distinction; option d is wrong because `UseAuthentication` runs, and populates `HttpContext.User`, before `UseAuthorization` evaluates any `[Authorize]` attribute — there is no exception here, just two different, well-defined outcomes.',
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
      { id: 'a', text: '`UseAuthentication` must be registered before `UseAuthorization`, because the authorization middleware reads `HttpContext.User`, which the authentication middleware is responsible for populating; registering them in the reverse order means authorization always evaluates against an unauthenticated principal' },
      { id: 'b', text: "In the minimal hosting model, even if `Program.cs` never calls `UseRouting`/`UseEndpoints` explicitly, `WebApplication` still wires in equivalent routing and endpoint-execution behavior automatically — route matching happens near where the endpoints are configured, and the matched endpoint actually executes at the point in `Program.cs` where the corresponding `Map*`/`MapControllers` call appears — so other middleware's position relative to those `Map*` calls still determines whether it runs before matching, between matching and execution, or after a response was already produced" },
      { id: 'c', text: '`UseExceptionHandler`, registered near the start of the pipeline, can catch unhandled exceptions thrown by any downstream component — routing, authentication, authorization, custom middleware, and MVC action execution alike — while an MVC exception *filter* only observes exceptions raised inside the action-invocation pipeline (model binding, action execution, action/result filters) and never sees an exception thrown by middleware running before or after that machinery' },
      { id: 'd', text: 'Exception filters see exceptions thrown by any middleware earlier in the pipeline, not only ones raised during action execution, because MVC filters wrap the entire request pipeline rather than just the controller action' },
      { id: 'e', text: 'Registering `UseAuthorization` before `UseAuthentication` is harmless as long as `[Authorize]` is present on the action, because `UseAuthorization` triggers the authentication handshake itself whenever `HttpContext.User` has not been set yet' },
      { id: 'f', text: "A middleware that never calls `next()` (or `next.Invoke()`) short-circuits the pipeline: nothing registered after it — not even a matched endpoint's execution — runs for that request unless that middleware itself already produced the response" },
    ],
    answer: ['a', 'b', 'c', 'f'],
    tags: ['middleware', 'pipeline-order', 'endpoint-routing', 'exception-handling', 'authentication', 'authorization'],
    source: 'topic-list',
    explanation:
      "Pipeline order is not a style preference in ASP.NET Core; several components have hard dependencies on what ran before them. `UseAuthorization` inspects `HttpContext.User`, which only exists because `UseAuthentication` ran first and populated it from the request's credentials — swap the order and every `[Authorize]` check evaluates against an anonymous principal, regardless of how valid the caller's token actually was. Endpoint routing behaves the same way even when it is implicit: the minimal hosting model inserts routing and endpoint-execution behavior automatically when `UseRouting`/`UseEndpoints` are omitted, but it does so at the position `Program.cs` implies (near the `Map*` calls), not by magically moving to the front — a terminal or short-circuiting middleware registered before those calls still runs first, which is exactly the same mechanism behind the `app.Run` gotcha and behind option f. `UseExceptionHandler` middleware sits in the pipeline like any other middleware, so if it is early enough, it wraps and can catch exceptions from everything downstream of it, including MVC; an MVC exception filter, by contrast, is part of the action-invocation machinery itself, so its blast radius is limited to that machinery — it cannot see an exception thrown by routing, authentication, or a custom middleware, which is exactly what makes option d false and option c true. Option e inverts a real dependency: authorization does not perform authentication as a side effect; it only reads whatever identity authentication already established, so running it first means it never sees a valid identity at all.\n\n**Say this out loud:** \"I keep `UseAuthentication` before `UseAuthorization` because authorization only reads the principal authentication builds, I remember that endpoint execution happens where `Map*` is called even when routing is implicit, and I put broad exception-handling middleware early in the pipeline because filters can only ever catch what happens inside MVC's own action-invocation pipeline, not anything earlier.\"",
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
      "Minimal APIs and controllers both end up dispatching to a C# method through routing, but they differ in overhead and in how much structure you get for free. Minimal APIs skip the MVC filter pipeline and controller-activation machinery, so there is less indirection per request and less boilerplate for a small, focused set of endpoints — but that also means you lose things `[ApiController]` gives controllers automatically, most notably: without extra work, minimal API handlers do not automatically run DataAnnotations validation on a bound model and short-circuit with a `400 ValidationProblemDetails` the way an `[ApiController]`-decorated controller does, so validation has to be done explicitly in (or via a filter added to) the handler. Controllers also bring the full action-filter/exception-filter/result-filter pipeline, which is valuable when cross-cutting behavior (logging, caching, validation, authorization checks that need to run at a specific stage) is already expressed as filters elsewhere in the app — reusing that consistently is a real argument for sticking with controllers in a codebase that already has several of them, purely for consistency and shared infrastructure, even though a brand-new isolated surface would work fine as minimal APIs. If I did go the minimal API route, I would return `IResult` from `TypedResults` (e.g., `TypedResults.Ok(order)`, `TypedResults.NotFound()`, `TypedResults.Created($\"/orders/{id}\", order)`) rather than the untyped `Results.*` equivalents, for two concrete reasons: the concrete `Ok<Order>`/`NotFound` return types make the handler easier to unit test (you can assert on the actual result type and its `Value`, instead of only on the response written to a fake `HttpContext`), and they let the framework infer accurate OpenAPI response metadata from the method signature itself, without needing `.Produces<Order>()` calls bolted on afterward. Either way — minimal API or controller — I would add a `CancellationToken` parameter to the handler/action; ASP.NET Core binds it automatically to `HttpContext.RequestAborted`, and passing it through to the EF Core query or downstream `HttpClient` call lets that work actually stop when the caller disconnects, instead of the server continuing to hold a database connection and do work for a response nobody will ever receive.",
    rubric: [
      'States at least one concrete cost of minimal APIs relative to controllers (e.g., no automatic DataAnnotations validation/model-state short-circuit like [ApiController] provides) and at least one concrete benefit (less overhead/boilerplate, or no MVC filter pipeline)',
      'States at least one concrete reason to prefer controllers here specifically, tied to the existing MVC controllers in the app (shared filters/conventions/consistency), rather than declaring one approach universally better',
      'Explains that TypedResults return concrete result types (vs untyped Results.*), and connects that to better unit testability and/or accurate OpenAPI metadata generation from the method signature',
      'States that a CancellationToken handler parameter binds to HttpContext.RequestAborted and explains why threading it through downstream async calls matters (stopping wasted work/DB connections on client disconnect)',
      'Applies the reasoning to both minimal APIs and controllers rather than treating CancellationToken or the trade-off discussion as specific to only one of them',
    ],
    tags: ['minimal-apis', 'controllers', 'iresult', 'typedresults', 'cancellation-token', 'tradeoffs'],
    source: 'topic-list',
    explanation:
      "This question is deliberately not looking for \"minimal APIs are faster\" as the whole answer — the interesting part is recognizing that the loss of `[ApiController]`'s automatic validation is a real cost, that `TypedResults` exists specifically to recover testability and OpenAPI accuracy that a bare `IResult` return type would lose, and that the CancellationToken point applies uniformly regardless of which hosting style wins.\n\n**Say this out loud:** \"Minimal APIs cost you the automatic model-state validation and filter pipeline controllers get from `[ApiController]`, so in a codebase that already leans on controllers I'd stay consistent; if I did use minimal APIs I'd return `TypedResults` for testability and accurate OpenAPI metadata, and either way I'd accept a `CancellationToken` so abandoned requests stop doing work instead of running to completion for nobody.\"",
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
      "The trap in this scenario is stopping at `[Authorize(Roles = \"OrdersManager\")]` and missing that it silently drops the ownership branch of the rule entirely, because a declarative role check has no way to see the resource being modified — it runs, and finishes, before the action even loads the `Order`.\n\n**Say this out loud:** \"A role attribute can express the manager branch but not ownership of this specific order, because it never sees the resource — so I'd add a resource-based requirement and handler, register it as a policy, and call `AuthorizeAsync` against the loaded order once I have it, instead of trying to force it all into one attribute.\"",
  },
];
