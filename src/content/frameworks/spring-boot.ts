// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'spring-boot-application-annotation-basics',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'beans-and-di',
    level: 'junior',
    kind: 'single',
    prompt:
      "```java\n@SpringBootApplication\npublic class DemoApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(DemoApplication.class, args);\n    }\n}\n```\nWhat does the single `@SpringBootApplication` annotation combine?",
    options: [
      {
        id: 'a',
        text: '`@Configuration` (marks the class as a source of bean definitions), `@EnableAutoConfiguration` (lets Spring Boot configure beans based on the classpath and any properties it finds), and `@ComponentScan` (scans the package of the annotated class, and its subpackages, for components)',
      },
      { id: 'b', text: '`@Controller`, `@Service` and `@Repository` — it bundles the three stereotype annotations so every class in the project is automatically treated as all three at once' },
      { id: 'c', text: 'Only `@EnableAutoConfiguration`; `@Configuration` and `@ComponentScan` still have to be added separately for bean definitions and component scanning to work' },
      { id: 'd', text: '`@SpringBootTest`, `@ExtendWith(SpringExtension.class)` and `@AutoConfigureMockMvc` — it wires up a test application context for every class in the project' },
    ],
    answer: 'a',
    tags: ['spring-boot-application', 'auto-configuration', 'component-scan', 'fundamentals'],
    source: 'topic-list',
    explanation:
      '`@SpringBootApplication` is itself meta-annotated with exactly these three: `@Configuration` so the class can also declare `@Bean` methods, `@EnableAutoConfiguration` so Spring Boot inspects the classpath (and any `@ConditionalOn...` guards) to configure beans like an embedded Tomcat or a `DataSource` without XML, and `@ComponentScan` rooted at the annotated class\'s package so `@Component`/`@Service`/`@Repository`/`@Controller` classes underneath it are discovered automatically. Option b confuses the stereotype annotations (which mark individual classes for scanning) with what `@SpringBootApplication` itself does — it does not retroactively stereotype every class in the project. Option c is wrong because `@Configuration` and `@ComponentScan` are already included; adding them again would be redundant, not required. Option d confuses this with testing annotations, which are a separate, opt-in concern for test classes only.',
  },
  {
    id: 'spring-boot-repository-interface-basics',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'data-jpa',
    level: 'junior',
    kind: 'single',
    prompt:
      "```java\npublic interface ProductRepository extends JpaRepository<Product, Long> {\n    List<Product> findByNameContainingIgnoreCase(String name);\n}\n```\nNo class in the codebase implements `ProductRepository`, yet it can be `@Autowired` and used to call `.save(product)`, `.findById(id)` and `.findByNameContainingIgnoreCase(\"widget\")`. What is `ProductRepository`, and where does its implementation come from?",
    options: [
      {
        id: 'a',
        text: "It is a Spring Data JPA repository interface. At startup, Spring Data scans for interfaces extending `JpaRepository` (or similar) and creates a runtime proxy that implements the inherited CRUD methods, plus derives the query for `findByNameContainingIgnoreCase` from the method name itself",
      },
      { id: 'b', text: "It's a plain Java interface; the Java 21 compiler automatically synthesizes a default implementation for any interface whose method names match field names on the referenced entity class" },
      { id: 'c', text: "It only works because `Product` implements `Serializable`; Spring builds the implementation by reflecting over `Product`'s getters and setters, not over `ProductRepository` itself" },
      { id: 'd', text: 'The `@SpringBootApplication` class must declare a `@Bean` method that returns `new ProductRepositoryImpl()`; the proxy is generated at compile time by an annotation processor invoked from that bean method' },
    ],
    answer: 'a',
    tags: ['spring-data-jpa', 'repository', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'Spring Data JPA repository interfaces need no hand-written implementation: at startup, the Spring Data infrastructure finds every interface extending one of its base repository interfaces (`Repository`, `CrudRepository`, `JpaRepository`, and so on) inside the scanned packages and generates a proxy — backed by `SimpleJpaRepository` for the inherited methods — that is registered as a Spring bean under that interface type. Query methods with no body, like `findByNameContainingIgnoreCase`, are handled by parsing the method name into a JPQL query at startup (`Containing` becomes a `LIKE %...%`, `IgnoreCase` wraps both sides in a case-insensitive comparison); nothing here depends on Java 21 language features, and no compiler or annotation processor generates a real `ProductRepositoryImpl` class, which rules out options b and d. `Serializable` on the entity is unrelated to how the repository proxy is built, which rules out option c.',
  },
  {
    id: 'spring-boot-circular-dependency-boot26',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'beans-and-di',
    level: 'mid',
    kind: 'single',
    prompt:
      "```java\n@Service\npublic class OrderService {\n    @Autowired\n    private PaymentService paymentService;\n}\n\n@Service\npublic class PaymentService {\n    @Autowired\n    private OrderService orderService;\n}\n```\nThis project starts fine on Spring Boot 2.5. After upgrading to Spring Boot 3.x, startup fails with `BeanCurrentlyInCreationException`, reporting a circular reference between `orderService` and `paymentService`. What changed, and what's the recommended fix (rather than just silencing the exception)?",
    options: [
      {
        id: 'a',
        text: "Spring can resolve a circular dependency between field/setter-injected singleton beans by exposing an early, not-yet-fully-initialized reference to each bean while the other is still being constructed — but since Spring Boot 2.6, `spring.main.allow-circular-references` defaults to `false`, so that tolerance is off by default and the cycle now fails fast at startup. Setting the property back to `true` silences the exception but isn't the recommended fix; the real fix is to break the cycle — e.g. inject one side lazily with `@Lazy`, extract the behavior both services need into a third bean neither one depends on, or redesign so one service doesn't need a direct reference back to the other",
      },
      { id: 'b', text: 'Circular dependencies between singleton beans have never been resolvable by Spring in any version; the fact that this started on 2.5 means the beans were never actually wired to each other, only logged as a false-positive warning' },
      { id: 'c', text: 'The exception means `OrderService` and `PaymentService` must both be annotated `@Primary`; adding `@Primary` to either class resolves the ambiguity that triggers the circular-reference check' },
      { id: 'd', text: "This has nothing to do with the Spring Boot version — it happens because both classes are annotated `@Service` instead of one being `@Component`; Spring only allows one `@Service` bean per dependency cycle" },
    ],
    answer: 'a',
    tags: ['dependency-injection', 'circular-dependency', 'bean-lifecycle'],
    source: 'topic-list',
    explanation:
      "Field/setter-injected circular dependencies used to work because Spring instantiates each singleton with its default constructor first, caches an early reference to that not-fully-populated instance, and only performs field/setter injection afterward — so `orderService` and `paymentService` can each receive a reference to the other's early instance. (Constructor-injected cycles are a different story and have never been resolvable this way, in any Spring version, because a constructor needs its arguments before the object exists at all.) Spring Boot 2.6 changed the default of `spring.main.allow-circular-references` to `false`, so the same field-injection cycle that quietly worked on 2.5 now fails fast with `BeanCurrentlyInCreationException` instead. Flipping the property back to `true` restores the old behavior but just re-hides a design smell; the recommended fix is to remove the cycle, most commonly with `@Lazy` on one of the two injected fields so that side is only resolved (through a proxy) the first time it's actually used, well after both beans finish construction. Options b, c and d are fabricated: circular field injection did work pre-2.6, `@Primary` addresses ambiguous *candidates* for a single injection point and has nothing to do with cycles, and Spring places no such limit on how many `@Service` beans can appear in a dependency graph.",
  },
  {
    id: 'spring-boot-valid-requestbody-response',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'web',
    level: 'mid',
    kind: 'multi',
    prompt:
      "```java\n@RestController\n@RequestMapping(\"/api/orders\")\npublic class OrderController {\n\n    @PostMapping\n    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {\n        Order saved = orderService.create(request);\n        return ResponseEntity.status(HttpStatus.CREATED).body(OrderResponse.from(saved));\n    }\n\n    @GetMapping(\"/{id}\")\n    public ResponseEntity<OrderResponse> getById(@PathVariable Long id,\n                                                  @RequestParam(required = false) Boolean includeItems) {\n        // ...\n    }\n}\n```\nWhich statements about this controller are correct? Select all that apply.",
    options: [
      {
        id: 'a',
        text: "`@RequestBody` deserializes the JSON request body into a `CreateOrderRequest` instance using a registered `HttpMessageConverter` (Jackson by default); `@Valid` then runs Bean Validation constraints declared on `CreateOrderRequest`'s fields, and a failing constraint causes Spring MVC to reject the request with a 400-level response before `create`'s body runs",
      },
      { id: 'b', text: "`@PathVariable Long id` binds the `{id}` segment of the URL template to the `id` parameter, while `@RequestParam(required = false) Boolean includeItems` binds an optional query-string parameter (e.g. `?includeItems=true`); a request that omits `includeItems` leaves it `null` instead of failing" },
      {
        id: 'c',
        text: 'Returning `ResponseEntity<OrderResponse>` instead of a plain `OrderResponse` is required for JSON serialization to work at all — if `create` instead returned a plain `OrderResponse`, `@RestController` would have no way to write it to the response body',
      },
      { id: 'd', text: '`@RestController` is shorthand for `@Controller` combined with `@ResponseBody` applied to every handler method, so return values are written straight to the HTTP response body through message conversion instead of being resolved as a view name' },
      { id: 'e', text: "If `CreateOrderRequest` has no Bean Validation constraint annotations on any field (no `@NotNull`, `@Size`, etc.), putting `@Valid` in front of `@RequestBody` makes the application fail to start, because there is nothing for the validator to check" },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['rest-controller', 'validation', 'request-mapping', 'response-entity'],
    source: 'topic-list',
    explanation:
      "a and b describe the standard, well-defined behavior of `@RequestBody`/`@Valid` and `@PathVariable`/`@RequestParam` and are correct as written. d is also correct: `@RestController` is exactly `@Controller` + `@ResponseBody`, which is why handler methods return data instead of a view name. c is false — `@RestController` applies `@ResponseBody` to every handler regardless of return type, so a plain `OrderResponse` is serialized to JSON with a default `200 OK` just fine; `ResponseEntity` is only needed when the method wants to control the status code, headers, or both explicitly (as `create` does here to return `201 Created`), not to make serialization possible. e is false — `@Valid` with no constraints on the target type is a harmless no-op: validation runs, finds nothing to check, and the request proceeds; it causes neither a startup failure nor a runtime error.",
  },
  {
    id: 'spring-boot-save-vs-merge',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'data-jpa',
    level: 'mid',
    kind: 'single',
    prompt:
      "```java\npublic interface ProductRepository extends JpaRepository<Product, Long> {}\n\n@Service\npublic class ProductService {\n    private final ProductRepository repository;\n    // constructor omitted\n\n    public Product createOrUpdate(Product product) {\n        return repository.save(product);\n    }\n}\n```\n`Product.id` is annotated `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)`. A caller builds `new Product()`, leaving `id` as `null`, and calls `createOrUpdate`. What does `JpaRepository.save(...)` do in that case — and how would the behavior differ if the caller instead passed a `Product` with a non-null `id` that does not yet exist in the database (say, an id copied in from another system)?",
    options: [
      {
        id: 'a',
        text: '`SimpleJpaRepository.save` decides between insert and update by checking whether the entity is "new" — for a `@GeneratedValue` id, that check is simply `id == null`. With `id == null`, Hibernate performs an `INSERT` via `persist`, and the generated key is written back onto `product`. With a non-null `id` that isn\'t in the database yet, the same check now treats the entity as **not new**, so `save` calls `merge` instead: Hibernate first issues a `SELECT` to look for that row, finds none, and still ends up inserting it — but through the pricier merge/select path rather than a direct `persist`',
      },
      { id: 'b', text: '`save` always performs an `INSERT` no matter what `id` holds; if a row with that `id` already exists, the database rejects it with a primary-key violation, so `save` can never be used to update an existing row — a separate `update` method has to be added to the repository for that' },
      { id: 'c', text: 'Whether `save` inserts or updates depends only on whether the surrounding transaction is `@Transactional(readOnly = true)`: a read-only transaction always results in `merge`, a writable one always results in `persist`, regardless of the `id` value' },
      { id: 'd', text: 'Because `Product` uses `GenerationType.IDENTITY`, Hibernate can only assign the id after the row is inserted, so calling `save` with a non-null, not-yet-persisted `id` throws `IdentifierGenerationException` immediately, before any SQL is sent' },
    ],
    answer: 'a',
    tags: ['spring-data-jpa', 'save', 'merge', 'hibernate'],
    source: 'topic-list',
    explanation:
      "This is a well-known gotcha because both paths eventually insert the row, so the difference is easy to miss in a quick test but shows up as extra `SELECT`s (or as surprising behavior for entities that implement `Persistable` and override `isNew()`) under load. Option b is wrong — `save` is Spring Data's combined create-or-update entry point precisely so callers don't need a separate `update` method; it routes to `persist` or `merge` depending on the new/not-new check, not always to `INSERT`. Option c is fabricated — `readOnly` only affects how the transaction is configured (e.g. a hint to skip dirty checking and, on some drivers, mark the connection read-only); it plays no part in the persist-vs-merge decision. Option d is wrong — Hibernate does not reject a non-null id up front; it uses the id's non-null value to decide the entity is 'not new' and proceeds down the merge path described in option a instead of throwing.",
  },
  {
    id: 'spring-boot-transactional-self-invocation',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'beans-and-di',
    level: 'senior',
    kind: 'open',
    prompt:
      "```java\n@Service\npublic class ReportService {\n\n    public void generateMonthlyReport() {\n        // ... build the report ...\n        saveReport();\n    }\n\n    @Transactional\n    public void saveReport() {\n        reportRepository.save(report);\n        auditRepository.save(audit);\n    }\n}\n```\nA caller injects `ReportService` and calls `generateMonthlyReport()`. Both repository writes inside `saveReport()` happen, but they are not actually running inside a transaction — if `auditRepository.save(audit)` throws, `reportRepository.save(report)` is not rolled back. Why does `@Transactional` silently do nothing here, and how would you restructure the code to fix it?",
    modelAnswer:
      "By default, Spring implements `@Transactional` (and `@Cacheable`, `@Async`) with proxy-based AOP: for a class-based bean like this one (no interface), Spring creates a CGLIB subclass of `ReportService` at startup and registers *that proxy* as the bean other components get injected with. The proxy overrides `saveReport()` to open a transaction, invoke the real method on the underlying target, and commit or roll back around it. That interception only happens for calls that arrive *through the proxy reference*. Inside `generateMonthlyReport()`, the call `saveReport()` is really `this.saveReport()` — a plain Java virtual call on the raw target object, made from code that is itself already running inside the target (the proxy already delegated into it to run `generateMonthlyReport()`). That call never goes back out through the proxy, so the transactional advice around `saveReport()` never fires, and both saves run outside any transaction, non-atomically. The same rule applies identically to `@Cacheable` and `@Async` on a self-invoked method, and standard Spring AOP proxies can only intercept public methods called from outside the class in the first place — a private method can never be advised, proxy-based or not, because the proxy has to override or implement the method to intercept it. To fix it, route the call through the proxy instead of through `this`: the cleanest option is to move `saveReport()` into its own collaborator bean and have `ReportService` call that bean; alternatively, inject a self-reference (`@Lazy @Autowired private ReportService self;`) and call `self.saveReport()`, or enable `@EnableAspectJAutoProxy(exposeProxy = true)` and call `((ReportService) AopContext.currentProxy()).saveReport()`. Extracting a collaborator bean is usually preferred because it doesn't depend on proxy internals and keeps the class's public API honest about what's transactional.",
    rubric: [
      'Identifies that @Transactional (like @Cacheable and @Async) is implemented by wrapping the bean in a proxy (CGLIB subclass here, since there is no interface), not by rewriting the class itself',
      'States that calling saveReport() as this.saveReport() from within the same class is a self-invocation that bypasses the proxy entirely, so no transactional advice runs',
      'Gives at least one concrete fix that routes the call back through the proxy: a separate collaborator bean, an injected self-reference, or AopContext.currentProxy() with exposeProxy enabled',
      'Notes that only public methods called from outside the class (through an injected/proxy reference) can be advised — a private method can never be advised this way',
    ],
    tags: ['transactional', 'proxy', 'aop', 'self-invocation'],
    source: 'topic-list',
    explanation:
      "This is the single most common `@Transactional` gotcha in real codebases, and it rarely announces itself as a proxy question — it shows up as \"why didn't this roll back\" days after the code was written and reviewed. The trap for candidates who know `@Transactional` exists but not how it's implemented is assuming annotations act on the method wherever it's called from, rather than only on calls that cross the proxy boundary.\n\n**Say this out loud:** \"`@Transactional` only fires on calls that go through the bean's proxy, so calling `saveReport()` as `this.saveReport()` from inside the same class bypasses it entirely; I'd move that method to a separate bean or inject a self-reference so the call goes back out through the proxy.\"",
  },
  {
    id: 'spring-boot-controlleradvice-problemdetail',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'web',
    level: 'senior',
    kind: 'single',
    prompt:
      "```java\n@RestControllerAdvice\npublic class ApiExceptionHandler {\n\n    @ExceptionHandler(ProductNotFoundException.class)\n    public ProblemDetail handleNotFound(ProductNotFoundException ex) {\n        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());\n        problem.setProperty(\"productId\", ex.getProductId());\n        return problem;\n    }\n}\n```\nSpring Framework 6 added first-class support for `ProblemDetail` (RFC 7807/9457). Which statement best describes what this handler achieves compared to hand-rolling a custom error DTO?",
    options: [
      {
        id: 'a',
        text: '`ProblemDetail` is a built-in representation of the "problem+json" format, with the standard fields (`type`, `title`, `status`, `detail`, `instance`) plus arbitrary extension members via `setProperty`; returning it from an `@ExceptionHandler` lets Spring MVC serialize it as `application/problem+json`, taking the HTTP status from the object itself, giving every endpoint a consistent, standards-based error shape instead of a bespoke DTO per team',
      },
      { id: 'b', text: '`ProblemDetail` replaces `@ExceptionHandler` entirely: annotating a class `@RestControllerAdvice` with no `@ExceptionHandler` methods at all automatically converts every uncaught exception in the application into an RFC 7807 response' },
      { id: 'c', text: 'Returning a `ProblemDetail` from this method makes Spring roll back any open database transaction automatically, which a hand-written error DTO would not do, because `ProblemDetail` participates in transaction synchronization' },
      { id: 'd', text: '`ProblemDetail` only works when the handler method\'s return type is `ResponseEntity<ProblemDetail>`; returning a bare `ProblemDetail`, as this method does, is ignored by Spring MVC and the client receives an empty `200 OK`' },
    ],
    answer: 'a',
    tags: ['controller-advice', 'problem-detail', 'error-handling', 'rest'],
    source: 'topic-list',
    explanation:
      "`ProblemDetail` standardizes what used to be an ad-hoc error DTO per application: it models RFC 7807/9457's fields directly, `setProperty` covers domain-specific extensions like `productId`, and Spring MVC has dedicated support for serializing it as `application/problem+json` and for deriving the response's HTTP status from `ProblemDetail.getStatus()` when the method returns a bare `ProblemDetail` rather than a `ResponseEntity` — which is exactly why option d is wrong; wrapping it in `ResponseEntity` is only needed when extra headers must be set, not for the status or body to work. Option b overstates it: `@ExceptionHandler` methods (or `ResponseEntityExceptionHandler` overrides) still have to be written to catch specific exception types and build the `ProblemDetail`; nothing generates them automatically from an empty advice class. Option c is fabricated — `ProblemDetail` is a plain data carrier with no relationship to transaction synchronization; any rollback still depends on the normal `@Transactional` rollback rules for the exception being thrown.\n\n**Say this out loud:** \"`ProblemDetail` is Spring's built-in RFC 7807 error shape, and returning it bare from an `@ExceptionHandler` is enough — Spring MVC reads the status off the object itself and serializes it as `application/problem+json` without needing a `ResponseEntity` wrapper.\"",
  },
  {
    id: 'spring-boot-n-plus-one-lazy-loading',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'data-jpa',
    level: 'senior',
    kind: 'open',
    prompt:
      "```java\n@Entity\npublic class Author {\n    @Id @GeneratedValue\n    private Long id;\n    private String name;\n\n    @OneToMany(mappedBy = \"author\")\n    private List<Book> books;\n}\n\n@Transactional(readOnly = true)\npublic List<AuthorSummary> listAuthorsWithBookCount() {\n    List<Author> authors = authorRepository.findAll();\n    return authors.stream()\n        .map(a -> new AuthorSummary(a.getName(), a.getBooks().size()))\n        .toList();\n}\n```\nFor 200 authors, this method fires 201 SQL statements, and — if the collection were instead accessed outside a transaction, or with `spring.jpa.open-in-view=false` and no active session by the time `.getBooks()` runs — it could throw `LazyInitializationException` instead. Explain both problems and how you'd fix each.",
    modelAnswer:
      "The 201 queries are a classic N+1: `authorRepository.findAll()` issues one `SELECT` for the authors, and `@OneToMany` defaults to `FetchType.LAZY`, so `books` is left as an uninitialized proxy/collection on each `Author`. The first time `a.getBooks()` runs inside the stream, Hibernate fires a separate `SELECT ... WHERE author_id = ?` for that one author's books — one extra query per author, so 1 + 200 = 201 total, growing linearly with the author count. The fix is to stop loading books one author at a time: either add `JOIN FETCH` to a JPQL finder (`SELECT a FROM Author a LEFT JOIN FETCH a.books`) or annotate the repository method with `@EntityGraph(attributePaths = \"books\")`, either of which turns this into a single SQL join instead of N follow-up selects. For this specific use case — only the *count* of books is needed, not the books themselves — an even better fix is to skip loading the `Book` entities entirely and query a projection with `COUNT(b) GROUP BY a.id` (or a derived/`@Query` method returning `Map<Long, Long>` or a DTO), which avoids pulling potentially large book rows into memory just to call `.size()`.\n\n`LazyInitializationException` is a separate, related problem: a lazy proxy or collection needs an open Hibernate session (the active persistence context) to run its lazy-load query the first time it's touched. If `.getBooks()` is called after the `@Transactional` method has returned and its session has closed — or with Spring Boot's `open-in-view` disabled and no transaction active at all — there is no session left to run that query, and Hibernate throws instead of silently loading. Spring Boot's default, `spring.jpa.open-in-view=true`, avoids this symptom by keeping the Hibernate session open for the entire HTTP request (including view rendering), so lazy access anywhere down the call stack quietly succeeds — but it does that by hiding N+1 queries like this one outside the visible `@Transactional` boundary, holding a database connection checked out for longer than necessary, and making it hard to reason about when queries actually run just by reading the service layer. The recommended fix is to turn `open-in-view` off explicitly and make sure every association a use case actually needs is fetched inside the `@Transactional` method itself — via `JOIN FETCH`/`@EntityGraph` or an explicit access before the method returns — so the transaction boundary and the query boundary are the same boundary.",
    rubric: [
      'Identifies the N+1 cause: @OneToMany defaults to LAZY, so each a.getBooks() call in the loop fires its own SELECT, giving 1+N total queries',
      'Proposes JOIN FETCH or @EntityGraph as the fix that collapses the N+1 into a single query, and ideally also mentions a COUNT/GROUP BY projection for a count-only case like this one',
      'Explains LazyInitializationException as a lazy proxy/collection needing an open Hibernate session that is no longer available by the time it is accessed',
      'Explains what open-in-view does (keeps the session open for the whole request) and that it masks the N+1 rather than fixing it, at the cost of hidden queries and a longer-held connection',
      'Recommends disabling open-in-view and fetching everything a use case needs inside the @Transactional method itself',
    ],
    tags: ['n-plus-one', 'lazy-loading', 'entity-graph', 'open-in-view', 'hibernate'],
    source: 'topic-list',
    explanation:
      "This scenario deliberately pairs two related but distinct senior-level facts: N+1 is a performance bug that happens to work, while `LazyInitializationException` is a correctness bug that fails loudly — and `open-in-view` sits in between, turning the second into a silent, expensive version of the first instead of actually fixing it.\n\n**Say this out loud:** \"The 201 queries are N+1 from the lazy `@OneToMany` being touched per author in a loop, fixed with `JOIN FETCH` or `@EntityGraph`; `open-in-view` only hides `LazyInitializationException` by keeping the session open for the whole request, so I'd turn it off and fetch what I need inside the transaction instead.\"",
  },
];
