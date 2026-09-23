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
        text: '`@SpringBootConfiguration` (itself meta-annotated with `@Configuration`, so the class is a source of bean definitions), `@EnableAutoConfiguration` (lets Spring Boot configure beans from the classpath and any properties it finds), and `@ComponentScan` (scans the annotated class\'s package, and its subpackages, for components)',
      },
      { id: 'b', text: '`@Controller`, `@Service` and `@Repository` — it bundles the three stereotype annotations so every class in the project is automatically treated as all three at once, regardless of what that class actually declares itself to be, effectively turning the whole codebase into web, service and persistence beans simultaneously' },
      { id: 'c', text: 'Only `@EnableAutoConfiguration`; `@Configuration` (or `@SpringBootConfiguration`) and `@ComponentScan` still have to be added separately on the same class, or component scanning and any manually declared `@Bean` methods silently stop working the next time the application context rebuilds' },
      { id: 'd', text: '`@SpringBootTest`, `@ExtendWith(SpringExtension.class)` and `@AutoConfigureMockMvc` — it wires up a full test application context, including a mock `MockMvc` bean and transactional test rollback, for every class annotated with it, test class or not' },
    ],
    answer: 'a',
    tags: ['spring-boot-application', 'auto-configuration', 'component-scan', 'fundamentals'],
    source: 'topic-list',
    explanation:
      '`@SpringBootApplication` is itself meta-annotated with exactly these three: `@SpringBootConfiguration` (which is itself meta-annotated with `@Configuration`) so the class can also declare `@Bean` methods, `@EnableAutoConfiguration` so Spring Boot inspects the classpath (and any `@ConditionalOn...` guards) to configure beans like an embedded Tomcat or a `DataSource` without XML, and `@ComponentScan` rooted at the annotated class\'s package so `@Component`/`@Service`/`@Repository`/`@Controller` classes underneath it are discovered automatically. Option b confuses the stereotype annotations (which mark individual classes for scanning) with what `@SpringBootApplication` itself does — it does not retroactively stereotype every class in the project. Option c is wrong because `@Configuration`-via-`@SpringBootConfiguration` and `@ComponentScan` are already included; adding them again would be redundant, not required. Option d confuses this with testing annotations, which are a separate, opt-in concern for test classes only — `@SpringBootTest` is never implied by `@SpringBootApplication`.',
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
      { id: 'b', text: "It's a repository interface, but only the inherited CRUD methods from `JpaRepository` (`save`, `findById`, and so on) actually work at runtime; a derived-query method like `findByNameContainingIgnoreCase` compiles but throws `UnsupportedOperationException` when called, because Spring Data cannot generate real SQL from a method name alone — that needs an explicit `@Query` annotation" },
      { id: 'c', text: "It only works because `Product` implements `Serializable`; Spring builds the implementation by reflecting over `Product`'s getters and setters at startup, not over `ProductRepository` itself, and the method name is discarded" },
      { id: 'd', text: 'The `@SpringBootApplication` class must declare a `@Bean` method that returns `new ProductRepositoryImpl()`; the proxy is generated at compile time by an annotation processor invoked from that bean method, similar to how Lombok generates code from `@Getter`' },
    ],
    answer: 'a',
    tags: ['spring-data-jpa', 'repository', 'fundamentals'],
    source: 'topic-list',
    explanation:
      'Spring Data JPA repository interfaces need no hand-written implementation: at startup, the Spring Data infrastructure finds every interface extending one of its base repository interfaces (`Repository`, `CrudRepository`, `JpaRepository`, and so on) inside the scanned packages and generates a proxy — backed by `SimpleJpaRepository` for the inherited methods — that is registered as a Spring bean under that interface type. Query methods with no body, like `findByNameContainingIgnoreCase`, are handled by parsing the method name into a JPQL query at startup (`Containing` becomes a `LIKE %...%`, `IgnoreCase` wraps both sides in a case-insensitive comparison) — that derivation is exactly what makes the method callable without `@Query`, which is why option b has it backwards. No compiler or annotation processor generates a real `ProductRepositoryImpl` class at build time, which rules out option d; this is a runtime proxy, not generated code. `Serializable` on the entity is unrelated to how the repository proxy is built, which rules out option c.',
  },
  {
    id: 'spring-boot-circular-dependency-boot26',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'beans-and-di',
    level: 'mid',
    kind: 'single',
    prompt:
      "```java\n@Service\npublic class OrderService {\n    @Autowired\n    private PaymentService paymentService;\n}\n\n@Service\npublic class PaymentService {\n    @Autowired\n    private OrderService orderService;\n}\n```\nThis project starts fine on Spring Boot 2.5. After upgrading to Spring Boot 3.x, startup fails with `BeanCurrentlyInCreationException`, reporting a circular reference between `orderService` and `paymentService`. What changed, and what's the recommended fix?",
    options: [
      {
        id: 'a',
        text: "Spring can resolve a field/setter circular dependency by exposing an early, unfinished reference to each bean while the other is under construction — but since Boot 2.6, `spring.main.allow-circular-references` defaults to `false`, so the cycle now fails fast at startup. Flipping it to `true` silences the exception but isn't the fix; break the cycle instead, e.g. with `@Lazy` on one field",
      },
      { id: 'b', text: "Switching both fields to constructor injection — `OrderService(PaymentService paymentService)` and the mirror in `PaymentService` — fixes the cycle outright, since constructor injection resolves circular references more reliably than field injection does and is the generally recommended style" },
      { id: 'c', text: 'The exception means `OrderService` and `PaymentService` must both be annotated `@Primary`; adding `@Primary` to either class tells Spring which of two ambiguous candidate beans to prefer, resolving the ambiguity that triggers the circular-reference check at context startup' },
      { id: 'd', text: 'Annotating one class with `@DependsOn("paymentService")` tells Spring to fully construct and initialize that bean before the other one starts, which breaks the circular reference here without requiring any change to how either service is injected or constructed' },
    ],
    answer: 'a',
    tags: ['dependency-injection', 'circular-dependency', 'bean-lifecycle'],
    source: 'topic-list',
    explanation:
      "Field/setter-injected circular dependencies used to work because Spring instantiates each singleton with its default constructor first, caches an early reference to that not-fully-populated instance, and only performs field/setter injection afterward — so `orderService` and `paymentService` can each receive a reference to the other's early instance. (Constructor-injected cycles are a different story and have never been resolvable this way, in any Spring version, because a constructor needs its arguments before the object exists at all.) Spring Boot 2.6 changed the default of `spring.main.allow-circular-references` to `false`, so the same field-injection cycle that quietly worked on 2.5 now fails fast with `BeanCurrentlyInCreationException` instead. Flipping the property back to `true` restores the old behavior but just re-hides a design smell; the recommended fix is to remove the cycle, most commonly with `@Lazy` on one of the two injected fields so that side is only resolved (through a proxy) the first time it's actually used, well after both beans finish construction. Option b is the trap answer: constructor injection does not fix this cycle — it makes it strictly worse, since a genuine constructor-to-constructor cycle can never be resolved by Spring at all (the object cannot exist before its own constructor argument does), so it fails unconditionally instead of only when `allow-circular-references` is `false`. Option c is fabricated — `@Primary` breaks ties between multiple *candidate* beans for one injection point and has nothing to do with cycles. Option d is also wrong: `@DependsOn` only controls bean creation *order* between beans that don't otherwise reference each other; it does nothing to satisfy the direct field dependency each class still declares, so the same `BeanCurrentlyInCreationException` would still be thrown.",
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
        text: "`@RequestBody` deserializes the JSON body into a `CreateOrderRequest` via a registered `HttpMessageConverter` (Jackson by default); with `spring-boot-starter-validation` on the classpath, `@Valid` then runs the constraints on `CreateOrderRequest`'s fields, and a failing one rejects the request with `400 Bad Request` (`MethodArgumentNotValidException`) before `create` runs",
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
      "a and b describe the standard, well-defined behavior of `@RequestBody`/`@Valid` (including that `@Valid` only does anything once a Bean Validation provider such as Hibernate Validator, pulled in by `spring-boot-starter-validation`, is on the classpath) and `@PathVariable`/`@RequestParam`, and are correct as written. d is also correct: `@RestController` is exactly `@Controller` + `@ResponseBody`, which is why handler methods return data instead of a view name. c is false — `@RestController` applies `@ResponseBody` to every handler regardless of return type, so a plain `OrderResponse` is serialized to JSON with a default `200 OK` just fine; `ResponseEntity` is only needed when the method wants to control the status code, headers, or both explicitly (as `create` does here to return `201 Created`), not to make serialization possible. e is false — `@Valid` with no constraints on the target type is a harmless no-op: validation runs, finds nothing to check, and the request proceeds; it causes neither a startup failure nor a runtime error.",
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
        text: '`SimpleJpaRepository.save` decides insert vs. update via `isNew()` — a `@Version` field if present (`null` means new), else the id (`null`, or `0` for a primitive); `@GeneratedValue` plays no part. `id == null` means `persist`, an `INSERT`. A non-null `id` with no matching row means `merge`: a `SELECT` finds nothing, and on Hibernate 6.6+ (Boot 3.4/3.5) that throws `ObjectOptimisticLockingFailureException`; on ≤ 6.5 it inserted under a fresh id, discarding yours',
      },
      { id: 'b', text: '`save` always performs an `INSERT` no matter what `id` holds; if a row with that `id` already exists, the database rejects it with a primary-key violation, so `save` can never be used to update an existing row — a separate `update` method has to be added to the repository for that, the way older, hand-written DAO layers used to split `create`/`update`' },
      { id: 'c', text: 'Whether `save` inserts or updates depends only on whether the surrounding transaction is `@Transactional(readOnly = true)`: a read-only transaction always results in `merge` so nothing is ever actually written, and a writable one always results in `persist`, regardless of what `id` holds or whether a matching row exists' },
      { id: 'd', text: 'Because `Product` uses `GenerationType.IDENTITY`, Hibernate can only assign the id after the row is inserted, so calling `save` with a non-null, not-yet-persisted `id` throws `IdentifierGenerationException` immediately, before any SQL reaches the database, regardless of which Hibernate version is on the classpath' },
    ],
    answer: 'a',
    tags: ['spring-data-jpa', 'save', 'merge', 'hibernate'],
    source: 'topic-list',
    explanation:
      "This is a well-known gotcha because, on older Hibernate versions, both paths eventually inserted a row, so the difference was easy to miss in a quick test; on current Hibernate 6.6+ it's no longer subtle at all, since the non-null-id path now fails outright instead of quietly duplicating the row under a new key. `isNew()` — the check `save` relies on internally — looks at `@Version` first when the entity has one, and only falls back to the id when it doesn't; `@GeneratedValue` never enters into it, it only controls how a *new* id gets its value once `persist` is chosen. Option b is wrong — `save` is Spring Data's combined create-or-update entry point precisely so callers don't need a separate `update` method; it routes to `persist` or `merge` depending on the new/not-new check, not always to `INSERT`. Option c is fabricated — `readOnly` only affects how the transaction is configured (e.g. a hint to skip dirty checking and, on some drivers, mark the connection read-only); it plays no part in the persist-vs-merge decision, and a read-only transaction does not silently turn writes into no-ops. Option d is wrong — Hibernate does not reject a non-null id up front regardless of version; it uses the id's non-null value to decide the entity is 'not new' and proceeds down the merge path described in option a, whose outcome does depend on the Hibernate version in use.",
  },
  {
    id: 'spring-boot-transactional-self-invocation',
    domain: 'frameworks',
    subject: 'spring-boot',
    topic: 'beans-and-di',
    level: 'senior',
    kind: 'open',
    prompt:
      "```java\n@Service\npublic class ReportService {\n\n    public void generateMonthlyReport() {\n        // ... build the report ...\n        saveReport();\n    }\n\n    @Transactional\n    public void saveReport() {\n        reportRepository.save(report);\n        auditRepository.save(audit);\n    }\n}\n```\nA caller injects `ReportService` and calls `generateMonthlyReport()`. Both repository writes inside `saveReport()` happen, but `@Transactional` on `saveReport()` never takes effect: `SimpleJpaRepository.save` is itself `@Transactional`, so `reportRepository.save(report)` and `auditRepository.save(audit)` each open and commit their own separate transaction instead of sharing one. If `auditRepository.save(audit)` throws, `reportRepository.save(report)` has already committed and cannot be rolled back. Why does `@Transactional` on `saveReport()` never take effect here, and how would you restructure the code to fix it?",
    modelAnswer:
      "By default, Spring implements `@Transactional` (and `@Cacheable`, `@Async`) with proxy-based AOP: for a class-based bean like this one (no interface), Spring creates a CGLIB subclass of `ReportService` at startup and registers *that proxy* as the bean other components get injected with. The proxy overrides `saveReport()` to open a transaction, invoke the real method on the underlying target, and commit or roll back around it. That interception only happens for calls that arrive *through the proxy reference*. Inside `generateMonthlyReport()`, the call `saveReport()` is really `this.saveReport()` — a plain Java virtual call on the raw target object, made from code that is itself already running inside the target (the proxy already delegated into it to run `generateMonthlyReport()`). That call never goes back out through the proxy, so the transactional advice Spring wove around `saveReport()` never fires. That does not mean the two writes run with no transaction at all, though: `SimpleJpaRepository`'s own `save` method is itself annotated `@Transactional`, so each of `reportRepository.save(report)` and `auditRepository.save(audit)` still opens and commits its own transaction when called with none already active. The real defect is that the two writes no longer share *one* atomic transaction — if the second save throws, the first has already committed on its own and cannot be rolled back with it. The same self-invocation rule applies identically to `@Cacheable` and `@Async`. It is not quite true that proxy-based advice can only ever reach public methods: since Spring Framework 6.0, CGLIB proxies can also advise protected and package-private methods, though `final` methods and true self-calls are still out of reach for any proxy, because a proxy can only intercept calls that arrive at it from outside, never a call a bean makes to itself. AspectJ mode (compile-time or load-time weaving) is the one approach that *can* advise self-invocations and private methods, since it rewrites the class's own bytecode instead of wrapping it in a proxy. Without switching AOP modes, the fix is to route the call through the proxy instead of through `this`: the cleanest option is to move `saveReport()` into its own collaborator bean and have `ReportService` call that bean; alternatively, inject a self-reference (`@Lazy @Autowired private ReportService self;`) and call `self.saveReport()`, or enable `@EnableAspectJAutoProxy(exposeProxy = true)` and call `((ReportService) AopContext.currentProxy()).saveReport()`. Extracting a collaborator bean is usually preferred because it doesn't depend on proxy internals and keeps the class's public API honest about what's transactional.",
    rubric: [
      'Identifies that @Transactional (like @Cacheable and @Async) is implemented by wrapping the bean in a proxy (CGLIB subclass here, since there is no interface), not by rewriting the class itself',
      'States that calling saveReport() as this.saveReport() from within the same class is a self-invocation that bypasses the proxy entirely, so the transactional advice on saveReport() never runs',
      'Gives at least one concrete fix that routes the call back through the proxy: a separate collaborator bean, an injected self-reference, or AopContext.currentProxy() with exposeProxy enabled',
      'Notes that each repository save still runs in its own transaction (SimpleJpaRepository.save is itself @Transactional), so the real defect is two separate commits instead of one shared, atomic transaction',
    ],
    tags: ['transactional', 'proxy', 'aop', 'self-invocation'],
    source: 'topic-list',
    explanation:
      "This is the single most common `@Transactional` gotcha in real codebases, and it rarely announces itself as a proxy question — it shows up as \"why didn't this roll back\" days after the code was written and reviewed. The trap for candidates who know `@Transactional` exists but not how it's implemented is assuming annotations act on the method wherever it's called from, rather than only on calls that cross the proxy boundary.\n\n**Say this out loud:** \"`@Transactional` only fires on calls that go through the bean's proxy, so `this.saveReport()` bypasses it and each repository save commits on its own. I'd move `saveReport()` to a separate bean, or inject a self-reference, so the call goes back out through the proxy.\"",
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
      { id: 'b', text: 'Setting `spring.mvc.problemdetails.enabled=true` in `application.properties` would make this `@ExceptionHandler` unnecessary, since Spring Boot\'s built-in handling already converts every exception, custom application exceptions like `ProductNotFoundException` included, into a `ProblemDetail` automatically' },
      { id: 'c', text: 'Because `@RestControllerAdvice` is declared here with no `basePackages` or `assignableTypes` attribute, `ApiExceptionHandler` only applies to controllers in the same package as `ApiExceptionHandler` itself; handling exceptions thrown by controllers in other packages needs one `@RestControllerAdvice` per package' },
      { id: 'd', text: '`ProblemDetail` only works when the handler method\'s return type is exactly `ResponseEntity<ProblemDetail>`; returning a bare `ProblemDetail` object, the way this method does, is silently ignored by Spring MVC\'s message-conversion machinery and the client receives an empty `200 OK` response body instead' },
    ],
    answer: 'a',
    tags: ['controller-advice', 'problem-detail', 'error-handling', 'rest'],
    source: 'topic-list',
    explanation:
      "`ProblemDetail` standardizes what used to be an ad-hoc error DTO per application: it models RFC 7807/9457's fields directly, `setProperty` covers domain-specific extensions like `productId`, and Spring MVC has dedicated support for serializing it as `application/problem+json` and for deriving the response's HTTP status from `ProblemDetail.getStatus()` when the method returns a bare `ProblemDetail` rather than a `ResponseEntity` — which is exactly why option d is wrong; wrapping it in `ResponseEntity` is only needed when extra headers must be set, not for the status or body to work. Option b overstates what the `spring.mvc.problemdetails.enabled` property actually does: it makes Spring Boot's *own* built-in exceptions (`NoHandlerFoundException`, `HttpRequestMethodNotSupportedException`, and the like) render as `ProblemDetail` through a default `ResponseEntityExceptionHandler`, but it has no idea `ProductNotFoundException` exists — a custom, domain-specific exception still needs exactly the handler shown here. Option c is backwards: with no `basePackages`/`assignableTypes`/`annotations` narrowing, `@RestControllerAdvice` applies globally, to every controller in the application, not just to classes in its own package.\n\n**Say this out loud:** \"`ProblemDetail` is Spring's built-in RFC 9457 (formerly 7807) error shape, and returning it directly from an `@ExceptionHandler` is enough — Spring MVC reads the status off the object and serializes it as `application/problem+json` without a `ResponseEntity` wrapper.\"",
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
      "The 201 queries are a classic N+1: `authorRepository.findAll()` issues one `SELECT` for the authors, and `@OneToMany` defaults to `FetchType.LAZY`, so `books` is left as an uninitialized proxy/collection on each `Author`. The first time `a.getBooks()` runs inside the stream, Hibernate fires a separate `SELECT ... WHERE author_id = ?` for that one author's books — one extra query per author, so 1 + 200 = 201 total, growing linearly with the author count. The fix is to stop loading books one author at a time: either add `JOIN FETCH` to a JPQL query method (`SELECT a FROM Author a LEFT JOIN FETCH a.books`) or annotate the repository method with `@EntityGraph(attributePaths = \"books\")`, either of which turns this into a single SQL join instead of N follow-up selects. For this specific use case — only the *count* of books is needed, not the books themselves — an even better fix is to skip loading the `Book` entities entirely and query a projection instead, e.g. a `@Query(\"SELECT new com.example.AuthorBookCount(a.name, COUNT(b)) FROM Author a LEFT JOIN a.books b GROUP BY a.id, a.name\")` returning a `record AuthorBookCount(String name, long bookCount) {}`. The join has to stay a `LEFT JOIN`, not an inner join, or authors with zero books would be dropped from the result instead of showing a count of zero; this avoids pulling potentially large `Book` rows into memory just to call `.size()`.\n\n`LazyInitializationException` is a separate, related problem, and `open-in-view` is not what causes the N+1 above — `listAuthorsWithBookCount` is already `@Transactional`, so a Hibernate session is open for the whole method regardless of the `open-in-view` setting, and all 201 queries happen inside that one transaction either way. A lazy proxy or collection needs an open Hibernate session (the active persistence context) to run its lazy-load query the first time it's touched; the exception shows up when `.getBooks()` is called *after* that session has closed — for example, from a `@Transactional`-free caller, or later while Jackson serializes the response outside any transaction. Spring Boot's default, `spring.jpa.open-in-view=true`, avoids that specific exception by keeping the Hibernate session open for the rest of the HTTP request (including serialization/view rendering), so lazy access anywhere further down the stack quietly succeeds instead of throwing — but it does that by letting the same kind of N+1 queries fire invisibly outside any explicit `@Transactional` boundary, and by holding a database connection checked out for longer than necessary. The recommended fix is to turn `open-in-view` off explicitly and make sure every association a use case needs — including anything touched during serialization — is fetched inside the owning `@Transactional` method itself, via `JOIN FETCH`/`@EntityGraph` or a projection, so the transaction boundary and the query boundary are the same boundary.",
    rubric: [
      'Identifies the N+1 cause: @OneToMany defaults to LAZY, so each a.getBooks() call in the loop fires its own SELECT, giving 1+N total queries',
      'Proposes JOIN FETCH or @EntityGraph as the fix that collapses the N+1 into a single query, and ideally also mentions a LEFT JOIN + GROUP BY / DTO projection for a count-only case like this one',
      'Explains LazyInitializationException as a lazy proxy/collection needing an open Hibernate session that is no longer available by the time it is accessed',
      'States that open-in-view keeps the Hibernate session open for the rest of the HTTP request so LazyInitializationException is hidden and N+1-shaped queries can still fire outside the service layer (e.g. during serialization) — and that this masks the problem rather than fixing it, not that it causes the N+1 inside the already-@Transactional method',
      'Recommends disabling open-in-view and fetching everything a use case needs inside the @Transactional method itself',
    ],
    tags: ['n-plus-one', 'lazy-loading', 'entity-graph', 'open-in-view', 'hibernate'],
    source: 'topic-list',
    explanation:
      "This scenario deliberately pairs two related but distinct senior-level facts: N+1 is a performance bug that happens to work, while `LazyInitializationException` is a correctness bug that fails loudly — and `open-in-view` sits in between, turning the second into a silent, expensive version of the first instead of actually fixing it.\n\n**Say this out loud:** \"The 201 queries are N+1 from the lazy `@OneToMany` touched per author in a loop, fixed with `JOIN FETCH` or `@EntityGraph`. `open-in-view` only hides `LazyInitializationException` by keeping the session open past the transaction, so I'd turn it off and fetch what I need inside the `@Transactional` method instead.\"",
  },
];
